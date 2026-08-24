import crypto from 'crypto';
import { dbConnect } from '../db/mongodb';
import { MonitorModel, IMonitorDocument } from '@/models/Monitor';
import { CommentModel } from '@/models/Comment';
import { AlertModel } from '@/models/Alert';
import { CrawlLogModel } from '@/models/CrawlLog';
import { getScraperProvider, getRedditProvider, getSentimentProvider, getEmailProvider } from '../providers/factory';
import { InternalRedditComment, SeverityLevel, SentimentClassificationResult } from '@/types/domain';
import { CrawlResultData } from '@/types/api';

const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes lock timeout

export async function processMonitorCrawl(monitorId: string): Promise<CrawlResultData> {
  await dbConnect();

  const monitor: IMonitorDocument | null = await MonitorModel.findById(monitorId);
  if (!monitor) {
    throw new Error(`Monitor with ID ${monitorId} not found`);
  }

  // 1. Concurrency Locking Check
  const now = new Date();
  if (
    monitor.crawlLockId &&
    monitor.crawlStartedAt &&
    now.getTime() - new Date(monitor.crawlStartedAt).getTime() < LOCK_TTL_MS
  ) {
    console.warn(`🔒 Monitor [${monitor.name}] is currently locked by run ${monitor.crawlLockId}. Skipping concurrent execution.`);
    throw new Error(`Monitor crawl already in progress (Locked).`);
  }

  // Acquire Lock
  const lockId = crypto.randomUUID();
  monitor.crawlLockId = lockId;
  monitor.crawlStartedAt = now;
  monitor.lastCrawlStatus = 'running';
  await monitor.save();

  const crawlLog = new CrawlLogModel({
    monitorId: monitor._id,
    startedAt: now,
    status: 'running',
  });
  await crawlLog.save();

  try {
    const platform = monitor.platform || 'reddit';
    const scraperProvider = getScraperProvider(platform);
    const sentimentProvider = getSentimentProvider();
    const emailProvider = getEmailProvider();

    console.log(`\n==================================================`);
    console.log(`🕷️ Starting monitor crawl for: "${monitor.name}" (${platform.toUpperCase()}) -> ${monitor.redditUrl}`);
    console.log(`Providers: Scraper [${scraperProvider.name}] | AI [${sentimentProvider.name}] | Email [${emailProvider.name}]`);

    // 2. Retrieve Comments via Scraper Provider
    const fetchedComments: InternalRedditComment[] = await scraperProvider.fetchComments(monitor.redditUrl, platform);
    console.log(`📥 Fetched ${fetchedComments.length} raw comments from ${platform} provider`);

    // 3. Deduplicate against MongoDB (Incremental Comment Processing)
    const existingCommentDocs = await CommentModel.find(
      { monitorId: monitor._id },
      { redditCommentId: 1, body: 1 }
    ).lean();

    const existingCommentIdSet = new Set(existingCommentDocs.map((c) => c.redditCommentId));
    const existingCommentBodySet = new Set(
      existingCommentDocs.map((c) => c.body.trim().toLowerCase())
    );

    const newCommentsToProcess = fetchedComments.filter(
      (c) =>
        !existingCommentIdSet.has(c.redditCommentId) &&
        !existingCommentBodySet.has(c.body.trim().toLowerCase())
    );

    console.log(`🔍 Deduplication: ${fetchedComments.length} total, ${existingCommentDocs.length} already in DB, ${newCommentsToProcess.length} NEW comments to analyze`);

    let newNegativeCount = 0;
    let alertSent = false;
    const createdCommentDocs = [];

    // 4. Analyze ONLY newly discovered comments with Gemini
    if (newCommentsToProcess.length > 0) {
      const classifications: SentimentClassificationResult[] =
        await sentimentProvider.analyzeComments(newCommentsToProcess);

      const classificationMap = new Map<string, SentimentClassificationResult>();
      classifications.forEach((res) => classificationMap.set(res.redditCommentId, res));

      // Build MongoDB comment documents
      const docsToInsert = newCommentsToProcess.map((item) => {
        const ai = classificationMap.get(item.redditCommentId) || {
          redditCommentId: item.redditCommentId,
          isNegative: false,
          sentiment: 'neutral' as const,
          severity: 'low' as const,
          category: 'other' as const,
          confidence: 0.5,
          summary: 'Unclassified comment',
        };

        return {
          platform: platform,
          redditCommentId: item.redditCommentId,
          monitorId: monitor._id,
          postId: item.postId || monitor.redditPostId,
          author: item.author,
          body: item.body,
          redditUrl: item.redditUrl,
          redditCreatedAt: item.createdAt,
          processedAt: new Date(),

          isNested: Boolean(item.isNested),
          parentId: item.parentId || null,

          isNegative: ai.isNegative,
          sentiment: ai.sentiment,
          severity: ai.severity,
          category: ai.category,
          confidence: ai.confidence,
          summary: ai.summary,
          alertSent: false,
        };
      });

      // Save to MongoDB using bulk insert / ordered insert ignore duplicate keys
      const savedDocs = await CommentModel.insertMany(docsToInsert, { ordered: false }).catch(
        (err: unknown) => {
          console.warn('⚠️ Minor MongoDB bulk insert warning (some duplicates skipped):', err);
          return CommentModel.find({
            monitorId: monitor._id,
            redditCommentId: { $in: newCommentsToProcess.map((c) => c.redditCommentId) },
          });
        }
      );

      createdCommentDocs.push(...savedDocs);
      const newNegativeDocs = savedDocs.filter((d) => d.isNegative);
      newNegativeCount = newNegativeDocs.length;

      console.log(`📊 AI Classification Results: ${savedDocs.length} saved, ${newNegativeCount} negative feedback detected`);

      // 5. Send ONE Aggregated Alert Email if new negative comments detected
      if (newNegativeDocs.length > 0) {
        const severityRank: Record<SeverityLevel, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };

        let highestSev: SeverityLevel = 'low';
        newNegativeDocs.forEach((doc) => {
          if (severityRank[doc.severity] > severityRank[highestSev]) {
            highestSev = doc.severity;
          }
        });

        const alertCards = newNegativeDocs.map((doc) => ({
          author: doc.author,
          body: doc.body,
          category: doc.category,
          severity: doc.severity,
          confidence: doc.confidence,
          summary: doc.summary,
          redditUrl: doc.redditUrl,
          isNested: doc.isNested,
        }));

        const emailResult = await emailProvider.sendAlert({
          recipientEmail: monitor.recipientEmail,
          monitorName: monitor.name,
          platform: platform,
          postTitle: monitor.postTitle || monitor.name,
          redditUrl: monitor.redditUrl,
          negativeCount: newNegativeDocs.length,
          highestSeverity: highestSev,
          comments: alertCards,
        });

        if (emailResult.success) {
          alertSent = true;
          // Create Alert record
          const alertRecord = new AlertModel({
            monitorId: monitor._id,
            commentIds: newNegativeDocs.map((d) => d._id),
            recipientEmail: monitor.recipientEmail,
            negativeCommentCount: newNegativeDocs.length,
            highestSeverity: highestSev,
            sentAt: new Date(),
            status: 'sent',
          });
          await alertRecord.save();

          // Mark alertSent = true on new negative comments
          await CommentModel.updateMany(
            { _id: { $in: newNegativeDocs.map((d) => d._id) } },
            { $set: { alertSent: true } }
          );
        } else {
          // Log failed alert
          const alertRecord = new AlertModel({
            monitorId: monitor._id,
            commentIds: newNegativeDocs.map((d) => d._id),
            recipientEmail: monitor.recipientEmail,
            negativeCommentCount: newNegativeDocs.length,
            highestSeverity: highestSev,
            sentAt: new Date(),
            status: 'failed',
            error: emailResult.error || 'Unknown email failure',
          });
          await alertRecord.save();
        }
      }
    }

    // 6. Complete Crawl Log & Release Lock
    crawlLog.completedAt = new Date();
    crawlLog.commentsFetched = fetchedComments.length;
    crawlLog.newComments = newCommentsToProcess.length;
    crawlLog.negativeComments = newNegativeCount;
    crawlLog.alertSent = alertSent;
    crawlLog.status = 'completed';
    await crawlLog.save();

    monitor.lastCheckedAt = new Date();
    monitor.lastCrawlStatus = 'success';
    monitor.crawlLockId = null;
    await monitor.save();

    console.log(`✅ Monitor crawl completed successfully for "${monitor.name}"`);
    console.log(`==================================================\n`);

    return {
      monitorId: monitor._id.toString(),
      commentsFetched: fetchedComments.length,
      newComments: newCommentsToProcess.length,
      negativeComments: newNegativeCount,
      alertSent,
      crawlLogId: crawlLog._id.toString(),
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Monitor crawl failed for "${monitor.name}":`, errorMsg);

    // Record failure in CrawlLog & Monitor
    crawlLog.completedAt = new Date();
    crawlLog.status = 'failed';
    crawlLog.error = errorMsg;
    await crawlLog.save();

    monitor.lastCrawlStatus = 'failed';
    monitor.crawlLockId = null;
    await monitor.save();

    throw error;
  }
}

export async function processAllEnabledMonitors(): Promise<CrawlResultData[]> {
  await dbConnect();
  const enabledMonitors = await MonitorModel.find({ enabled: true });
  console.log(`⏰ Cron triggered: Found ${enabledMonitors.length} active monitors to process.`);

  const results: CrawlResultData[] = [];

  for (const monitor of enabledMonitors) {
    try {
      // Execute each monitor with an isolated error boundary
      const res = await processMonitorCrawl(monitor._id.toString());
      results.push(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`⚠️ Isolated error processing monitor ${monitor._id}:`, msg);
    }
  }

  return results;
}

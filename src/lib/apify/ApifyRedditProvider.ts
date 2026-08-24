import { ApifyClient } from 'apify-client';
import { RedditProvider } from '../providers/types';
import { InternalRedditComment } from '@/types/domain';
import { extractAllCommentsFromItems } from './adapter';
import { parseRedditUrl } from '../validation/schemas';

export class ApifyRedditProvider implements RedditProvider {
  public name = 'Apify Reddit Provider';
  private client: ApifyClient | null = null;
  private actorId: string;
  private maxPollingMs = 90000; // 90 seconds timeout

  constructor() {
    const token = process.env.APIFY_API_TOKEN;
    this.actorId = process.env.APIFY_ACTOR_ID || 'clearpath/reddit-post-comments-bulk-scraper';
    if (token) {
      this.client = new ApifyClient({ token });
    }
  }

  public async fetchComments(redditUrl: string): Promise<InternalRedditComment[]> {
    const { postId } = parseRedditUrl(redditUrl);

    if (this.client) {
      const candidateActors = Array.from(
        new Set([
          this.actorId,
          'clearpath/reddit-post-comments-bulk-scraper',
          'epctex/reddit-scraper',
        ])
      );

      for (const actorToTry of candidateActors) {
        try {
          console.log(`🚀 Executing Apify Actor [${actorToTry}] for Reddit URL: ${redditUrl}`);

          const maxComments = parseInt(process.env.APIFY_MAX_COMMENTS || '50', 10);

          const runInput = {
            urls: [redditUrl],
            startUrls: [redditUrl, { url: redditUrl }],
            maxComments: maxComments,
            maxItems: maxComments,
            maxCommentsPerPost: maxComments,
            scrapeComments: true,
          };

          const run = await this.client.actor(actorToTry).call(runInput, {
            waitSecs: 60,
          });

          let runStatus = run.status;
          const runId = run.id;
          const startTime = Date.now();

          while (
            ['READY', 'RUNNING'].includes(runStatus) &&
            Date.now() - startTime < this.maxPollingMs
          ) {
            console.log(`⏳ Polling Apify run [${runId}]... status: ${runStatus}`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const currentRun = await this.client.run(runId).get();
            if (currentRun) {
              runStatus = currentRun.status;
            }
          }

          if (runStatus === 'SUCCEEDED') {
            const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
            console.log(`📦 Retrieved ${items.length} raw dataset items from Apify [${actorToTry}]`);

            const comments = extractAllCommentsFromItems(items, postId);
            if (comments.length > 0) {
              console.log(`✨ Successfully extracted ${comments.length} comments from Apify [${actorToTry}]`);
              return comments;
            }
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ Apify Actor [${actorToTry}] run notice: ${msg}`);
        }
      }
    }

    return [];
  }
}

import { InternalRedditComment } from '@/types/domain';

export function normalizeComment(raw: Record<string, unknown>, fallbackPostId: string): InternalRedditComment | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // Handle Reddit API native format ({ kind: 't1', data: { body, author, ... } })
  if (raw.kind === 't1' && raw.data && typeof raw.data === 'object') {
    return normalizeComment(raw.data as Record<string, unknown>, fallbackPostId);
  }

  // Extract body text from common field names
  const body =
    (raw.body as string) ||
    (raw.text as string) ||
    (raw.comment as string) ||
    (raw.content as string) ||
    (raw.selftext as string) ||
    '';

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    return null; // Skip empty comments or deleted content
  }

  if (body === '[deleted]' || body === '[removed]') {
    return null;
  }

  // Extract comment ID from common field names
  let redditCommentId =
    (raw.id as string) ||
    (raw.name as string) ||
    (raw.commentId as string) ||
    (raw.parsedId as string);

  if (!redditCommentId) {
    // Generate deterministic hash if ID is missing
    const str = `${raw.author || 'anon'}_${body.slice(0, 30)}_${raw.created_utc || Date.now()}`;
    redditCommentId = `gen_${Buffer.from(str).toString('hex').slice(0, 12)}`;
  }

  // Clean ID if prefixed with t1_ (Reddit comment prefix)
  if (redditCommentId.startsWith('t1_')) {
    redditCommentId = redditCommentId.replace('t1_', '');
  }

  // Ignore post selftext if it matches post ID
  if (redditCommentId === fallbackPostId || redditCommentId === `t3_${fallbackPostId}`) {
    if (raw.title || raw.is_self || raw.upvoteRatio !== undefined) {
      // This raw object is the main Post, not a comment
      return null;
    }
  }

  // Extract author
  const author =
    (raw.author as string) ||
    (raw.username as string) ||
    (raw.user as string) ||
    (raw.authorName as string) ||
    null;

  // Extract URL
  const redditUrl =
    (raw.permalink as string) ||
    (raw.url as string) ||
    (raw.link as string) ||
    (raw.commentUrl as string) ||
    null;

  const fullUrl = redditUrl
    ? redditUrl.startsWith('http')
      ? redditUrl
      : `https://www.reddit.com${redditUrl}`
    : null;

  // Extract creation date
  let createdAt: Date | null = null;
  if (raw.created_utc) {
    const timestamp = typeof raw.created_utc === 'number' ? raw.created_utc * 1000 : String(raw.created_utc);
    createdAt = new Date(timestamp);
  } else if (raw.createdAt) {
    createdAt = new Date(raw.createdAt as string);
  } else if (raw.date) {
    createdAt = new Date(raw.date as string);
  }

  // Extract post ID
  const postId =
    (raw.postId as string) ||
    (raw.link_id as string) ||
    fallbackPostId;

  return {
    redditCommentId: String(redditCommentId),
    postId: String(postId).replace('t3_', ''),
    author: author ? String(author) : null,
    body: body.trim(),
    redditUrl: fullUrl,
    createdAt: createdAt && !isNaN(createdAt.getTime()) ? createdAt : new Date(),
  };
}

export function extractAllCommentsFromItems(
  items: unknown[],
  fallbackPostId: string
): InternalRedditComment[] {
  const result: InternalRedditComment[] = [];
  const seenIds = new Set<string>();

  function traverse(raw: unknown) {
    if (!raw || typeof raw !== 'object') return;
    const obj = raw as Record<string, unknown>;

    // If item contains nested 'data' (Reddit API structure), traverse data
    if (obj.kind === 'Listing' && obj.data && typeof obj.data === 'object') {
      const listingData = obj.data as Record<string, unknown>;
      if (Array.isArray(listingData.children)) {
        listingData.children.forEach(traverse);
      }
    }

    const comment = normalizeComment(obj, fallbackPostId);
    if (comment && !seenIds.has(comment.redditCommentId)) {
      seenIds.add(comment.redditCommentId);
      result.push(comment);
    }

    // Traverse nested comment trees common in Apify dataset structures
    if (Array.isArray(obj.comments)) {
      obj.comments.forEach(traverse);
    }
    if (Array.isArray(obj.replies)) {
      obj.replies.forEach(traverse);
    }
    if (Array.isArray(obj.childComments)) {
      obj.childComments.forEach(traverse);
    }
    if (Array.isArray(obj.children)) {
      obj.children.forEach(traverse);
    }
  }

  items.forEach(traverse);
  return result;
}

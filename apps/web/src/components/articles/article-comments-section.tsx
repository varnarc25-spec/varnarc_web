'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@varnarc/ui';

export type ArticleComment = {
  id: string;
  articleId: string;
  userId?: string | null;
  parentId?: string | null;
  body: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  } | null;
};

type Props = {
  articleId: string;
  initialComments: ArticleComment[];
  initialTotal: number;
  canComment: boolean;
  currentUserId?: string | null;
};

function displayName(user: ArticleComment['user']) {
  if (!user) return 'Reader';
  return user.displayName || user.username || 'Reader';
}

function buildThreads(comments: ArticleComment[]) {
  const byParent = new Map<string | null, ArticleComment[]>();
  for (const comment of comments) {
    const key = comment.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(comment);
    byParent.set(key, list);
  }
  return byParent;
}

function CommentRow({
  comment,
  depth,
  canComment,
  currentUserId,
  articleId,
  onReplyPosted,
  onDeleted,
}: {
  comment: ArticleComment;
  depth: number;
  canComment: boolean;
  currentUserId?: string | null;
  articleId: string;
  onReplyPosted: (comment: ArticleComment) => void;
  onDeleted: (id: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwner = currentUserId && comment.userId === currentUserId;

  async function submitReply() {
    if (!replyBody.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/article-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          body: replyBody.trim(),
          parentId: comment.id,
        }),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
        data?: ArticleComment;
      };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to post reply');
      if (json.data) onReplyPosted(json.data);
      setReplyBody('');
      setReplyOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this comment?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/article-comments/${comment.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message || 'Failed to delete');
      }
      onDeleted(comment.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className={depth > 0 ? 'mt-4 border-l-2 border-[var(--varnarc-border)] pl-4' : ''}>
      <div className="flex items-start gap-3">
        {comment.user?.avatarUrl ? (
          <img
            src={comment.user.avatarUrl}
            alt=""
            className="mt-0.5 h-9 w-9 rounded-full object-cover ring-1 ring-[var(--varnarc-border)]"
          />
        ) : (
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--varnarc-muted)] text-xs font-semibold text-[var(--varnarc-ink)]">
            {displayName(comment.user).slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {comment.user?.username ? (
              <Link
                href={`/authors/${comment.user.username}`}
                className="font-medium text-[var(--varnarc-ink)] hover:text-[#f97316]"
              >
                {displayName(comment.user)}
              </Link>
            ) : (
              <span className="font-medium text-[var(--varnarc-ink)]">{displayName(comment.user)}</span>
            )}
            <time className="text-xs text-[var(--varnarc-subtle)]">
              {new Date(comment.createdAt).toLocaleString()}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--varnarc-ink)]">{comment.body}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {canComment ? (
              <button
                type="button"
                className="font-medium text-[#f97316] hover:underline"
                onClick={() => setReplyOpen((v) => !v)}
              >
                Reply
              </button>
            ) : null}
            {isOwner ? (
              <button
                type="button"
                className="text-[var(--varnarc-subtle)] hover:text-red-600"
                disabled={loading}
                onClick={() => void remove()}
              >
                Delete
              </button>
            ) : null}
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          {replyOpen ? (
            <div className="mt-3 space-y-2">
              <textarea
                rows={3}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write a reply…"
                className="w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
              />
              <Button type="button" disabled={loading || !replyBody.trim()} onClick={() => void submitReply()}>
                {loading ? 'Posting…' : 'Post reply'}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function ThreadList({
  parentId,
  depth,
  threads,
  ...rest
}: {
  parentId: string | null;
  depth: number;
  threads: Map<string | null, ArticleComment[]>;
  canComment: boolean;
  currentUserId?: string | null;
  articleId: string;
  onReplyPosted: (comment: ArticleComment) => void;
  onDeleted: (id: string) => void;
}) {
  const items = threads.get(parentId) ?? [];
  if (!items.length) return null;
  return (
    <ul className={depth === 0 ? 'space-y-6' : 'mt-4 space-y-4'}>
      {items.map((comment) => (
        <div key={comment.id}>
          <CommentRow comment={comment} depth={depth} {...rest} />
          <ThreadList parentId={comment.id} depth={depth + 1} threads={threads} {...rest} />
        </div>
      ))}
    </ul>
  );
}

export function ArticleCommentsSection({
  articleId,
  initialComments,
  initialTotal,
  canComment,
  currentUserId,
}: Props) {
  const [comments, setComments] = useState(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const threads = useMemo(() => buildThreads(comments), [comments]);

  async function submitComment() {
    if (!body.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/article-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, body: body.trim() }),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
        data?: ArticleComment;
      };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to post comment');
      if (json.data) {
        setComments((prev) => [...prev, json.data!]);
        setTotal((n) => n + 1);
      }
      setBody('');
      setMessage('Comment posted.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  }

  function onReplyPosted(comment: ArticleComment) {
    setComments((prev) => [...prev, comment]);
    setTotal((n) => n + 1);
  }

  function onDeleted(id: string) {
    setComments((prev) => prev.filter((row) => row.id !== id && row.parentId !== id));
    setTotal((n) => Math.max(0, n - 1));
  }

  return (
    <section className="mt-12 border-t border-[var(--varnarc-border)] pt-8" id="comments">
      <h2 className="text-xl font-semibold text-[var(--varnarc-ink)]">
        Comments{total > 0 ? ` (${total})` : ''}
      </h2>

      {canComment ? (
        <div className="mt-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
          <label htmlFor="article-comment" className="text-sm font-medium text-[var(--varnarc-ink)]">
            Join the discussion
          </label>
          <textarea
            id="article-comment"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts…"
            className="mt-2 w-full rounded-md border border-[var(--varnarc-border)] bg-white px-3 py-2 text-sm"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button type="button" disabled={loading || !body.trim()} onClick={() => void submitComment()}>
              {loading ? 'Posting…' : 'Post comment'}
            </Button>
            {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--varnarc-subtle)]">
          <Link href="/auth/login" className="text-[#f97316] hover:underline">
            Sign in
          </Link>{' '}
          to leave a comment.
        </p>
      )}

      <div className="mt-8">
        {comments.length ? (
          <ThreadList
            parentId={null}
            depth={0}
            threads={threads}
            canComment={canComment}
            currentUserId={currentUserId}
            articleId={articleId}
            onReplyPosted={onReplyPosted}
            onDeleted={onDeleted}
          />
        ) : (
          <p className="text-sm text-[var(--varnarc-subtle)]">No comments yet. Be the first to share your view.</p>
        )}
      </div>
    </section>
  );
}

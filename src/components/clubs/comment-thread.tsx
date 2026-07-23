"use client";

import { useState } from "react";

import { CommentForm } from "@/components/clubs/comment-form";
import { DeleteCommentButton } from "@/components/clubs/delete-comment-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict } from "@/i18n/provider";

function initials(input: string | null, fallback: string) {
  const src = (input ?? fallback).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type CommentData = {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string | null; email: string };
  canDelete: boolean;
};

export function CommentThread({
  clubId,
  comment,
  replies,
}: {
  clubId: string;
  comment: CommentData;
  replies: CommentData[];
}) {
  const [showReply, setShowReply] = useState(false);
  const dict = useDict();

  return (
    <li className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-xs">
            {initials(comment.author.name, comment.author.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {comment.author.name ?? comment.author.email}
            </span>
            {comment.canDelete && (
              <DeleteCommentButton clubId={clubId} commentId={comment.id} />
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              {comment.createdAt}
            </span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
              onClick={() => setShowReply((v) => !v)}
            >
              {showReply ? dict.clubs.replyCancel : dict.clubs.replyAction}
            </button>
          </div>
          {showReply && (
            <div className="pt-1">
              <CommentForm
                clubId={clubId}
                parentId={comment.id}
                onPosted={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <ul className="ml-10 space-y-3 border-l pl-4">
          {replies.map((r) => (
            <li key={r.id} className="flex gap-3">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {initials(r.author.name, r.author.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {r.author.name ?? r.author.email}
                  </span>
                  {r.canDelete && (
                    <DeleteCommentButton clubId={clubId} commentId={r.id} />
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                <span className="text-muted-foreground text-xs">
                  {r.createdAt}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

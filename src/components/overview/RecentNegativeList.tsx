import React from 'react';
import { CommentCard, CommentCardData } from '../comments/CommentCard';

interface RecentNegativeListProps {
  comments: CommentCardData[];
}

export const RecentNegativeList: React.FC<RecentNegativeListProps> = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="py-12 text-center border border-slate-800 rounded-xl bg-slate-900/40">
        <p className="text-sm text-slate-400">No negative comments detected yet.</p>
        <p className="text-xs text-slate-500 mt-1">When Gemini classifies a comment as critical negative feedback, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {comments.map((comment) => (
        <CommentCard key={comment._id} comment={comment} />
      ))}
    </div>
  );
};

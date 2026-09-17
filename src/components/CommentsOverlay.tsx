import React, { useState } from 'react';
import {
  MessageSquare,
  Check,
  Send,
  X,
  User,
  Plus,
  Trash2
} from 'lucide-react';
import { PinComment, CollaboratorRole } from '../types/entitlements';

interface CommentsOverlayProps {
  comments: PinComment[];
  activeCommentId: string | null;
  onSelectComment: (id: string | null) => void;
  onAddComment: (comment: Omit<PinComment, 'id' | 'createdAt'>) => void;
  onResolveComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
  currentUserRole: CollaboratorRole;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserColor: string;
  isPlacingComment: boolean;
  onCancelPlacing: () => void;
  gridSize: number; // pixels per unit
  containerOffset?: { x: number; y: number };
  zoom?: number;
}

export const CommentsOverlay: React.FC<CommentsOverlayProps> = ({
  comments,
  activeCommentId,
  onSelectComment,
  onAddComment,
  onResolveComment,
  onDeleteComment,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
  currentUserColor,
  isPlacingComment,
  onCancelPlacing
}) => {
  const [replyText, setReplyText] = useState('');

  const activeComment = comments.find((c) => c.id === activeCommentId);

  return (
    <>
      {/* Placed Comment Pins on the Canvas */}
      {comments.map((comment, index) => {
        const isSelected = activeCommentId === comment.id;
        return (
          <div
            key={comment.id}
            style={{
              left: `${comment.x}px`,
              top: `${comment.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectComment(isSelected ? null : comment.id);
            }}
            className="absolute z-30 cursor-pointer group"
          >
            {/* The Pin Icon */}
            <div
              className={`flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 ${
                comment.resolved
                  ? 'bg-slate-400 text-white w-6 h-6 text-[10px]'
                  : isSelected
                  ? 'w-8 h-8 text-white ring-4 ring-indigo-200'
                  : 'w-7 h-7 text-white'
              }`}
              style={{
                backgroundColor: comment.resolved ? '#94a3b8' : comment.authorColor || '#4f46e5'
              }}
              title={`${comment.authorName} (${comment.authorRole}): ${comment.text}`}
            >
              {comment.resolved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className="font-bold text-xs">{index + 1}</span>
              )}
            </div>

            {/* Pointer notch */}
            <div
              className="w-2 h-2 mx-auto rotate-45 -mt-1 shadow-xs"
              style={{
                backgroundColor: comment.resolved ? '#94a3b8' : comment.authorColor || '#4f46e5'
              }}
            />
          </div>
        );
      })}

      {/* Active Comment Detail Card */}
      {activeComment && (
        <div
          style={{
            left: `${Math.min(window.innerWidth - 320, Math.max(20, activeComment.x + 20))}px`,
            top: `${Math.min(window.innerHeight - 300, Math.max(70, activeComment.y - 40))}px`
          }}
          className="absolute z-40 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 w-72 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">{activeComment.authorAvatar}</span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {activeComment.authorName}
                </h4>
                <span className="text-[10px] font-semibold text-slate-500 capitalize">
                  {activeComment.authorRole === 'commenter' ? 'Live Client' : activeComment.authorRole}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectComment(null)}
              className="w-5 h-5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          {/* Comment Body */}
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {activeComment.text}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onResolveComment(activeComment.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeComment.resolved
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {activeComment.resolved ? 'Reopen' : 'Resolve'}
            </button>

            <button
              onClick={() => onDeleteComment(activeComment.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Placing Pin Instruction Banner */}
      {isPlacingComment && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-bounce">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="font-semibold">
            Click anywhere on the floor plan or table to place your client comment pin.
          </span>
          <button
            onClick={onCancelPlacing}
            className="text-slate-400 hover:text-white font-bold ml-1"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
};

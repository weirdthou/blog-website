import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { commentsApi } from '@/lib/api/comments';
import {
  Edit,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Reply,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import CommentForm from './CommentForm';

// Helper functions to handle comment data
const getAuthorName = (comment: Comment | CommentReply): string => {
  return comment.user?.name || comment.user_name || 'Anonymous';
};

const getAuthorAvatar = (comment: Comment | CommentReply): string => {
  if (comment.user?.avatar) {
    return comment.user.avatar;
  }
  const name = getAuthorName(comment);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
};

interface CommentReply {
  id: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar: string;
  };
  user_name?: string;
  content: string;
  created_at: string;
  likes_count?: number;
  dislikes_count?: number;
  user_like_status?: 'like' | 'dislike' | null;
  user_has_flagged?: boolean;
  is_edited?: boolean;
}

interface Comment {
  id: string;
  article: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar: string;
  };
  user_name?: string;
  content: string;
  created_at: string;
  replies?: CommentReply[];
  likes_count?: number;
  dislikes_count?: number;
  user_like_status?: 'like' | 'dislike' | null;
  user_has_flagged?: boolean;
  is_edited?: boolean;
}

interface CommentsProps {
  articleId: string;
  comments: Comment[];
  onAddComment?: (newComment: {
    type: string;
    comment?: Comment;
    commentId?: string;
    reply?: CommentReply;
  }) => void;
  onCommentsUpdate?: () => void;
}

const FlagDialog = ({
  isOpen,
  onClose,
  onSubmit,
  commentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
  commentId: string;
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (reason) {
      onSubmit(reason, description);
      setReason('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag Comment</DialogTitle>
          <DialogDescription>
            Help us understand why you're flagging this comment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="hate_speech">Hate Speech</SelectItem>
                <SelectItem value="inappropriate">
                  Inappropriate Content
                </SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason}>
            Submit Flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CommentActions = ({
  comment,
  onLike,
  onDislike,
  onFlag,
  onReply,
  onEdit,
  onDelete,
  isReplying,
  canEdit = false,
  canDelete = false,
}: {
  comment: Comment | CommentReply;
  onLike: () => void;
  onDislike: () => void;
  onFlag: (reason?: string, description?: string) => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isReplying: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}) => {
  const { user } = useAuth();
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);

  const handleFlag = (reason?: string, description?: string) => {
    if (reason) {
      onFlag(reason, description);
    } else {
      onFlag();
    }
    setFlagDialogOpen(false);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Like/Dislike buttons */}
      <Button
        variant="ghost"
        size="sm"
        className={`text-sm ${
          comment.user_like_status === 'like'
            ? 'text-green-600'
            : 'text-gray-600'
        }`}
        onClick={onLike}
      >
        <ThumbsUp className="mr-1 h-3 w-3" />
        {comment.likes_count || 0}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`text-sm ${
          comment.user_like_status === 'dislike'
            ? 'text-red-600'
            : 'text-gray-600'
        }`}
        onClick={onDislike}
      >
        <ThumbsDown className="mr-1 h-3 w-3" />
        {comment.dislikes_count || 0}
      </Button>

      {/* Reply button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-newspaper-muted hover:text-newspaper-accent"
        onClick={onReply}
      >
        <Reply className="mr-1 h-4 w-4" />
        {isReplying ? 'Cancel Reply' : 'Reply'}
      </Button>

      {/* More actions dropdown */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {!comment.user_has_flagged && (
              <DropdownMenuItem onClick={() => setFlagDialogOpen(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Flag Comment
              </DropdownMenuItem>
            )}
            {comment.user_has_flagged && (
              <DropdownMenuItem onClick={() => handleFlag()}>
                <Flag className="mr-2 h-4 w-4" />
                Remove Flag
              </DropdownMenuItem>
            )}
            {canEdit && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </>
            )}
            {canDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <FlagDialog
        isOpen={flagDialogOpen}
        onClose={() => setFlagDialogOpen(false)}
        onSubmit={handleFlag}
        commentId={comment.id}
      />
    </div>
  );
};

const CommentsEnhanced: React.FC<CommentsProps> = ({
  articleId,
  comments,
  onAddComment,
  onCommentsUpdate,
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState(comments);
  const { toast } = useToast();
  const { user } = useAuth();

  // Update local comments when props change
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleLikeDislike = async (commentId: string, isLike: boolean) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to like or dislike comments.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await commentsApi.likeComment(commentId, {
        is_like: isLike,
      });

      // Update local state with the returned comment data
      setLocalComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likes_count: response.comment.likes_count,
                dislikes_count: response.comment.dislikes_count,
                user_like_status: response.comment.user_like_status,
              }
            : comment
        )
      );

      toast({
        title: 'Success',
        description: `Comment ${isLike ? 'liked' : 'disliked'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update comment reaction',
        variant: 'destructive',
      });
    }
  };

  const handleFlag = async (
    commentId: string,
    reason?: string,
    description?: string
  ) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to flag comments.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (reason) {
        // Submit new flag
        await commentsApi.flagComment(commentId, {
          reason: reason as
            | 'spam'
            | 'harassment'
            | 'hate_speech'
            | 'inappropriate'
            | 'misinformation'
            | 'other',
          description,
        });

        toast({
          title: 'Success',
          description: 'Comment has been flagged successfully',
        });
      } else {
        // Remove existing flag
        await commentsApi.removeFlagFromComment(commentId);

        toast({
          title: 'Success',
          description: 'Flag has been removed',
        });
      }

      // Update local state to reflect flag status
      setLocalComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, user_has_flagged: !!reason }
            : comment
        )
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update flag status',
        variant: 'destructive',
      });
    }
  };

  const handleCommentSubmit = () => {
    // Reset replying state
    setReplyingTo(null);
    // This will trigger a refresh of the article data
    onCommentsUpdate?.();
  };

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-newspaper-accent" />
        <h3 className="text-2xl font-serif font-bold">
          Comments ({localComments.length})
        </h3>
      </div>

      <CommentForm
        articleId={articleId}
        onCommentSubmit={handleCommentSubmit}
        isReply={false}
      />

      {localComments.length > 0 ? (
        <div className="space-y-6 mt-8">
          {localComments.map((comment) => (
            <div key={comment.id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-start gap-4">
                <img
                  src={getAuthorAvatar(comment)}
                  alt={getAuthorName(comment)}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">{getAuthorName(comment)}</h4>
                    {comment.is_edited && (
                      <span className="text-xs text-gray-500">(edited)</span>
                    )}
                  </div>
                  <p className="text-sm text-newspaper-muted mb-2">
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="mb-3">{comment.content}</p>

                  <CommentActions
                    comment={comment}
                    onLike={() => handleLikeDislike(comment.id, true)}
                    onDislike={() => handleLikeDislike(comment.id, false)}
                    onFlag={(reason, description) =>
                      handleFlag(comment.id, reason, description)
                    }
                    onReply={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id
                      )
                    }
                    isReplying={replyingTo === comment.id}
                    canEdit={user?.id === comment.user?.id}
                    canDelete={
                      user?.id === comment.user?.id || user?.role === 'admin'
                    }
                  />

                  {replyingTo === comment.id && (
                    <div className="mt-4">
                      <CommentForm
                        articleId={articleId}
                        replyTo={comment.id}
                        onCommentSubmit={handleCommentSubmit}
                        isReply={true}
                        onCancelReply={() => setReplyingTo(null)}
                      />
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 mt-4 space-y-4">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-md"
                        >
                          <img
                            src={getAuthorAvatar(reply)}
                            alt={getAuthorName(reply)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-bold">
                                {getAuthorName(reply)}
                              </h5>
                              {reply.is_edited && (
                                <span className="text-xs text-gray-500">
                                  (edited)
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-newspaper-muted mb-2">
                              {new Date(reply.created_at).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </p>
                            <p className="mb-2">{reply.content}</p>

                            <CommentActions
                              comment={reply}
                              onLike={() => handleLikeDislike(reply.id, true)}
                              onDislike={() =>
                                handleLikeDislike(reply.id, false)
                              }
                              onFlag={(reason, description) =>
                                handleFlag(reply.id, reason, description)
                              }
                              onReply={() => {}} // Replies to replies not implemented
                              isReplying={false}
                              canEdit={false} // For now, disable editing replies
                              canDelete={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-t border-b">
          <p className="text-newspaper-muted">
            Be the first to comment on this article.
          </p>
        </div>
      )}
    </section>
  );
};

export default CommentsEnhanced;

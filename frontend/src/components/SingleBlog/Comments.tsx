
import React, { useState } from "react";
import { MessageSquare, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommentForm from "./CommentForm";

interface CommentReply {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  replies?: CommentReply[];
}

interface CommentsProps {
  articleId: string;
  comments: Comment[];
  onAddComment: (newComment: any) => void;
}

const Comments: React.FC<CommentsProps> = ({ articleId, comments, onAddComment }) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleCommentSubmit = (comment: {
    name: string;
    email: string;
    content: string;
    replyTo?: string;
  }) => {
    const now = new Date().toISOString();
    
    if (comment.replyTo) {
      // This is a reply to a comment
      const newReply = {
        id: `reply-${Date.now()}`,
        authorName: comment.name,
        authorAvatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(comment.name),
        content: comment.content,
        timestamp: now
      };
      
      onAddComment({
        type: 'reply',
        commentId: comment.replyTo,
        reply: newReply
      });
    } else {
      // This is a new comment
      const newComment = {
        id: `comment-${Date.now()}`,
        articleId,
        authorName: comment.name,
        authorAvatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(comment.name),
        content: comment.content,
        timestamp: now,
        replies: []
      };
      
      onAddComment({
        type: 'comment',
        comment: newComment
      });
    }
  };

  return (
    <section className="comments-section">
      <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
        <MessageSquare />
        Comments ({comments.length})
      </h2>

      <CommentForm 
        articleId={articleId} 
        onCommentSubmit={handleCommentSubmit} 
      />

      {comments.length > 0 ? (
        <div className="space-y-8">
          {comments.map(comment => (
            <div key={comment.id} className="border-b pb-8">
              <div className="flex items-start gap-4">
                <img 
                  src={comment.authorAvatar} 
                  alt={comment.authorName} 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-bold">{comment.authorName}</h4>
                  <p className="text-sm text-newspaper-muted mb-2">
                    {new Date(comment.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="mb-3">{comment.content}</p>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-newspaper-muted hover:text-newspaper-accent"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    <Reply className="mr-1 h-4 w-4" />
                    {replyingTo === comment.id ? "Cancel Reply" : "Reply"}
                  </Button>
                  
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
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-md">
                          <img 
                            src={reply.authorAvatar} 
                            alt={reply.authorName} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <h5 className="font-bold">{reply.authorName}</h5>
                            <p className="text-sm text-newspaper-muted mb-2">
                              {new Date(reply.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p>{reply.content}</p>
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
          <p className="text-newspaper-muted">Be the first to comment on this article.</p>
        </div>
      )}
    </section>
  );
};

export default Comments;

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { commentsApi } from '@/lib/api/comments';
import React, { useState } from 'react';

interface CommentFormProps {
  articleId: string;
  replyTo?: string;
  onCommentSubmit: () => void;
  isReply?: boolean;
  onCancelReply?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  articleId,
  replyTo,
  onCommentSubmit,
  isReply = false,
  onCancelReply,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For authenticated users, only content is required
    if (user) {
      if (!content.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter your comment',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // For non-authenticated users, all fields are required
      if (!name.trim() || !email.trim() || !content.trim()) {
        toast({
          title: 'Error',
          description: 'Please fill out all fields',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Call the real API
      const commentData = {
        content: content.trim(),
        article: articleId,
        parent: replyTo,
        ...(user ? {} : { user_name: name.trim(), user_email: email.trim() }),
      };

      const newComment = await commentsApi.createComment(commentData);

      // Call the onCommentSubmit callback to refresh data
      onCommentSubmit();

      // Reset form
      if (!user) {
        setName('');
        setEmail('');
      }
      setContent('');

      toast({
        title: isReply ? 'Reply Posted' : 'Comment Posted',
        description: isReply
          ? 'Your reply has been submitted successfully.'
          : 'Your comment has been submitted successfully.',
      });

      if (isReply && onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={isReply ? 'mb-4' : 'mb-8'}>
      <CardContent className="p-6">
        <h3 className="text-xl font-serif font-bold mb-4">
          {isReply ? 'Write a Reply' : 'Leave a Comment'}
        </h3>
        {user && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Commenting as <strong>{user.name}</strong>
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`name-${isReply ? 'reply' : 'comment'}`}
                  className="block text-sm font-medium mb-1"
                >
                  Name *
                </label>
                <Input
                  id={`name-${isReply ? 'reply' : 'comment'}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`email-${isReply ? 'reply' : 'comment'}`}
                  className="block text-sm font-medium mb-1"
                >
                  Email *
                </label>
                <Input
                  id={`email-${isReply ? 'reply' : 'comment'}`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email (will not be published)"
                  required
                />
              </div>
            </div>
          )}
          <div>
            <label
              htmlFor={`content-${isReply ? 'reply' : 'comment'}`}
              className="block text-sm font-medium mb-1"
            >
              Comment *
            </label>
            <Textarea
              id={`content-${isReply ? 'reply' : 'comment'}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your comment"
              required
              rows={5}
            />
          </div>
          <div
            className={`flex ${isReply ? 'justify-between' : 'justify-end'}`}
          >
            {isReply && onCancelReply && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancelReply}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isReply
                  ? 'Posting Reply...'
                  : 'Posting Comment...'
                : isReply
                ? 'Post Reply'
                : 'Post Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CommentForm;

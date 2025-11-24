from django.db import models
from articles.models import Article
from users.models import User


class Comment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='comments')
    user_name = models.CharField(max_length=100, blank=True)
    user_email = models.EmailField(blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='approved')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    # New fields for enhanced functionality
    likes_count = models.PositiveIntegerField(default=0)
    dislikes_count = models.PositiveIntegerField(default=0)
    flags_count = models.PositiveIntegerField(default=0)
    is_edited = models.BooleanField(default=False)

    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Comment by {self.user.username if self.user else self.user_name} on {self.article.title}'

    def update_likes_count(self):
        """Update the likes count based on CommentLike objects"""
        self.likes_count = self.likes.filter(is_like=True).count()
        self.save(update_fields=['likes_count'])

    def update_dislikes_count(self):
        """Update the dislikes count based on CommentLike objects"""
        self.dislikes_count = self.likes.filter(is_like=False).count()
        self.save(update_fields=['dislikes_count'])

    def update_flags_count(self):
        """Update the flags count based on CommentFlag objects"""
        self.flags_count = self.flags.count()
        self.save(update_fields=['flags_count'])


class CommentLike(models.Model):
    """Model to track likes and dislikes on comments"""
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    is_like = models.BooleanField()  # True for like, False for dislike
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comment_likes'
        unique_together = ['comment', 'user']  # One like/dislike per user per comment

    def __str__(self):
        action = "liked" if self.is_like else "disliked"
        return f'{self.user.username} {action} comment {self.comment.id}'

    def save(self, *args, **kwargs):
        # Check if user is trying to spam likes/dislikes
        from django.utils import timezone
        from datetime import timedelta
        
        if self.pk:  # If updating existing like
            old_instance = CommentLike.objects.get(pk=self.pk)
            # Prevent rapid changes (1 minute cooldown)
            if timezone.now() - old_instance.updated_at < timedelta(minutes=1):
                from django.core.exceptions import ValidationError
                raise ValidationError("Please wait before changing your reaction again.")
        
        super().save(*args, **kwargs)
        # Update the comment's like/dislike counts
        self.comment.update_likes_count()
        self.comment.update_dislikes_count()

    def delete(self, *args, **kwargs):
        comment = self.comment
        super().delete(*args, **kwargs)
        # Update the comment's like/dislike counts after deletion
        comment.update_likes_count()
        comment.update_dislikes_count()


class CommentFlag(models.Model):
    """Model to track flags/reports on comments"""
    FLAG_REASONS = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('hate_speech', 'Hate Speech'),
        ('inappropriate', 'Inappropriate Content'),
        ('misinformation', 'Misinformation'),
        ('other', 'Other'),
    ]

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='flags')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_flags')
    reason = models.CharField(max_length=20, choices=FLAG_REASONS)
    description = models.TextField(blank=True, help_text="Additional details about the flag")
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='resolved_comment_flags'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'comment_flags'
        unique_together = ['comment', 'user']  # One flag per user per comment

    def __str__(self):
        return f'{self.user.username} flagged comment {self.comment.id} for {self.reason}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the comment's flags count
        self.comment.update_flags_count()

    def delete(self, *args, **kwargs):
        comment = self.comment
        super().delete(*args, **kwargs)
        # Update the comment's flags count after deletion
        comment.update_flags_count()

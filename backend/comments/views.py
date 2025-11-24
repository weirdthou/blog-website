from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from .models import Comment, CommentLike, CommentFlag
from .serializers import CommentSerializer, CommentLikeSerializer, CommentFlagSerializer


class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Comment.objects.filter(
            article_id=self.kwargs['article_id'],
            parent=None,
            status='approved'
        )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_update(self, serializer):
        # Only allow user to edit their own comments
        comment = self.get_object()
        if comment.user != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own comments")
        serializer.save()

    def perform_destroy(self, instance):
        # Only allow user to delete their own comments or admin
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only delete your own comments")
        instance.delete()


class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class CommentLikeView(APIView):
    """Handle like/dislike functionality for comments"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        is_like = request.data.get('is_like', True)  # True for like, False for dislike
        
        try:
            # Try to get existing like/dislike
            comment_like = CommentLike.objects.get(comment=comment, user=request.user)
            
            if comment_like.is_like == is_like:
                # Same action, remove the like/dislike
                comment_like.delete()
                action = 'removed'
            else:
                # Different action, toggle the like/dislike
                comment_like.is_like = is_like
                try:
                    comment_like.save()
                    action = 'updated'
                except Exception as e:
                    return Response({
                        'error': 'Please wait before changing your reaction again.'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except CommentLike.DoesNotExist:
            # Create new like/dislike
            try:
                CommentLike.objects.create(comment=comment, user=request.user, is_like=is_like)
                action = 'created'
            except Exception as e:
                return Response({
                    'error': 'Please wait before reacting again.'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Return updated comment data
        serializer = CommentSerializer(comment, context={'request': request})
        return Response({
            'action': action,
            'comment': serializer.data
        })


class CommentFlagView(APIView):
    """Handle flagging functionality for comments"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        
        try:
            # Check if user has already flagged this comment
            existing_flag = CommentFlag.objects.get(comment=comment, user=request.user)
            return Response({
                'error': 'You have already flagged this comment'
            }, status=status.HTTP_400_BAD_REQUEST)
        except CommentFlag.DoesNotExist:
            # Create new flag
            serializer = CommentFlagSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(comment=comment)
                return Response({
                    'message': 'Comment has been flagged successfully',
                    'flag': serializer.data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, comment_id):
        """Remove a flag"""
        comment = get_object_or_404(Comment, id=comment_id)
        try:
            flag = CommentFlag.objects.get(comment=comment, user=request.user)
            flag.delete()
            return Response({'message': 'Flag removed successfully'})
        except CommentFlag.DoesNotExist:
            return Response({
                'error': 'You have not flagged this comment'
            }, status=status.HTTP_404_NOT_FOUND)


class CommentApproveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        comment.status = 'approved'
        comment.save()
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data)


class CommentRejectView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        comment.status = 'rejected'
        comment.save()
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data)


class PendingCommentsView(generics.ListAPIView):
    queryset = Comment.objects.filter(status='pending')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAdminUser]


class RecentCommentsView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Comment.objects.filter(status='approved').order_by('-created_at')[:10]


class FlaggedCommentsView(generics.ListAPIView):
    """List comments that have been flagged by users"""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Comment.objects.filter(
            flags_count__gt=0,
            status='approved'
        ).order_by('-flags_count', '-created_at')


class CommentFlagsListView(generics.ListAPIView):
    """List all flags for admin review"""
    serializer_class = CommentFlagSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return CommentFlag.objects.filter(is_resolved=False).order_by('-created_at')

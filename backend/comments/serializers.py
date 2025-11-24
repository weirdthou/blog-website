from rest_framework import serializers
from .models import Comment, CommentLike, CommentFlag
from users.serializers import UserSerializer


class CommentFlagSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CommentFlag
        fields = ('id', 'comment', 'user', 'reason', 'description', 'created_at', 'is_resolved')
        read_only_fields = ('id', 'created_at', 'is_resolved')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CommentLikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CommentLike
        fields = ('id', 'comment', 'user', 'is_like', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class RecursiveCommentSerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = CommentSerializer(value, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = RecursiveCommentSerializer(many=True, read_only=True)
    user_like_status = serializers.SerializerMethodField()
    user_has_flagged = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'article', 'user', 'user_name', 'user_email', 'content',
                  'created_at', 'updated_at', 'status', 'parent', 'replies',
                  'likes_count', 'dislikes_count', 'flags_count', 'is_edited',
                  'user_like_status', 'user_has_flagged')
        read_only_fields = ('id', 'created_at', 'updated_at', 'status', 'likes_count', 
                           'dislikes_count', 'flags_count', 'is_edited', 'user_like_status', 
                           'user_has_flagged')
        extra_kwargs = {
            'user_name': {'required': False},
            'user_email': {'required': False},
            'parent': {'write_only': True}
        }

    def get_user_like_status(self, obj):
        """Return the current user's like status for this comment"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        try:
            like = CommentLike.objects.get(comment=obj, user=request.user)
            return 'like' if like.is_like else 'dislike'
        except CommentLike.DoesNotExist:
            return None

    def get_user_has_flagged(self, obj):
        """Return whether the current user has flagged this comment"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        return CommentFlag.objects.filter(comment=obj, user=request.user).exists()

    def validate(self, attrs):
        request = self.context.get('request')
        
        # If user is authenticated, we don't need name and email
        if request and request.user.is_authenticated:
            attrs['user'] = request.user
            # Remove name and email if provided, as we'll use the authenticated user's info
            attrs.pop('user_name', None)
            attrs.pop('user_email', None)
        else:
            # For anonymous users, require name and email
            if not (attrs.get('user_name') and attrs.get('user_email')):
                raise serializers.ValidationError(
                    "Name and email are required for anonymous comments")
        return attrs

    def update(self, instance, validated_data):
        # Mark as edited if content is being updated
        if 'content' in validated_data and validated_data['content'] != instance.content:
            validated_data['is_edited'] = True
        return super().update(instance, validated_data)

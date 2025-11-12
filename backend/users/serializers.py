from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import User

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'password', 'role', 'avatar',
                  'bio', 'join_date', 'last_login', 'is_active')
        read_only_fields = ('id', 'join_date', 'last_login')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'name': {'required': True}
        }

    def validate_password(self, value):
        if value:
            try:
                validate_password(value)
            except ValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def validate_email(self, value):
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Enter a valid email address.")
        return value

    def validate_avatar(self, value):
        if value:
            if value.size > 5242880:
                raise serializers.ValidationError(
                    "Image file too large (> 5MB)")
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError(
                    "File type not supported. Please upload an image.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = User.objects.create_user(**validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
        return value


class BasicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'email')
        read_only_fields = fields


class AuthorListSerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar',
                  'bio', 'role', 'article_count']


class AuthorDetailSerializer(serializers.ModelSerializer):
    articles = serializers.SerializerMethodField()
    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar', 'bio',
                  'role', 'join_date', 'article_count', 'articles']

    def get_articles(self, obj):
        # Only include published articles and use basic fields to avoid circular imports
        articles = obj.articles.filter(status='published')
        return [{
            'id': article.id,
            'title': article.title,
            'slug': article.slug,
            'excerpt': article.excerpt,
            'featured_image': article.featured_image.url if article.featured_image else None,
            'publish_date': article.publish_date,
            'views': article.views,
            'reading_time': article.reading_time,
        } for article in articles]

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.validators import validate_email
from core.utils import compress_image
import os


def user_avatar_path(instance, filename):
    return f'users/{instance.id}/{filename}'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )

    username = None
    email = models.EmailField(
        'email address', unique=True, validators=[validate_email])
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLES, default='user')
    avatar = models.ImageField(
        upload_to=user_avatar_path, null=True, blank=True, default='avatar.avif')
    bio = models.TextField(blank=True)
    join_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        ordering = ['-join_date']

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if self.pk and self.avatar:
            try:
                old_avatar = User.objects.get(pk=self.pk).avatar
                if old_avatar and old_avatar != self.avatar:
                    if os.path.isfile(old_avatar.path):
                        os.remove(old_avatar.path)
            except (User.DoesNotExist, ValueError, FileNotFoundError):
                pass

            try:
                self.avatar = compress_image(self.avatar)
            except Exception:
                pass

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.avatar:
            try:
                if os.path.isfile(self.avatar.path):
                    os.remove(self.avatar.path)
            except (ValueError, FileNotFoundError):
                pass
        super().delete(*args, **kwargs)

    @property
    def published_articles_count(self):
        return self.articles.filter(status='published').count()

    @property
    def total_article_views(self):
        return sum(article.views for article in self.articles.all())

from django.contrib import admin
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('article', 'user', 'user_name', 'created_at', 'status')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user_name', 'user_email', 'content')
    raw_id_fields = ('article', 'user', 'parent')
    list_editable = ('status',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

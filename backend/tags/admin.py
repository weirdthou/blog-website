from django.contrib import admin
from .models import Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'get_article_count')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}

    def get_article_count(self, obj):
        return obj.articles.count()
    get_article_count.short_description = 'Articles'

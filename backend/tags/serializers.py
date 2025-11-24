from rest_framework import serializers
from .models import Tag


class TagSerializer(serializers.ModelSerializer):
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug', 'description', 'article_count')
        read_only_fields = ('id', 'slug')

    def get_article_count(self, obj):
        return obj.articles.count()

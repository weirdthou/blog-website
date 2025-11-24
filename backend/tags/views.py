from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Tag
from .serializers import TagSerializer
from articles.serializers import ArticleSerializer
from core.utils import log_action, log_exception


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TagListView(generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            log_action('tag_created', request.user,
                       f'Tag: {serializer.data["name"]}')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            log_exception(e, 'Error creating tag')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            log_action('tag_updated', request.user,
                       f'Tag: {serializer.data["name"]}')
            return Response(serializer.data)
        except Exception as e:
            log_exception(e, 'Error updating tag')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            tag_name = instance.name
            self.perform_destroy(instance)
            log_action('tag_deleted', request.user, f'Tag: {tag_name}')
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e, 'Error deleting tag')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class TagBySlugView(generics.RetrieveAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            log_exception(e, 'Error retrieving tag by slug')
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )


class TagArticlesView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        tag = generics.get_object_or_404(Tag, pk=self.kwargs['pk'])
        return tag.articles.filter(status='published').order_by('-publish_date')

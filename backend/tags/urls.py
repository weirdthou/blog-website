from django.urls import path
from . import views

urlpatterns = [
    path('', views.TagListView.as_view(), name='tag_list'),
    path('<int:pk>/', views.TagDetailView.as_view(), name='tag_detail'),
    path('slug/<slug:slug>/', views.TagBySlugView.as_view(), name='tag_by_slug'),
    path('<int:pk>/articles/', views.TagArticlesView.as_view(), name='tag_articles'),
]

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    ProfileView,
    ChangePasswordView,
    RequestPasswordResetView,
    ResetPasswordView,
    AuthorListView,
    AuthorDetailView,
)

urlpatterns = [
    path('', views.UserListAPIView.as_view(), name='user_list'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(),
         name='change_password'),
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.AdminUserView.as_view(), name='user_detail'),
    path('request-password-reset/', views.RequestPasswordResetView.as_view(),
         name='request_password_reset'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    path('authors/', AuthorListView.as_view(), name='author-list'),
    path('authors/<str:id>/', AuthorDetailView.as_view(), name='author-detail'),
]

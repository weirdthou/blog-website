from django.utils.html import strip_tags
from django.template.loader import render_to_string
from django.shortcuts import render
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import UserSerializer, ChangePasswordSerializer, BasicUserSerializer, AuthorListSerializer, AuthorDetailSerializer
from django.core.mail import send_mail
from django.conf import settings
import uuid
from django.core.cache import cache
from core.utils import log_action, log_exception, rate_limit_decorator
from django.db.models import Count, Q
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):

        credentials = {
            'email': attrs.get('email'),
            'password': attrs.get('password')
        }

        if all(credentials.values()):
            return super().validate(credentials)
        else:
            msg = 'Must include "email" and "password".'
            raise serializers.ValidationError(msg)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)

            if response.status_code == 200:
                user = User.objects.get(email=request.data['email'])
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])

                serializer = UserSerializer(user)
                response.data['user'] = serializer.data
                response.data['user'][
                    'avatar'] = f"http://localhost:8000{user.avatar.url}" if user.avatar else None

                log_action('user_login', user, f'User ID: {user.id}')

            return response

        except Exception as e:
            if isinstance(e, AuthenticationFailed):
                return Response(
                    {"detail": "Invalid email or password. Please check your credentials."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            elif isinstance(e, User.DoesNotExist):
                return Response(
                    {"detail": "No account found with this email address."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            else:
                return Response(
                    {"detail": "Authentication failed. Please try again."},
                    status=status.HTTP_400_BAD_REQUEST
                )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    @rate_limit_decorator(rate='5/h')
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = serializer.save()
            user.join_date = timezone.now()
            user.is_active = True
            user.save()

            log_action('user_registered', user, f'User ID: {user.id}')

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            serialized_user = serializer.data
            serialized_user['avatar'] = f"http://localhost:8000{user.avatar.url}" if user.avatar else None

            return Response({
                'user': serialized_user,
                'refresh': str(refresh),
                'access': access_token,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            log_exception(e, 'Error during user registration')
            raise


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        try:
            user = serializer.save()
            log_action('profile_updated', user, f'User ID: {user.id}')
        except Exception as e:
            log_exception(
                e, f'Error updating profile for user ID: {self.request.user.id}')
            raise


class AdminUserView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        try:
            user = serializer.save()
            log_action('user_updated_by_admin', self.request.user,
                       f'Updated user ID: {user.id}')
        except Exception as e:
            log_exception(e, f'Error updating user ID: {user.id}')
            raise

    def perform_destroy(self, instance):
        try:
            user_id = instance.id
            instance.delete()
            log_action('user_deleted_by_admin', self.request.user,
                       f'Deleted user ID: {user_id}')
        except Exception as e:
            log_exception(e, f'Error deleting user ID: {instance.id}')
            raise


class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            serializer = ChangePasswordSerializer(data=request.data)
            if serializer.is_valid():
                user = request.user
                if user.check_password(serializer.data.get('old_password')):
                    user.set_password(serializer.data.get('new_password'))
                    user.save()
                    log_action('password_changed', user, f'User ID: {user.id}')
                    return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
                log_action('password_change_failed', user,
                           f'User ID: {user.id} - Incorrect old password')
                return Response({'error': 'Incorrect old password'}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            log_exception(
                e, f'Error changing password for user ID: {request.user.id}')
            raise


class UserListView(generics.ListAPIView):
    permission_classes = (permissions.IsAdminUser,)
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    @rate_limit_decorator(rate='3/h')
    def post(self, request):
        try:
            email = request.data.get('email')
            try:
                user = User.objects.get(email=email)
                if not user.is_active:
                    return Response(
                        {'error': 'This account is deactivated'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                token = str(uuid.uuid4())
                cache_key = f'password_reset_{token}'
                cache.set(cache_key, user.id, timeout=3600)

                reset_url = f"http://localhost:8080/reset-password?token={token}&email={email}"

                context = {
                    'reset_url': reset_url,
                    'user': user,
                    'expires_in': '1 hour'
                }

                html_message = render_to_string(
                    'password_reset_template.html', context)
                plain_message = strip_tags(html_message)

                send_mail(
                    'Reset Your Password',
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    html_message=html_message,
                    fail_silently=True,
                )

                user_tokens = cache.get(f'user_reset_tokens_{user.id}', [])
                user_tokens.append(cache_key)
                cache.set(
                    f'user_reset_tokens_{user.id}', user_tokens, timeout=3600)

                log_action('password_reset_requested',
                           user, f'User ID: {user.id}')
                return Response({'status': 'Password reset email sent'})
            except User.DoesNotExist:
                log_action('password_reset_failed', None,
                           f'Email not found: {email}')
                return Response(
                    {'status': 'If an account exists with this email, you will receive a password reset link.'},
                    status=status.HTTP_200_OK
                )
        except Exception as e:
            log_exception(
                e, f'Error requesting password reset for email: {email}')
            raise


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    @rate_limit_decorator(rate='3/h')
    def post(self, request):
        try:
            token = request.data.get('token')
            new_password = request.data.get('new_password')

            if not token or not new_password:
                return Response(
                    {"detail": "Both token and new password are required. Please check your input."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            cache_key = f'password_reset_{token}'
            user_id = cache.get(cache_key)
            if not user_id:
                log_action('password_reset_failed', None,
                           'Invalid or expired token')
                return Response(
                    {"detail": "This password reset link has expired or is invalid. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                user = User.objects.get(id=user_id)
                if not user.is_active:
                    return Response(
                        {"detail": "This account is currently deactivated. Please contact support."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                user.set_password(new_password)
                user.save()

                user_tokens = cache.get(f'user_reset_tokens_{user.id}', [])
                for token_key in user_tokens:
                    cache.delete(token_key)
                cache.delete(f'user_reset_tokens_{user.id}')

                log_action('password_reset_completed',
                           user, f'User ID: {user.id}')
                return Response({'detail': 'Your password has been reset successfully. You can now log in with your new password.'})
            except User.DoesNotExist:
                log_action('password_reset_failed', None,
                           f'User not found for ID: {user_id}')
                return Response(
                    {"detail": "Unable to complete password reset. Please try again or contact support."},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            log_exception(e, 'Error during password reset')
            return Response(
                {"detail": "An error occurred while resetting your password. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'


class UserListAPIView(generics.ListAPIView):
    serializer_class = BasicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_active=True).only('id', 'username', 'email')


class AuthorListView(generics.ListAPIView):
    serializer_class = AuthorListSerializer
    queryset = User.objects.annotate(
        article_count=Count('articles', filter=Q(articles__status='published'))
    ).filter(articles__isnull=False).distinct()
    pagination_class = PageNumberPagination


class AuthorDetailView(generics.RetrieveAPIView):
    serializer_class = AuthorDetailSerializer
    lookup_field = 'id'
    queryset = User.objects.annotate(
        article_count=Count('articles', filter=Q(articles__status='published'))
    ).prefetch_related('articles')

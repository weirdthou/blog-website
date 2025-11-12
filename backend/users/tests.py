from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.core import mail
from django.core.cache import cache

User = get_user_model()


class UserTests(APITestCase):
    def setUp(self):
        cache.clear()  # Clear cache before each test
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        self.user = User.objects.create_user(**self.user_data)
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )

    def tearDown(self):
        cache.clear()  # Clear cache after each test

    def test_register_user(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(reverse('register'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 3)

    def test_login_user(self):
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(reverse('login'), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_profile_access(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)

    def test_change_password(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'old_password': 'testpass123',
            'new_password': 'newtestpass123'
        }
        response = self.client.post(reverse('change_password'), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newtestpass123'))

    def test_unauthorized_profile_access(self):
        response = self.client.get(reverse('profile'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        refresh = RefreshToken.for_user(self.user)
        data = {'refresh': str(refresh)}
        response = self.client.post(reverse('token_refresh'), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_user_list_admin_access(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('user_list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_user_list_unauthorized_access(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('user_list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_request_password_reset(self):
        response = self.client.post(
            reverse('request_password_reset'),
            {'email': self.user_data['email']}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Password Reset Request', mail.outbox[0].subject)

    def test_request_password_reset_invalid_email(self):
        response = self.client.post(
            reverse('request_password_reset'),
            {'email': 'nonexistent@example.com'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(len(mail.outbox), 0)

    def test_reset_password(self):
        # Request password reset first
        response = self.client.post(
            reverse('request_password_reset'),
            {'email': self.user_data['email']}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Get token from user's reset tokens
        user_tokens = cache.get(f'user_reset_tokens_{self.user.id}', [])
        self.assertTrue(len(user_tokens) > 0)
        token = user_tokens[0].split('_')[-1]

        # Reset password
        new_password = 'newpassword123'
        response = self.client.post(
            reverse('reset_password'),
            {'token': token, 'new_password': new_password}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try logging in with new password
        response = self.client.post(reverse('login'), {
            'username': self.user_data['username'],
            'password': new_password
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_reset_password_invalid_token(self):
        response = self.client.post(
            reverse('reset_password'),
            {'token': 'invalid-token', 'new_password': 'newpass123'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_rate_limit(self):
        for _ in range(6):  # Trying to register 6 times (limit is 5/hour)
            response = self.client.post(
                reverse('register'),
                {
                    'username': f'user{_}',
                    'email': f'user{_}@example.com',
                    'password': 'testpass123'
                }
            )

        self.assertEqual(response.status_code,
                         status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(
            response.data['error'], 'Rate limit exceeded. Please try again later.')

    def test_password_reset_rate_limit(self):
        for _ in range(4):  # Trying 4 times (limit is 3/hour)
            response = self.client.post(
                reverse('request_password_reset'),
                {'email': self.user_data['email']}
            )

        self.assertEqual(response.status_code,
                         status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(
            response.data['error'], 'Rate limit exceeded. Please try again later.')

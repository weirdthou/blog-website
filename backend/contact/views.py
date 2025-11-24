from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from .models import Contact
from .serializers import ContactSerializer
from core.utils import log_action, log_exception, rate_limit_decorator
from django.core.mail import send_mail
from django.conf import settings

# Create your views here.


class ContactCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ContactSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Check for newsletter subscription duplicate
            email = serializer.validated_data.get('email')
            newsletter = serializer.validated_data.get('newsletter', False)
            
            # If user wants to subscribe to newsletter, check if already subscribed
            if newsletter and Contact.objects.filter(email=email, newsletter=True).exists():
                # Don't create duplicate newsletter subscription, but still save the message
                # Update the newsletter flag to False for this message entry
                serializer.validated_data['newsletter'] = False
            
            contact = serializer.save()
            
            # If user wanted newsletter but was already subscribed, let them know
            message = 'Your message has been sent successfully.'
            if newsletter and not contact.newsletter:
                message += ' You are already subscribed to our newsletter.'
            
            return Response({
                'message': message,
                'status': 'success',
                'id': contact.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to save contact message'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ContactAPIView(generics.ListCreateAPIView):
    serializer_class = ContactSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return Contact.objects.all()
        return Contact.objects.none()

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response(
                {"error": "You do not have permission to view contacts"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().get(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            email = serializer.validated_data.get('email')
            newsletter = serializer.validated_data.get('newsletter', False)
            
            # If this is a newsletter-only subscription (no actual message)
            message = serializer.validated_data.get('message', '').strip()
            if newsletter and (not message or message == 'Newsletter subscription only'):
                # Check if already subscribed
                if Contact.objects.filter(email=email, newsletter=True).exists():
                    return Response({
                        'message': 'This email is already subscribed to our newsletter.',
                        'status': 'already_subscribed'
                    }, status=status.HTTP_200_OK)
            
            contact = serializer.save()
            return Response({
                "message": "Contact message sent successfully" if message else "Newsletter subscription successful",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to process request'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ContactSubmissionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        queryset = Contact.objects.all()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-date')


class ContactSubmissionDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAdminUser]
    queryset = Contact.objects.all()


class UpdateSubmissionStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        contact = get_object_or_404(Contact, pk=pk)
        status = request.data.get('status')
        if status in dict(Contact.STATUS_CHOICES):
            contact.status = status
            contact.save()
            return Response({'status': 'success'})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)


class AddSubmissionNoteView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        contact = get_object_or_404(Contact, pk=pk)
        note = request.data.get('note')
        if note:
            contact.notes = note
            contact.save()
            return Response({'status': 'success'})
        return Response({'error': 'Note is required'}, status=status.HTTP_400_BAD_REQUEST)

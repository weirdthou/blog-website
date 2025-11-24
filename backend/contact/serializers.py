from rest_framework import serializers
from .models import Contact
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['name', 'email', 'subject',
                  'message', 'newsletter', 'date', 'status']
        read_only_fields = ['date', 'status']

    def validate_email(self, value):
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError(
                "Please enter a valid email address.")
        return value

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long.")
        return value.strip()

    def validate_subject(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError(
                "Subject must be at least 5 characters long.")
        return value.strip()

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Message must be at least 10 characters long.")
        return value.strip()

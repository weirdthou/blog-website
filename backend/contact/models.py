from django.db import models
from users.models import User


class Contact(models.Model):
    STATUS_CHOICES = (
        ('new', 'New'),
        ('in-progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('archived', 'Archived'),
    )

    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='new')
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_contacts')
    notes = models.TextField(blank=True)
    newsletter = models.BooleanField(default=False)

    class Meta:
        db_table = 'contacts'
        ordering = ['-date']

    def __str__(self):
        return f"{self.subject} - {self.name}"

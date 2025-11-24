from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject',
                    'date', 'status', 'assigned_to')
    list_filter = ('status', 'date')
    search_fields = ('name', 'email', 'subject', 'message')
    raw_id_fields = ('assigned_to',)
    list_editable = ('status', 'assigned_to')
    date_hierarchy = 'date'
    ordering = ('-date',)

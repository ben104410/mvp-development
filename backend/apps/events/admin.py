from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'venue',
        'starts_at',
        'ends_at',
        'status',
        'created_by',
    )
    list_filter = ('status', 'starts_at', 'venue')
    search_fields = ('title', 'description', 'venue')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-starts_at',)

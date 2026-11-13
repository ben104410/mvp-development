from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "priority", "status", "created_by", "expires_at", "created_at")
    list_filter = ("priority", "status", "created_at")
    search_fields = ("title", "message", "created_by__username")
    readonly_fields = ("created_at", "updated_at")

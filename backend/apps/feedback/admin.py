from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("user__username", "comments", "event__title")
    readonly_fields = ("created_at",)

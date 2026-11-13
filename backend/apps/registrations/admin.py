from django.contrib import admin
from .models import EventRegistration, CheckIn


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "status", "qr_token", "registered_at")
    list_filter = ("status", "registered_at")
    search_fields = ("user__username", "user__email", "event__title", "qr_token")
    readonly_fields = ("qr_token", "registered_at")


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ("registration", "checked_in_by", "checked_in_at", "method")
    list_filter = ("method", "checked_in_at")
    search_fields = (
        "registration__user__username",
        "registration__event__title",
        "checked_in_by__username",
    )
    readonly_fields = ("checked_in_at",)

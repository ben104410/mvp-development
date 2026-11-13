
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import EventRegistration, CheckIn


class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(
        source="event.title",
        read_only=True,
    )
    event_starts_at = serializers.DateTimeField(
        source="event.starts_at",
        read_only=True,
    )
    event_venue = serializers.CharField(
        source="event.venue",
        read_only=True,
    )
    checked_in = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            "id",
            "event",
            "event_title",
            "event_starts_at",
            "event_venue",
            "status",
            "qr_token",
            "registered_at",
            "checked_in",
        ]
        read_only_fields = fields

    @extend_schema_field(serializers.BooleanField())
    def get_checked_in(self, obj) -> bool:
        return hasattr(obj, "checkin")


class CheckInSerializer(serializers.ModelSerializer):
    attendee_username = serializers.CharField(
        source="registration.user.username",
        read_only=True,
    )
    event_title = serializers.CharField(
        source="registration.event.title",
        read_only=True,
    )

    class Meta:
        model = CheckIn
        fields = [
            "id",
            "attendee_username",
            "event_title",
            "checked_in_by",
            "checked_in_at",
            "method",
        ]
        read_only_fields = fields


class EventRegistrationRequestSerializer(serializers.Serializer):
    event_id = serializers.IntegerField(help_text="ID of the published event to register for.")


class ScanCheckInRequestSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField(help_text="UUID QR token from attendee registration.")


class EventAnalyticsSerializer(serializers.Serializer):
    event_id = serializers.IntegerField()
    event_title = serializers.CharField()
    capacity = serializers.IntegerField(allow_null=True)
    registrations = serializers.IntegerField()
    checked_in = serializers.IntegerField()
    not_checked_in = serializers.IntegerField()
    attendance_rate_percent = serializers.FloatField()


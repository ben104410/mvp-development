
from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "venue",
            "starts_at",
            "ends_at",
            "capacity",
            "status",
            "livestream_url",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        starts_at = attrs.get(
            "starts_at",
            getattr(self.instance, "starts_at", None),
        )
        ends_at = attrs.get(
            "ends_at",
            getattr(self.instance, "ends_at", None),
        )

        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError({
                "ends_at": "The end time must be after the start time."
            })

        capacity = attrs.get(
            "capacity",
            getattr(self.instance, "capacity", None),
        )

        if capacity == 0:
            raise serializers.ValidationError({
                "capacity": "Capacity must be greater than zero."
            })

        return attrs

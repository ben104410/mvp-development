
from rest_framework import serializers

from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "message",
            "priority",
            "status",
            "expires_at",
            "created_by",
            "author_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "author_username",
            "created_at",
            "updated_at",
        ]

from rest_framework import serializers

from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = Feedback
        fields = [
            "id",
            "event",
            "event_title",
            "rating",
            "comments",
            "user",
            "username",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "event_title",
            "created_at",
        ]

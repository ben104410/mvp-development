
from rest_framework import serializers

from .models import NewsArticle


class NewsArticleSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = NewsArticle
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "image_url",
            "status",
            "published_at",
            "created_by",
            "author_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "created_by",
            "author_username",
            "created_at",
            "updated_at",
        ]

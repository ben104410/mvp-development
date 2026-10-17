from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.events.permissions import IsOrganizerOrAdmin
from .models import NewsArticle
from .serializers import NewsArticleSerializer


class NewsArticleViewSet(viewsets.ModelViewSet):
    serializer_class = NewsArticleSerializer

    def get_queryset(self):
        queryset = NewsArticle.objects.select_related("created_by")

        user = self.request.user
        can_manage = (
            user.is_authenticated
            and (
                user.is_superuser
                or user.role in ("organizer", "admin")
            )
        )

        if can_manage:
            return queryset

        return queryset.filter(
            status=NewsArticle.Status.PUBLISHED,
            published_at__lte=timezone.now(),
        )

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]

        return [IsOrganizerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

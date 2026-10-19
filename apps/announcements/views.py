from django.shortcuts import render

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from common.permissions import IsOrganizerOrAdmin
from .models import Announcement
from .serializers import AnnouncementSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        queryset = Announcement.objects.select_related("created_by")

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

        now = timezone.now()
        return queryset.filter(
            status=Announcement.Status.PUBLISHED
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]

        return [IsOrganizerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# Create your views here.

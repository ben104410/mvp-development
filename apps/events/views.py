from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Event
from .permissions import IsOrganizerOrAdmin
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.select_related("created_by")

        user = self.request.user

        if user.is_authenticated and (
            user.is_superuser
            or user.groups.filter(name__in=("organizer", "admin")).exists()
        ):
            return queryset

        return queryset.filter(status=Event.Status.PUBLISHED)

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]

        return [IsOrganizerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
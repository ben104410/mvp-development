from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related("user", "event")
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Feedback.objects.none()

        user = self.request.user
        if not user.is_authenticated:
            return Feedback.objects.none()

        queryset = Feedback.objects.select_related("user", "event")

        if (
            user.is_superuser
            or user.is_staff
            or user.groups.filter(
                name__in=(
                    "organizer",
                    "admin",
                    "administrator",
                    "administrators",
                    "staff",
                )
            ).exists()
        ):
            event_id = self.request.query_params.get("event")
            if event_id:
                queryset = queryset.filter(event_id=event_id)
            return queryset

        return queryset.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


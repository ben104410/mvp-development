from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event
from apps.events.permissions import IsOrganizerOrAdmin
from .models import EventRegistration, CheckIn
from .serializers import (
    EventRegistrationSerializer,
    CheckInSerializer,
)


class RegisterForEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_superuser or user.groups.filter(
            name__in=("organizer", "admin")
        ).exists():
            raise ValidationError(
                "Only attendee accounts can register for events."
            )

        event_id = request.data.get("event_id")

        if not event_id:
            raise ValidationError({"event_id": "This field is required."})

        with transaction.atomic():
            event = get_object_or_404(
                Event.objects.select_for_update(),
                pk=event_id,
                status=Event.Status.PUBLISHED,
            )

            if event.ends_at <= timezone.now():
                raise ValidationError(
                    "Registration is closed because this event has ended."
                )

            existing = EventRegistration.objects.filter(
                user=user,
                event=event,
            ).first()

            if existing and existing.status == EventRegistration.Status.REGISTERED:
                raise ValidationError("You are already registered for this event.")

            active_count = EventRegistration.objects.filter(
                event=event,
                status=EventRegistration.Status.REGISTERED,
            ).count()

            if event.capacity is not None and active_count >= event.capacity:
                raise ValidationError("This event is fully booked.")

            try:
                if existing:
                    existing.status = EventRegistration.Status.REGISTERED
                    existing.save(update_fields=["status"])
                    registration = existing
                else:
                    registration = EventRegistration.objects.create(
                        user=user,
                        event=event,
                    )
            except IntegrityError:
                raise ValidationError(
                    "A registration already exists for this event."
                )

        return Response(
            EventRegistrationSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )


class MyRegistrationsView(generics.ListAPIView):
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            EventRegistration.objects
            .filter(user=self.request.user)
            .select_related("event")
        )


class ScanCheckInView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizerOrAdmin]

    def post(self, request):
        token = request.data.get("qr_token")

        if not token:
            raise ValidationError({"qr_token": "This field is required."})

        with transaction.atomic():
            registration = get_object_or_404(
                EventRegistration.objects.select_for_update().select_related(
                    "event", "user"
                ),
                qr_token=token,
                status=EventRegistration.Status.REGISTERED,
                event__status=Event.Status.PUBLISHED,
            )

            if registration.event.ends_at <= timezone.now():
                raise ValidationError("This event has ended.")

            if CheckIn.objects.filter(registration=registration).exists():
                raise ValidationError("This ticket has already been checked in.")

            checkin = CheckIn.objects.create(
                registration=registration,
                checked_in_by=request.user,
                method="qr",
            )

        return Response(
            CheckInSerializer(checkin).data,
            status=status.HTTP_201_CREATED,
        )


class EventAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)

        registrations = EventRegistration.objects.filter(
            event=event,
            status=EventRegistration.Status.REGISTERED,
        )

        registered_count = registrations.count()
        checked_in_count = CheckIn.objects.filter(
            registration__in=registrations
        ).count()

        attendance_rate = (
            round(checked_in_count / registered_count * 100, 2)
            if registered_count else 0
        )

        return Response({
            "event_id": event.id,
            "event_title": event.title,
            "capacity": event.capacity,
            "registrations": registered_count,
            "checked_in": checked_in_count,
            "not_checked_in": registered_count - checked_in_count,
            "attendance_rate_percent": attendance_rate,
        })

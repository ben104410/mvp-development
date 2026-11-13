from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from apps.events.models import Event

from .models import CheckIn, EventRegistration


class EventRegistrationModelTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(username='attendee')
        self.organizer = user_model.objects.create_user(username='organizer')
        starts_at = timezone.now() + timedelta(days=1)
        self.event = Event.objects.create(
            title='Community meetup',
            description='A community event',
            venue='Main hall',
            starts_at=starts_at,
            ends_at=starts_at + timedelta(hours=1),
            created_by=self.organizer,
        )

    def test_registration_defaults_and_unique_qr_token(self):
        first = EventRegistration.objects.create(
            user=self.user,
            event=self.event,
        )
        second_user = get_user_model().objects.create_user(username='attendee2')
        second = EventRegistration.objects.create(
            user=second_user,
            event=self.event,
        )

        self.assertEqual(first.status, EventRegistration.Status.REGISTERED)
        self.assertNotEqual(first.qr_token, second.qr_token)

    def test_user_cannot_register_for_same_event_twice(self):
        EventRegistration.objects.create(user=self.user, event=self.event)

        with self.assertRaises(IntegrityError), transaction.atomic():
            EventRegistration.objects.create(user=self.user, event=self.event)

    def test_registration_can_have_only_one_checkin(self):
        registration = EventRegistration.objects.create(
            user=self.user,
            event=self.event,
        )
        CheckIn.objects.create(
            registration=registration,
            checked_in_by=self.organizer,
        )

        with self.assertRaises(IntegrityError), transaction.atomic():
            CheckIn.objects.create(
                registration=registration,
                checked_in_by=self.organizer,
            )


class RegistrationAPITests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.organizer = user_model.objects.create_user(
            username="organizer_reg", password="password123"
        )
        from django.contrib.auth.models import Group

        group, _ = Group.objects.get_or_create(name="organizer")
        self.organizer.groups.add(group)

        self.attendee = user_model.objects.create_user(
            username="attendee_reg", password="password123"
        )

        from rest_framework.test import APIClient

        self.client = APIClient()

        starts_at = timezone.now() + timedelta(days=2)
        self.event = Event.objects.create(
            title="Open Source Summit",
            description="Summit details",
            venue="Auditorium",
            starts_at=starts_at,
            ends_at=starts_at + timedelta(hours=4),
            capacity=10,
            status=Event.Status.PUBLISHED,
            created_by=self.organizer,
        )

    def test_attendee_can_register_and_view_my_registrations(self):
        self.client.force_authenticate(user=self.attendee)

        # Register
        reg_response = self.client.post(
            "/api/v1/register/",
            {"event_id": self.event.id},
            format="json",
        )
        self.assertEqual(reg_response.status_code, 201)
        qr_token = reg_response.data["qr_token"]

        # View my registrations
        my_response = self.client.get("/api/v1/mine/")
        self.assertEqual(my_response.status_code, 200)
        self.assertEqual(len(my_response.data), 1)
        self.assertEqual(my_response.data[0]["event_title"], "Open Source Summit")
        self.assertFalse(my_response.data[0]["checked_in"])

        # Scan check-in as organizer
        self.client.force_authenticate(user=self.organizer)
        scan_response = self.client.post(
            "/api/v1/check-ins/scan/",
            {"qr_token": qr_token},
            format="json",
        )
        self.assertEqual(scan_response.status_code, 201)

        # Verify analytics
        analytics_response = self.client.get(
            f"/api/v1/analytics/events/{self.event.id}/"
        )
        self.assertEqual(analytics_response.status_code, 200)
        self.assertEqual(analytics_response.data["registrations"], 1)
        self.assertEqual(analytics_response.data["checked_in"], 1)
        self.assertEqual(analytics_response.data["attendance_rate_percent"], 100.0)

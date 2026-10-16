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

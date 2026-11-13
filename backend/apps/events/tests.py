from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from .models import Event
from .permissions import EventReadOrManagePermission, IsOrganizerOrAdmin


class EventModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='organizer')
        self.starts_at = timezone.now() + timedelta(days=1)

    def test_clean_rejects_end_time_before_start_time(self):
        event = Event(
            title='Community meetup',
            venue='Main hall',
            starts_at=self.starts_at,
            ends_at=self.starts_at,
            created_by=self.user,
        )

        with self.assertRaises(ValidationError):
            event.clean()

    def test_save_generates_unique_slugs(self):
        event = Event.objects.create(
            title='Community Meetup',
            description='First event',
            venue='Main hall',
            starts_at=self.starts_at,
            ends_at=self.starts_at + timedelta(hours=1),
            created_by=self.user,
        )
        duplicate = Event.objects.create(
            title='Community Meetup',
            description='Second event',
            venue='Main hall',
            starts_at=self.starts_at + timedelta(days=1),
            ends_at=self.starts_at + timedelta(days=1, hours=1),
            created_by=self.user,
        )

        self.assertEqual(event.slug, 'community-meetup')
        self.assertEqual(duplicate.slug, 'community-meetup-2')


class EventPermissionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = EventReadOrManagePermission()
        self.organizer_permission = IsOrganizerOrAdmin()
        self.user = get_user_model().objects.create_user(username='member')

    def test_published_event_reads_are_public(self):
        for method in ('get', 'head', 'options'):
            request = getattr(self.factory, method)('/api/v1/events/')
            self.assertTrue(self.permission.has_permission(request, None))

    def test_changes_require_organizer_or_admin_group(self):
        request = self.factory.post('/api/v1/events/')
        request.user = self.user
        self.assertFalse(self.permission.has_permission(request, None))

        organizer_group, _ = Group.objects.get_or_create(name='organizer')
        self.user.groups.add(organizer_group)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_admin_group_and_superuser_can_manage_events(self):
        request = self.factory.patch('/api/v1/events/')
        admin_group, _ = Group.objects.get_or_create(name='admin')
        self.user.groups.add(admin_group)
        request.user = self.user
        self.assertTrue(self.organizer_permission.has_permission(request, None))

        superuser = get_user_model().objects.create_superuser(
            username='root',
            password='test-password',
        )
        request.user = superuser
        self.assertTrue(self.organizer_permission.has_permission(request, None))

    def test_anonymous_user_cannot_manage_events(self):
        request = self.factory.delete('/api/v1/events/')
        request.user = AnonymousUser()
        self.assertFalse(self.permission.has_permission(request, None))

from datetime import timedelta
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Announcement

User = get_user_model()


class AnnouncementTests(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            username="organizer_ann",
            password="password123",
        )
        group, _ = Group.objects.get_or_create(name="organizer")
        self.organizer.groups.add(group)

        self.member = User.objects.create_user(
            username="member_ann",
            password="password123",
        )

        self.published = Announcement.objects.create(
            title="Published Notice",
            message="Welcome everyone!",
            status=Announcement.Status.PUBLISHED,
            priority=Announcement.Priority.IMPORTANT,
            created_by=self.organizer,
        )
        self.draft = Announcement.objects.create(
            title="Draft Notice",
            message="Internal notes",
            status=Announcement.Status.DRAFT,
            created_by=self.organizer,
        )
        self.expired = Announcement.objects.create(
            title="Expired Notice",
            message="Old notice",
            status=Announcement.Status.PUBLISHED,
            expires_at=timezone.now() - timedelta(days=1),
            created_by=self.organizer,
        )

    def test_public_can_view_only_active_published_announcements(self):
        response = self.client.get("/api/v1/announcements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data]
        self.assertIn("Published Notice", titles)
        self.assertNotIn("Draft Notice", titles)
        self.assertNotIn("Expired Notice", titles)

    def test_member_cannot_create_announcement(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post("/api/v1/announcements/", {
            "title": "Unauthorized Notice",
            "message": "Should fail",
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_organizer_can_create_announcement(self):
        self.client.force_authenticate(user=self.organizer)
        response = self.client.post("/api/v1/announcements/", {
            "title": "Hackathon Tomorrow",
            "message": "Starts at 9 AM",
            "priority": "urgent",
            "status": "published",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["author_username"], "organizer_ann")


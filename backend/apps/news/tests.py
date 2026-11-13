from datetime import timedelta
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import NewsArticle

User = get_user_model()


class NewsArticleTests(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            username="organizer_news",
            password="password123",
        )
        group, _ = Group.objects.get_or_create(name="organizer")
        self.organizer.groups.add(group)

        self.member = User.objects.create_user(
            username="member_news",
            password="password123",
        )

        self.published = NewsArticle.objects.create(
            title="Tech Summit Announced",
            summary="Big tech summit coming soon",
            content="Full details of the summit...",
            status=NewsArticle.Status.PUBLISHED,
            published_at=timezone.now() - timedelta(hours=1),
            created_by=self.organizer,
        )
        self.future = NewsArticle.objects.create(
            title="Future Article",
            summary="Not out yet",
            content="Details...",
            status=NewsArticle.Status.PUBLISHED,
            published_at=timezone.now() + timedelta(days=2),
            created_by=self.organizer,
        )
        self.draft = NewsArticle.objects.create(
            title="Draft News",
            summary="Draft",
            content="Draft content",
            status=NewsArticle.Status.DRAFT,
            created_by=self.organizer,
        )

    def test_auto_slug_generated(self):
        self.assertEqual(self.published.slug, "tech-summit-announced")

    def test_public_can_view_only_currently_published_news(self):
        response = self.client.get("/api/v1/news/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data]
        self.assertIn("Tech Summit Announced", titles)
        self.assertNotIn("Future Article", titles)
        self.assertNotIn("Draft News", titles)

    def test_member_cannot_create_news(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post("/api/v1/news/", {
            "title": "Unauthorized Article",
            "summary": "Summary",
            "content": "Content",
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_organizer_can_create_news(self):
        self.client.force_authenticate(user=self.organizer)
        response = self.client.post("/api/v1/news/", {
            "title": "New Innovation Lab",
            "summary": "Lab is open",
            "content": "Come check it out!",
            "status": "published",
            "published_at": timezone.now().isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "new-innovation-lab")


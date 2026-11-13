from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Feedback

User = get_user_model()


class FeedbackTests(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            username="organizer_fb",
            password="password123",
        )
        group, _ = Group.objects.get_or_create(name="organizer")
        self.organizer.groups.add(group)

        self.member1 = User.objects.create_user(
            username="member1_fb",
            password="password123",
        )
        self.member2 = User.objects.create_user(
            username="member2_fb",
            password="password123",
        )

        self.fb1 = Feedback.objects.create(
            user=self.member1,
            rating=5,
            comments="Awesome workshop!",
        )

    def test_anonymous_cannot_access_feedback(self):
        response = self.client.get("/api/v1/feedback/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_submit_feedback(self):
        self.client.force_authenticate(user=self.member2)
        response = self.client.post("/api/v1/feedback/", {
            "rating": 4,
            "comments": "Great facilities and helpful staff.",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "member2_fb")
        self.assertEqual(response.data["rating"], 4)

    def test_member_sees_only_own_feedback(self):
        self.client.force_authenticate(user=self.member2)
        response = self.client.get("/api/v1/feedback/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        self.client.force_authenticate(user=self.member1)
        response = self.client.get("/api/v1/feedback/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_organizer_sees_all_feedback(self):
        self.client.force_authenticate(user=self.organizer)
        response = self.client.get("/api/v1/feedback/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


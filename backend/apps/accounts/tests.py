from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APITestCase

from .serializers import RegisterSerializer, UserProfileSerializer


class RegisterSerializerTests(APITestCase):
    def test_rejects_password_confirmation_mismatch(self):
        serializer = RegisterSerializer(
            data={
                "username": "new-member",
                "email": "member@example.com",
                "password": "Strong-Unique-Password-937!",
                "password2": "Different-Password-937!",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("password2", serializer.errors)

    def test_creates_account_with_matching_password_confirmation(self):
        serializer = RegisterSerializer(
            data={
                "username": "new-member",
                "email": "member@example.com",
                "password": "Strong-Unique-Password-937!",
                "password2": "Strong-Unique-Password-937!",
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertTrue(user.check_password("Strong-Unique-Password-937!"))


class UserProfileSerializerTests(APITestCase):
    def test_profile_includes_group_names_and_superuser_status(self):
        user = get_user_model().objects.create_user(
            username="organizer",
            password="test-password",
        )
        organizer_group = Group.objects.create(name="organizer")
        user.groups.add(organizer_group)

        profile = UserProfileSerializer(user).data

        self.assertEqual(profile["groups"], ["organizer"])
        self.assertFalse(profile["is_superuser"])

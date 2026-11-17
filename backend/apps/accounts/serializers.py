
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.models import Group
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[password_validation.validate_password],
    )
    password2 = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=["user", "admin", "organizer"],
        default="user",
        write_only=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password2",
            "role",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password2": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("password2")
        role = validated_data.pop("role", "user")

        is_admin = role in ("admin", "organizer")

        user = User.objects.create_user(
            password=password,
            is_staff=is_admin,
            **validated_data,
        )

        if is_admin:
            admin_group, _ = Group.objects.get_or_create(name="admin")
            user.groups.add(admin_group)

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="name",
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "groups",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = fields

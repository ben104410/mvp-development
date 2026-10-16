import uuid

from django.conf import settings
from django.db import models


class EventRegistration(models.Model):
    class Status(models.TextChoices):
        REGISTERED = 'registered', 'Registered'
        CANCELLED = 'cancelled', 'Cancelled'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_registrations',
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.PROTECT,
        related_name='registrations',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REGISTERED,
    )
    qr_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-registered_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'event'],
                name='unique_user_event_registration',
            ),
        ]

    def __str__(self):
        return f'{self.user.username} - {self.event.title}'


class CheckIn(models.Model):
    class Method(models.TextChoices):
        QR = 'qr', 'QR Code'
        MANUAL = 'manual', 'Manual'

    registration = models.OneToOneField(
        EventRegistration,
        on_delete=models.PROTECT,
        related_name='checkin',
    )
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='recorded_checkins',
    )
    checked_in_at = models.DateTimeField(auto_now_add=True)
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.QR,
    )

    def __str__(self):
        return f'Check-in: {self.registration}'

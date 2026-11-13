
from django.urls import path

from .views import (
    RegisterForEventView,
    MyRegistrationsView,
    ScanCheckInView,
    EventAnalyticsView,
)

urlpatterns = [
    path(
        "register/",
        RegisterForEventView.as_view(),
        name="event-register",
    ),
    path(
        "mine/",
        MyRegistrationsView.as_view(),
        name="my-registrations",
    ),
    path(
        "check-ins/scan/",
        ScanCheckInView.as_view(),
        name="scan-check-in",
    ),
    path(
        "analytics/events/<int:event_id>/",
        EventAnalyticsView.as_view(),
        name="event-analytics",
    ),
]

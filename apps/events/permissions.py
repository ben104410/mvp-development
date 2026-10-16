from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrganizerOrAdmin(BasePermission):
    """Allow event management to organizers, admins, and superusers."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.groups.filter(name__in=('organizer', 'admin')).exists()
            )
        )


class EventReadOrManagePermission(BasePermission):
    """Allow public reads of events and restrict changes to event managers."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return IsOrganizerOrAdmin().has_permission(request, view)

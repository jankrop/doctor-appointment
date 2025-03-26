from rest_framework import permissions

class IsPacjent(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, 'pacjent'):
            return False

        return obj.pacjent == request.user.pacjent
from rest_framework import permissions

class IsPacjent(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.pacjent == request.user.pacjent
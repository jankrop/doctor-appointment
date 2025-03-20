from rest_framework import generics, permissions, mixins, viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Lekarz, Wizyta
from .permissions import IsPacjent
from .serializers import LekarzSerializer, WizytaSerializer


class LekarzViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    queryset = Lekarz.objects.all()
    serializer_class = LekarzSerializer


class WizytaViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    def get_queryset(self):
        return self.request.user.pacjent.wizyta_set.all()

    serializer_class = WizytaSerializer
    permission_classes = IsPacjent, permissions.IsAuthenticated

    def perform_create(self, serializer):
        serializer.save(pacjent=self.request.user.pacjent)

    def destroy(self, request, *args, **kwargs):
        wizyta = self.get_object()
        wizyta.status = 1  # Update status to 'odwołana'
        wizyta.save()
        return Response({"detail": "Wizyta status set to canceled."}, status=status.HTTP_200_OK)

# class WizytaCreate(generics.CreateAPIView):
#     queryset = Wizyta.objects.all()
#     serializer_class = WizytaSerializer
#
# class WizytaDestroy(generics.DestroyAPIView):
#     queryset = Wizyta.objects.all()
#     serializer_class = WizytaSerializer
#     permission_classes = [IsPacjent]
#
# class WizytaList(generics.ListAPIView):
#     def get_queryset(self):
#         return self.request.user.pacjent.wizyta_set.all()
#
#     serializer_class = WizytaSerializer

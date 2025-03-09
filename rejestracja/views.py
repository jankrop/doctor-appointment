from rest_framework import views, generics, permissions, mixins

from .models import Lekarz, Wizyta
from .permissions import IsPacjent
from .serializers import LekarzSerializer, WizytaSerializer


class LekarzView(generics.ListAPIView):
    queryset = Lekarz.objects.all()
    serializer_class = LekarzSerializer

class WizytaView(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    generics.GenericAPIView
):
    def get_queryset(self):
        return self.request.user.pacjent.wizyta_set.all()

    serializer_class = WizytaSerializer
    permission_classes = (IsPacjent,)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        kwargs['status'] = 1  # Changes status to cancelled instead of deleting
        return self.partial_update(request, *args, **kwargs)

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

from django.urls import path
from rest_framework import routers

from .views import LekarzViewSet, WizytaViewSet

router = routers.DefaultRouter()
router.register(r'wizyta', WizytaViewSet, 'wizyta')
router.register(r'lekarz', LekarzViewSet, 'lekarz')

urlpatterns = [

] + router.urls

print(urlpatterns)
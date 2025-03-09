from django.urls import path

from .views import LekarzView, WizytaView

urlpatterns = [
    path('lekarz/', LekarzView.as_view()),
    path('wizyta/', WizytaView.as_view()),
]
from django.urls import path

from .views import index, api_docs

urlpatterns = [
    path('', index),
]
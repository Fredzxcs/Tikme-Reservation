from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('api.urls')),  # API routes for tikmeReservation app
]

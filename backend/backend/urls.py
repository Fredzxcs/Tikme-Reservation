from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('reservation.urls')),  # API routes for tikmeReservation app
    path('auth/', include('authentication.urls')),  # API routes for authentication
    path('api/', include('api.urls')),  # API routes for authentication
    path('systemadmin/', admin.site.urls),  # Admin interface
]

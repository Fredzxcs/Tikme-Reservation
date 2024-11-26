from django.urls import path
from .views import (
    create_reservation,
    admin_dashboard,
)


urlpatterns = [
    # Authentication
    path('admin_dashboard/', admin_dashboard, name='admin_dashboard'),
    path('create_reservation/', create_reservation, name='create_reservation'),
    
]
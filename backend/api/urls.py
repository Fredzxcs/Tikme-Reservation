from django.urls import path
from .views import (
    # create_reservation,
    admin_dashboard,
    event_reservation
)


urlpatterns = [
    # Authentication
    path('admin_dashboard/', admin_dashboard, name='admin_dashboard'),
    # path('create_reservation/', create_reservation, name='create_reservation'),
    path('event_reservation/', event_reservation, name='event_reservation'),
    
    
]
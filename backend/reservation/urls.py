from django.urls import path
from .views import *

urlpatterns = [
    # Customer URLs
    path('', views_.reservation_customer_view, name='reservation-customer'),
    path('reservation/', views_.reservation_view, name='reservation'),
    path('send_contact_email/', views_.send_contact_email_view, name='send_contact_email'),
    path('survey/', views_.survey_view, name='survey'),
    path('cancel_reservation/', views_.cancel_reservation_view, name='cancel_reservation'),
    path('reservation_dinein/', views_.reservation_dinein_view, name='reservation_dinein'),

    path('customers/', views_customers.CustomerListCreateView.as_view(), name='customer-list-create'),
    path('customers/<int:pk>/', views_customers.CustomerDetailView.as_view(), name='customer-detail'),

    # Venue URLs
    path('venues/', views_venue.VenueListCreateView.as_view(), name='venue-list-create'),
    path('venues/<int:pk>/', views_venue.VenueDetailView.as_view(), name='venue-detail'),

    # Package URLs
    path('packages/', views_package.PackageListCreateView.as_view(), name='package-list-create'),
    path('packages/<int:pk>/', views_package.PackageDetailView.as_view(), name='package-detail'),

    # Service Type URLs
    path('service-types/', views_services.ServiceTypeListCreateView.as_view(), name='service-type-list-create'),
    path('service-types/<int:pk>/', views_services.ServiceTypeDetailView.as_view(), name='service-type-detail'),

    # Reservation URLs
    path('reservations/', views_reservations.ReservationsListCreateView.as_view(), name='reservation-list-create'),
    path('reservations/<int:pk>/', views_reservations.ReservationsDetailView.as_view(), name='reservation-detail'),
    path('reservations/status-check/', views_reservations.ReservationStatusCheckView.as_view(), name='reservation-status-check'),
    path('reservations/cancel/', views_reservations.ReservationCancelView.as_view(), name='reservation-cancel'),

    # Equipment URLs
    path('equipments/', views_equipments.EquipmentListCreateView.as_view(), name='equipment-list'),  # List all equipment
    path('equipments/<int:pk>/', views_equipments.EquipmentDetailView.as_view(), name='equipment-detail'),  # Get specific equipment by ID

    # Your new API URL for Products
    path('products_api/', views_api.ProductsView.as_view(), name='product-list'),
]

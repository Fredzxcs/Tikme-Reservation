from django.urls import path
from .views import *

urlpatterns = [
    # Rendering templates
    path('', views_.customer_website_view, name='customer-website'),
    path('home/', views_.customer_website_view, name='customer-website'),
    path('survey/', views_.survey_view, name='survey'),
    path('event-calendar/', views_.event_calendar_view, name='event-calendar'),
    path('event-reservation/', views_.event_reservation_view, name='event-reservation'),
    path('dine-in-calendar/', views_.dine_in_calendar_view, name='dine-in-calendar'),
    path('dine-in-reservation/', views_.dine_in_reservation_view, name='dine-in-reservation'),
    path('cancel-reservation/', views_.cancel_reservation_view, name='cancel-reservation'),

    # Visitors
    path('api/get-visitors/', views_.get_visitors_count_view, name='get-visitors'),


    # Customers
    path('api/customers/', views_customers.CustomerListCreateView.as_view(), name='api-customer-list-create'),
    path('api/customers/<int:pk>/', views_customers.CustomerDetailView.as_view(), name='api-customer-detail'),

    path('api/dine-in-calendar/', views_dine_in_calendar.DineInCalendarListCreateView.as_view(), name='api-dine-in-calendar'),
    path('api/dine-in-calendar/<int:pk>/', views_dine_in_calendar.DineInCalendarDetailView.as_view(), name='api-dine-in-calendar-detail'),

    # Event Calendar
    path('api/event-calendar/', views_event_calendar.EventCalendarListCreateView.as_view(), name='api-event-calendar'),
    path('api/event-calendar/<int:pk>/', views_event_calendar.EventCalendarDetailView.as_view(), name='api-event-calendar-detail'),

    # Dine-In Reservations
    path('api/dine-in/', views_dine_in_reservation.DineInReservationListCreateView.as_view(), name='api-dine-in-list-create'),
    path('api/dine-in/<int:pk>/', views_dine_in_reservation.DineInReservationDetailView.as_view(), name='api-dine-in-detail'),
    # Event Reservations
    path('api/event-reservation/', views_event_reservation.EventReservationListCreateView.as_view(), name='api-event-reservation-list-create'),
    path('api/event-reservation/<int:pk>/', views_event_reservation.EventReservationDetailView.as_view(), name='api-event-reservation-detail'),
    
    # Venues
    path('api/venues/', views_venue.VenueListCreateView.as_view(), name='api-venue-list-create'),
    path('api/venues/<int:pk>/', views_venue.VenueDetailView.as_view(), name='api-venue-detail'),

    # Packages
    path('api/packages/', views_packages.PackageListCreateView.as_view(), name='api-package-list-create'),
    path('api/packages/<int:pk>/', views_packages.PackageDetailView.as_view(), name='api-package-detail'),

    path('api/survey/', views_survey.SurveyListCreateView.as_view(), name='api-survey-list-create'),
    path('api/survey/<int:pk>/', views_survey.SurveyDetailView.as_view(), name='api-survey-detail'),

    # Emails
    path('send-contact-email/', views_emails.ContactView.as_view(), name='send-contact-email'),

    # OTP Route
    path('send-otp/', views_cancel_reservation.SendOtpView.as_view(), name='send-otp'),  # Add the OTP URL here

    # Cancel Reservation
    path('cancel/dinein/<str:reference_number>/', views_cancel_reservation.DineInReservationCancelView.as_view(), name='cancel_dinein_reservation'),
    path('cancel/event/<str:reference_number>/', views_cancel_reservation.EventReservationCancelView.as_view(), name='cancel_event_reservation'),

]

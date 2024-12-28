import logging
from django.shortcuts import render
from ..models import *
from ..serializers import *

# Set up logging
logger = logging.getLogger(__name__)

# Authentication Rendering
def customer_website_view(request):
    return render(request, 'customer_website.html')

def survey_view(request):
    return render(request, 'survey.html')

def cancel_reservation_view(request):
    return render(request, 'cancel_reservation.html')

def dine_in_reservation_view(request):
    return render(request, 'dine_in_reservation.html')

def event_calendar_view(request):
    return render(request, 'event_calendar.html')

def event_reservation_view(request):
    return render(request, 'event_reservation.html')




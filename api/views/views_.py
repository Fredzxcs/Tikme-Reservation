import logging
from django.shortcuts import render
from django.http import JsonResponse
from django.utils.timezone import now
from ..models import *

# Set up logging
logger = logging.getLogger(__name__)


# ✅ Helper function to get visitor's IP address
def get_client_ip_view(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# ✅ Homepage View - Logs Visitors Automatically
def customer_website_view(request):
    ip_address = get_client_ip_view(request)
    
    # ✅ Log visit in the database
    VisitorLog.objects.create(ip_address=ip_address, visit_time=now())
    
    return render(request, 'customer_website.html')

def get_visitors_count_view(request):
    count = VisitorLog.objects.count()
    return JsonResponse({"count": count})


# ✅ Views for Reservations and Other Pages
def dine_in_calendar_view(request):
    return render(request, 'dine_in_calendar.html')

def dine_in_reservation_view(request):
    return render(request, 'dine_in_reservation.html')

def event_calendar_view(request):
    return render(request, 'event_calendar.html')

def event_reservation_view(request):
    return render(request, 'event_reservation.html')

def cancel_reservation_view(request):
    return render(request, 'cancel_reservation.html')

def survey_view(request):
    return render(request, 'survey.html')


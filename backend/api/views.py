from django.shortcuts import render, redirect
# from django.contrib import messages
# from authentication.utils import jwt_authenticate  # Import from utils.py
# from authentication.models import Employee


def admin_dashboard(request):
    # Your logic for creating a reservation
    return render(request, 'admin_dashboard.html')


def event_reservation(request):
    # Your logic for creating a reservation
    return render(request, 'event_reservation.html')

# def create_reservation(request):
#     # Your logic for creating a reservation
#     return render(request, 'create_reservation.html')
from django.shortcuts import render, redirect
from django.contrib import messages
from authentication.utils import jwt_authenticate  # Import from utils.py
from authentication.models import Employee


def admin_dashboard(request):
    # Authenticate the user using the JWT token
    user = jwt_authenticate(request)

    if user:
        try:
            # Get the Employee instance associated with the authenticated user
            employee = Employee.objects.get(username=user.username)

            # Render the dashboard for authenticated employees
            return render(request, 'admin_dashboard.html', {'employee': employee})
        except Employee.DoesNotExist:
            # Handle case where Employee record is not found for the user
            messages.error(request, 'Employee record not found.')
            return render(request, 'unauthorized_access.html')  # Adjusted to render the new template
    else:
        # If JWT token is invalid or expired, return an error message
       messages.error(request, 'Invalid or Expired.Please log in again.')
    return render(request, 'invalid_link.html')  # Render unauthorized access page


def create_reservation(request):
    # Your logic for creating a reservation
    return render(request, 'create_reservation.html')
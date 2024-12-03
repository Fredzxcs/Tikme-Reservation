import logging
from django.shortcuts import render
from django.http import JsonResponse
import json
from ..models import *
from ..serializers import *
from ..emails import send_contact_email

# Set up logging
logger = logging.getLogger(__name__)

# Authentication Rendering
def reservation_customer_view(request):
    return render(request, 'reservation_customer.html')

def reservation_view(request):
    return render(request, 'reservation.html')

def send_contact_email_view(request):
    if request.method == 'POST':
        try:
            # Debug: Log CSRF tokens
            logger.debug(f"CSRF Token from Header: {request.headers.get('X-CSRFToken')}")
            logger.debug(f"CSRF Token from Cookies: {request.COOKIES.get('csrftoken')}")

            # Parse JSON data from the request body
            data = json.loads(request.body)

            # Extract required fields
            name = data.get('name')
            email = data.get('email')
            phone = data.get('phone', 'N/A')  # Default to 'N/A' if phone is not provided
            message = data.get('message')

            # Ensure all required fields are provided
            if not name or not email or not message:
                missing_fields = [field for field in ['name', 'email', 'message'] if not data.get(field)]
                return JsonResponse({'success': False, 'message': f'Missing required fields: {", ".join(missing_fields)}'}, status=400)

            # Debug: Log extracted data
            logger.debug(f"Extracted data: name={name}, email={email}, phone={phone}, message={message}")

            # Call the email-sending function
            result = send_contact_email(name, email, phone, message)

            # Return the result of the email-sending function
            if result["success"]:
                return JsonResponse({'success': True, 'message': result["message"]}, status=200)
            else:
                return JsonResponse({'success': False, 'message': result["message"]}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'message': 'Invalid JSON data.'}, status=400)
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Error in send_contact_email_view: {e}")
            return JsonResponse({'success': False, 'message': f'Error: {str(e)}'}, status=500)

    # If the request is not POST, return an error response
    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=400)

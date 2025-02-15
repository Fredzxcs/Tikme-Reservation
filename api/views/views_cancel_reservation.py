import random
import logging
import json
from rest_framework import status, views
from rest_framework.response import Response
from django.core.cache import cache
from ..models import *
from ..serializers import *
from ..emails import send_otp_email

logger = logging.getLogger(__name__)

class SendOtpView(views.APIView):
    def post(self, request):
        reference_code = request.data.get('reference_code')
        email_address = request.data.get('email_address')

        if not reference_code or not email_address:
            return Response({"detail": "Reference code and email are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(email_address=email_address)
            if reference_code.startswith('EVT'):
                reservation = EventReservation.objects.get(reference_number=reference_code)
            else:
                reservation = DineInReservation.objects.get(reference_number=reference_code, customer=customer)
        except (Customer.DoesNotExist, DineInReservation.DoesNotExist, EventReservation.DoesNotExist):
            return Response({"detail": "Incorrect email and reference code."}, status=status.HTTP_400_BAD_REQUEST)
        
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        cache.set(f"otp_{reference_code.lower()}", otp, timeout=300)  # ✅ Use lowercase keys

        try:
            send_otp_email(email_address, otp)
        except Exception as e:
            return Response({"detail": f"Error sending email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"otp": otp}, status=status.HTTP_200_OK)

class DineInReservationCancelView(views.APIView):
    def patch(self, request, reference_number):
        logger.debug("Dine-In Cancellation Request: %s", json.dumps(request.data))

        otp = request.data.get('otp')
        email_address = request.data.get('email_address')  # ✅ Fixed field name
        reference_code = request.data.get('reference_code')

        if not otp:
            return Response({"detail": "OTP is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not reference_code:
            return Response({"detail": "Reference code is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not email_address:
            return Response({"detail": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation = DineInReservation.objects.filter(
                reference_number=reference_code
            ).select_related('customer').get(customer__email_address=email_address)  # ✅ Fixed filtering
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Dine-in reservation not found."}, status=status.HTTP_404_NOT_FOUND)

        stored_otp = cache.get(f"otp_{reference_code.lower()}")  # ✅ Use lowercase key
        if not stored_otp or otp != stored_otp:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        reservation.status = 'Cancelled'  # ✅ Ensure this value is correct
        reservation.save()

        serializer = DineInReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_200_OK)

class EventReservationCancelView(views.APIView):
    def patch(self, request, reference_number):
        logger.debug("Event Cancellation Request: %s", json.dumps(request.data))

        otp = request.data.get('otp')
        email_address = request.data.get('email_address')  # ✅ Fix field name
        reference_code = request.data.get('reference_code')

        # Validate required fields
        if not otp:
            return Response({"detail": "OTP is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not reference_code:
            return Response({"detail": "Reference code is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not email_address:
            return Response({"detail": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Fetch event reservation with proper filtering
            reservation = EventReservation.objects.select_related('customer').get(
                reference_number=reference_code, 
                customer__email_address=email_address  # ✅ Fix filter to match email
            )
        except EventReservation.DoesNotExist:
            return Response({"detail": "Event reservation not found."}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve OTP from cache and validate it
        stored_otp = cache.get(f"otp_{reference_code.lower()}")  # ✅ Use lowercase key
        if not stored_otp or otp != stored_otp:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Proceed to cancel reservation
        reservation.status = 'Cancelled'  # ✅ Ensure status field is correctly set
        reservation.save()

        # Serialize the updated reservation and return response
        serializer = EventReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_200_OK)

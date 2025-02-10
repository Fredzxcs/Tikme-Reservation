import logging
from rest_framework.response import Response
from rest_framework import status, views
from decimal import Decimal
from datetime import datetime
from django.utils.timezone import make_aware
from ..models import *
from ..serializers import *
import uuid

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

VALID_PAYMENT_METHODS = [
    'gcash', 'grab_pay', 'card', 'qrph', 'brankas_bdo', 'brankas_landbank', 'paymaya'
]

class EventReservationListCreateView(views.APIView):
    """
    Handles listing all event reservations and creating new reservations.
    """

    def get(self, request):
        reservations = EventReservation.objects.all()
        serializer = EventReservationSerializer(reservations, many=True)
        return Response(serializer.data)

    def post(self, request):
        logger.info("Received event reservation request.")

        required_fields = [
            'reservation_date', 'reservation_time', 'venue_id',
            'first_name', 'last_name', 'phone_number', 'email', 'package_id', 'payment_method'
        ]
        missing_fields = [field for field in required_fields if field not in request.data]

        if missing_fields:
            logger.warning(f"Missing fields: {missing_fields}")
            return Response(
                {"detail": f"Missing required fields: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            venue = Venue.objects.get(pk=request.data['venue_id'])
            package = Package.objects.get(pk=request.data['package_id'])

            customer_data = {
                "first_name": request.data['first_name'],
                "last_name": request.data['last_name'],
                "phone_number": request.data['phone_number'],
                "email_address": request.data['email'],
            }
            customer, created = Customer.objects.get_or_create(
                email_address=customer_data['email_address'],
                defaults=customer_data
            )

            number_of_guests = int(request.data.get('number_of_guests', 0))
            parking_slots_needed = int(request.data.get('parking_slots_needed', 0))
            payment_method = request.data.get('payment_method', 'card').lower()

            # Validate payment method
            if payment_method not in VALID_PAYMENT_METHODS:
                return Response(
                    {"detail": f"Invalid payment method: {payment_method}. Choose from {', '.join(VALID_PAYMENT_METHODS)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reservation = EventReservation.objects.create(
                customer=customer,
                venue=venue,
                package=package,
                number_of_guests=number_of_guests,
                reservation_date=request.data['reservation_date'],
                reservation_time=request.data['reservation_time'],
                parking_slots_needed=parking_slots_needed,
                special_request=request.data.get('special_request', None),
                payment_method=payment_method,
                status='Confirmed'
            )

            package_price = Decimal(package.price)
            total_cost = Decimal(number_of_guests) * package_price
            reservation.total_cost = total_cost
            reservation.save()

            reference_number = f"EVT-{uuid.uuid4().hex[:8].upper()}"
            reservation.reference_number = reference_number
            reservation.save()

            return Response(
                {
                    "detail": "Reservation created successfully.",
                    "reservation": EventReservationSerializer(reservation).data,
                },
                status=status.HTTP_201_CREATED
            )

        except Venue.DoesNotExist:
            return Response({"detail": "Invalid venue ID."}, status=status.HTTP_400_BAD_REQUEST)
        except Package.DoesNotExist:
            return Response({"detail": "Invalid package ID."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({"detail": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EventReservationDetailView(views.APIView):
    """
    Handles retrieving, updating, and deleting individual event reservations.
    """

    def get(self, request, pk):
        try:
            reservation = EventReservation.objects.get(pk=pk)
            serializer = EventReservationSerializer(reservation)
            return Response(serializer.data)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):  # Changed from put to patch
        try:
            reservation = EventReservation.objects.get(pk=pk)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Allow partial updates by setting partial=True
        serializer = EventReservationSerializer(reservation, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "detail": "Reservation updated successfully.",
                    "reservation": serializer.data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            reservation = EventReservation.objects.get(pk=pk)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        reservation.delete()
        return Response({"detail": "Deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

import logging
from rest_framework.response import Response
from rest_framework import status, views
from decimal import Decimal
from ..emails import send_dine_in_confirmation_email
from ..models import *
from ..serializers import *
import json, uuid
from datetime import datetime
from django.db.models import Sum

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

VALID_PAYMENT_METHODS = [
   'none', 'gcash', 'grab_pay', 'card', 'qrph', 'brankas_bdo', 'brankas_landbank', 'paymaya'
]

class DineInReservationListCreateView(views.APIView):
    """
    Handles listing all dine-in reservations and creating new reservations.
    """

    def get(self, request):
        try:
            logger.info("Fetching all dine-in reservations.")
            reservation = DineInReservation.objects.select_related('preferred_area').all()
            serializer = DineInReservationSerializer(reservation, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching dine-in reservations: {str(e)}")
            return Response(
                {"detail": "An error occurred while fetching reservations."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        logger.info("Received POST request for creating a dine-in reservation.")
        
        required_fields = [
            'reservation_date', 'reservation_time', 'preferred_area_id',
            'first_name', 'last_name', 'phone_number', 'email', 'number_of_guests', 'payment_method'
        ]
        missing_fields = [field for field in required_fields if field not in request.data]

        if missing_fields:
            logger.warning(f"Missing fields in request: {missing_fields}")
            return Response(
                {"detail": f"Missing required fields: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            raw_date = request.data['reservation_date']
            reservation_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
            raw_time = request.data['reservation_time']
            reservation_time = datetime.strptime(raw_time, "%H:%M:%S").time()

            preferred_area = DiningArea.objects.get(pk=request.data['preferred_area_id'])

            # ✅ Determine the session type (Morning, Afternoon, Evening)
            session_type = None
            hour = reservation_time.hour

            if 9 <= hour < 12:
                session_type = "Morning"
            elif 12 <= hour < 18:
                session_type = "Afternoon"
            elif 18 <= hour <= 21:
                session_type = "Evening"

            if not session_type:
                return Response(
                    {"detail": "Invalid reservation time. Please select a valid time slot."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Check total guests already booked in the selected session
            existing_guest_count = DineInReservation.objects.filter(
                reservation_date=reservation_date,
                reservation_time__hour__gte=(9 if session_type == "Morning" else (12 if session_type == "Afternoon" else 18)),
                reservation_time__hour__lt=(12 if session_type == "Morning" else (18 if session_type == "Afternoon" else 21))
            ).aggregate(Sum('number_of_guests'))['number_of_guests__sum'] or 0

            # ✅ Enforce 35-guest limit per session
            new_guest_count = int(request.data['number_of_guests'])
            if existing_guest_count + new_guest_count > 35:
                return Response(
                    {"detail": f"Only {35 - existing_guest_count} slots left in the {session_type} session."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Fetch preferred dining area
            try:
                preferred_area = DiningArea.objects.get(pk=request.data['preferred_area_id'])
            except DiningArea.DoesNotExist:
                logger.error(f"Dining area not found with ID: {request.data['preferred_area_id']}")
                return Response(
                    {"detail": "Invalid dining area ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate payment method
            payment_method = request.data.get('payment_method', 'none').lower()
            if payment_method not in VALID_PAYMENT_METHODS:
                logger.warning(f"Invalid payment method received: {payment_method}")
                return Response(
                    {"detail": f"Invalid payment method: {payment_method}. Choose from {', '.join(VALID_PAYMENT_METHODS)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            

            # Create or get the customer
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

            if created:
                logger.info(f"New customer created: {customer_data['email_address']}")
            else:
                logger.info(f"Customer already exists: {customer_data['email_address']}")

            # Validate payment method ONLY if an order exists
            payment_method = request.data.get('payment_method', '').lower()
            advance_order_raw = request.data.get('advance_order', '[]')

            # Parse advance order
            try:
                advance_order = json.loads(advance_order_raw) if isinstance(advance_order_raw, str) else advance_order_raw
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON format for advance_order: {advance_order_raw}")
                return Response(
                    {"detail": "Invalid format for advance_order. It must be a JSON array."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if advance_order:
                if payment_method not in VALID_PAYMENT_METHODS:
                    logger.warning(f"Invalid or missing payment method: {payment_method}")
                    return Response(
                        {"detail": f"Invalid payment method: {payment_method}. Choose from {', '.join(VALID_PAYMENT_METHODS)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # ❌ PROBLEM: This sets None, causing DB constraint errors
                # payment_method = None 

                # ✅ FIX: Set it to "none" explicitly
                payment_method = "none"

            # Validate advance order items
            total_bill = Decimal(0)
            for item in advance_order:
                try:
                    price = Decimal(str(item.get('price', 0)))
                    quantity = int(item.get('quantity', 0))
                    total_bill += price * quantity
                except (ValueError, TypeError, Decimal.InvalidOperation):
                    logger.error(f"Invalid item in advance_order: {item}")
                    return Response(
                        {"detail": "Invalid advance order item. Ensure price and quantity are numeric."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            logger.info(f"Total bill calculated: {total_bill}")

            # Generate a unique reference number
            def generate_reference_number():
                while True:
                    ref_number = f"RES-{uuid.uuid4().hex[:8].upper()}"
                    if not DineInReservation.objects.filter(reference_number=ref_number).exists():
                        return ref_number

            reference_number = generate_reference_number()
            logger.debug(f"Generated reference number: {reference_number}")

            # Create the reservation
            reservation = DineInReservation.objects.create(
                customer=customer,
                number_of_guests=int(request.data['number_of_guests']),
                reservation_date=reservation_date,
                reservation_time=reservation_time,
                parking_slots_needed=int(request.data.get('parking_slots_needed', 0)),
                preferred_area=preferred_area,
                special_request=request.data.get('special_request', None),
                advance_order=advance_order,
                payment_method=payment_method,
                status='Confirmed',
                total_bill=total_bill,
                reference_number=reference_number
            )

            # Prepare email context
            email_context = {
                "customer_name": f"{customer.first_name} {customer.last_name}",
                "reservation_date": reservation.reservation_date,
                "reservation_time": reservation.reservation_time,
                "preferred_area": preferred_area.area_name,
                "guests": reservation.number_of_guests,
                "special_request": reservation.special_request or "None",
                "parking_slots": reservation.parking_slots_needed or "N/A",
                "advance_order": advance_order,
                "total_bill": total_bill,
            }

            # Send confirmation email
            send_dine_in_confirmation_email(customer.email_address, email_context)

            product_orders = [
                {"product_id": item["product_id"], "quantity": item["quantity"]}
                for item in advance_order
            ]

            # Serialize the reservation
            serializer = DineInReservationSerializer(reservation)
            logger.info("Reservation successfully created and serialized.")

            return Response(
                {
                    "detail": "Reservation created successfully.",
                    "reservation": serializer.data,
                    "orders": product_orders,
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"An error occurred during reservation creation: {str(e)}")
            return Response({"detail": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class DineInReservationDetailView(views.APIView):
    """
    Handles retrieving, updating, and deleting individual dine-in reservations.
    """
    def get(self, request, pk):
        try:
            reservation = DineInReservation.objects.get(pk=pk)
            serializer = DineInReservationSerializer(reservation)
            return Response(serializer.data)
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):  # Changed from put to patch
        try:
            reservation = DineInReservation.objects.get(pk=pk)
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Allow partial updates
        serializer = DineInReservationSerializer(reservation, data=request.data, partial=True)
        
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
            reservation = DineInReservation.objects.get(pk=pk)
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        reservation.delete()
        return Response({"detail": "Deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
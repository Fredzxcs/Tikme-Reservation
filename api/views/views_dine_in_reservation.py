import logging
from rest_framework.response import Response
from rest_framework import status, views
from decimal import Decimal
from ..emails import send_dine_in_confirmation_email
from ..models import *
from ..serializers import *
import json
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class DineInReservationListCreateView(views.APIView):
    """
    Handles listing all dine-in reservations and creating new reservations.
    """

    def get(self, request):
        try:
            # Fetch all dine-in reservations
            logger.info("Fetching all dine-in reservations.")
            reservations = DineInReservation.objects.all()
            serializer = DineInReservationSerializer(reservations, many=True)
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
            # Normalize and validate reservation_date
            try:
                raw_date = request.data['reservation_date']
                reservation_date = datetime.fromisoformat(raw_date.replace("Z", "")).strftime("%Y-%m-%d")
            except ValueError as e:
                logger.error(f"Invalid date format for reservation_date: {raw_date}")
                return Response(
                    {"detail": "Invalid date format. Ensure it is in YYYY-MM-DD format."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Fetch preferred dining area
            logger.debug(f"Fetching preferred dining area with ID: {request.data['preferred_area_id']}")
            preferred_area = DiningArea.objects.get(pk=request.data['preferred_area_id'])

            # Create or get the customer
            logger.debug("Checking if customer exists or needs to be created.")
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

            # Parse advance order details
            advance_order_raw = request.data.get('advance_order', '[]')
            logger.debug(f"Raw advance_order data: {advance_order_raw}")
            try:
                advance_order = json.loads(advance_order_raw) if isinstance(advance_order_raw, str) else advance_order_raw
            except json.JSONDecodeError as json_error:
                logger.error(f"Invalid JSON format for advance_order: {advance_order_raw}")
                return Response(
                    {"detail": "Invalid format for advance_order. It must be a JSON array."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate advance order items
            logger.debug(f"Validating advance order items: {advance_order}")
            for item in advance_order:
                logger.debug(f"Processing item: {item}")
                try:
                    price = Decimal(str(item.get('price', '0')))  # Ensure price is a Decimal
                    quantity = int(item.get('quantity', '0'))  # Ensure quantity is an integer
                    logger.debug(f"Item price: {price}, quantity: {quantity}, type(price): {type(price)}, type(quantity): {type(quantity)}")
                except (ValueError, TypeError, Decimal.InvalidOperation) as e:
                    logger.error(f"Invalid price or quantity in item: {item} - Error: {e}")
                    return Response(
                        {"detail": "Invalid advance order item. Ensure price and quantity are numeric."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Convert parking_slots_needed to an integer
            parking_slots = int(request.data.get('parking_slots_needed', 0))
            logger.debug(f"Parsed parking slots: {parking_slots}")
            if parking_slots > 5:
                logger.warning("Parking slots exceed the maximum allowed.")
                return Response(
                    {"detail": "A maximum of 5 parking slots can be reserved."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Parse advance order details
            advance_order_raw = request.data.get('advance_order', '[]')
            logger.debug(f"Raw advance_order data: {advance_order_raw}")
            try:
                advance_order = json.loads(advance_order_raw) if isinstance(advance_order_raw, str) else advance_order_raw
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON format for advance_order: {advance_order_raw}")
                return Response(
                    {"detail": "Invalid format for advance_order. It must be a JSON array."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate advance order items
            total_bill = Decimal(0)
            for item in advance_order:
                try:
                    price = Decimal(str(item.get('price', 0)))  # Default to '0' if missing
                    quantity = int(item.get('quantity', 0))    # Default to '0' if missing
                    logger.debug(f"Processing item: price={price}, quantity={quantity}")
                    total_bill += price * quantity
                except (ValueError, TypeError, Decimal.InvalidOperation) as e:
                    logger.error(f"Invalid item in advance_order: {item}, Error: {e}")
                    return Response(
                        {"detail": "Invalid advance order item. Ensure price and quantity are numeric."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            logger.info(f"Total bill calculated: {total_bill}")

            # Create the reservation
            logger.info("Creating reservation.")
            reservation = DineInReservation.objects.create(
                customer=customer,
                number_of_guests=int(request.data['number_of_guests']),
                reservation_date=request.data['reservation_date'],
                reservation_time=request.data['reservation_time'],
                parking_slots_needed=parking_slots,
                preferred_area=preferred_area,
                special_request=request.data.get('special_request', None),
                advance_order=advance_order,
                payment_method=request.data.get('payment_method', 'Card'),
                status='Confirmed',
                total_bill=total_bill  # Explicitly set the total_bill here
            )

            # Prepare email context
            logger.debug("Preparing email context for reservation confirmation.")
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
            logger.info(f"Sending confirmation email to {customer.email_address}")
            send_dine_in_confirmation_email(customer.email_address, email_context)

            # Serialize the reservation
            serializer = DineInReservationSerializer(reservation)
            logger.info("Reservation successfully created and serialized.")

            return Response(
                {
                    "detail": "Reservation created successfully.",
                    "reservation": serializer.data,
                },
                status=status.HTTP_201_CREATED
            )
        except DiningArea.DoesNotExist:
            logger.error(f"Dining area not found with ID: {request.data['preferred_area_id']}")
            return Response({"detail": "Invalid dining area ID."}, status=status.HTTP_400_BAD_REQUEST)
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

    def put(self, request, pk):
        try:
            reservation = DineInReservation.objects.get(pk=pk)
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DineInReservationSerializer(reservation, data=request.data)
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

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
        """
        Fetch available slots for a given date and session.
        """
        date_str = request.GET.get("date")
        session = request.GET.get("session")

        if not date_str or not session:
            return Response({"detail": "Missing required parameters: date and session."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation_date = datetime.strptime(date_str, "%Y-%m-%d").date()

            session_time_ranges = {
                "Morning": (9, 13),
                "Afternoon": (13, 17),
                "Evening": (17, 21),
            }

            if session not in session_time_ranges:
                return Response(
                    {"detail": f"Invalid session type '{session}'. Choose Morning, Afternoon, or Evening."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            start_hour, end_hour = session_time_ranges[session]

            total_guests = DineInReservation.objects.filter(
                reservation_date=reservation_date,
                reservation_time__hour__gte=start_hour,
                reservation_time__hour__lt=end_hour,
            ).aggregate(Sum("number_of_guests"))["number_of_guests__sum"] or 0

            MAX_CAPACITY = 35
            available_slots = max(0, MAX_CAPACITY - total_guests)

            return Response({"available_slots": available_slots, "session": session, "date": date_str}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Handles creating a new dine-in reservation with proper session validation.
        """
        logger.info("Received POST request for dine-in reservation.")

        required_fields = [
            "reservation_date", "reservation_time", "preferred_area_id",
            "first_name", "last_name", "phone_number", "email",
            "number_of_guests", "payment_method"
        ]
        missing_fields = [field for field in required_fields if field not in request.data]

        if missing_fields:
            logger.warning(f"Missing fields in request: {missing_fields}")
            return Response(
                {"detail": f"Missing required fields: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # ✅ Parse and validate date/time
            reservation_date = datetime.strptime(request.data["reservation_date"], "%Y-%m-%d").date()
            reservation_time = datetime.strptime(request.data["reservation_time"], "%H:%M:%S").time()

            if reservation_date < datetime.today().date():
                return Response({"detail": "Reservations cannot be made for past dates."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Determine session type
            session_type = None
            session_time_ranges = {
                "Morning": (9, 13),
                "Afternoon": (13, 17),
                "Evening": (17, 21),
            }

            for session, (start_hour, end_hour) in session_time_ranges.items():
                if start_hour <= reservation_time.hour < end_hour:
                    session_type = session
                    break

            if not session_type:
                return Response({"detail": "Invalid reservation time. Please select a valid time slot."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Fetch preferred dining area
            try:
                preferred_area = DiningArea.objects.get(pk=request.data["preferred_area_id"])
            except DiningArea.DoesNotExist:
                return Response({"detail": "Invalid dining area ID."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Check available slots for the session
            existing_guest_count = DineInReservation.objects.filter(
                reservation_date=reservation_date,
                reservation_time__hour__gte=session_time_ranges[session_type][0],
                reservation_time__hour__lt=session_time_ranges[session_type][1]
            ).aggregate(Sum("number_of_guests"))["number_of_guests__sum"] or 0

            MAX_CAPACITY = 35
            new_guest_count = int(request.data["number_of_guests"])

            if existing_guest_count + new_guest_count > MAX_CAPACITY:
                return Response(
                    {"detail": f"Only {MAX_CAPACITY - existing_guest_count} slots left in the {session_type} session."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Validate payment method
            VALID_PAYMENT_METHODS = ["none", "gcash", "grab_pay", "card", "qrph", "brankas_bdo", "brankas_landbank", "paymaya"]
            payment_method = request.data.get("payment_method", "none").lower()

            if payment_method not in VALID_PAYMENT_METHODS:
                return Response(
                    {"detail": f"Invalid payment method: {payment_method}. Choose from {', '.join(VALID_PAYMENT_METHODS)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # ✅ Always create a new customer, even if the email exists
            customer = Customer.objects.create(
                first_name=request.data["first_name"],
                last_name=request.data["last_name"],
                phone_number=request.data["phone_number"],
                email_address=request.data["email"],
            )

            # ✅ Parse advance order (if any)
            advance_order = json.loads(request.data.get("advance_order", "[]"))
            total_bill = sum(Decimal(item["quantity"]) * Decimal(item["price"]) for item in advance_order) if advance_order else Decimal(0)

            # ✅ Generate unique reference number
            def generate_reference_number():
                while True:
                    ref_number = f"RES-{uuid.uuid4().hex[:8].upper()}"
                    if not DineInReservation.objects.filter(reference_number=ref_number).exists():
                        return ref_number

            reference_number = generate_reference_number()

            # ✅ Create reservation
            reservation = DineInReservation.objects.create(
                customer=customer,
                number_of_guests=new_guest_count,
                reservation_date=reservation_date,
                reservation_time=reservation_time,
                parking_slots_needed=int(request.data.get("parking_slots_needed", 0)),
                preferred_area=preferred_area,
                special_request=request.data.get("special_request", None),
                advance_order=advance_order,
                payment_method=payment_method,
                status="Confirmed",
                total_bill=total_bill,
                reference_number=reference_number
            )

            # ✅ Send confirmation email
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
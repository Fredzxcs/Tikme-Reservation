from rest_framework.response import Response
from rest_framework import status, views
from decimal import Decimal
from datetime import datetime
from django.utils.timezone import make_aware
from ..emails import send_event_confirmation_email
from ..models import *
from ..serializers import *

class EventReservationListCreateView(views.APIView):
    """
    Handles listing all event reservations and creating new reservations.
    """

    def get(self, request):
        # Fetch all reservations
        reservations = EventReservation.objects.all()
        serializer = EventReservationSerializer(reservations, many=True)
        return Response(serializer.data)

    def post(self, request):
        required_fields = [
            'reservation_date', 'reservation_time', 'venue_id',
            'first_name', 'last_name', 'phone_number', 'email', 'package_id'
        ]
        missing_fields = [
            field for field in required_fields
            if not request.data.get(field)
        ]

        if missing_fields:
            return Response(
                {"detail": f"Missing required fields: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Fetch venue and package
            venue = Venue.objects.get(pk=request.data['venue_id'])
            package = Package.objects.get(pk=request.data['package_id'])

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

            # Parse and validate fields
            try:
                number_of_guests = int(request.data.get('number_of_guests', 0))
            except ValueError:
                return Response({"detail": "Invalid number of guests."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                event_date_time = make_aware(
                    datetime.strptime(
                        f"{request.data['reservation_date']} {request.data['reservation_time']}",
                        "%Y-%m-%d %H:%M:%S"
                    )
                )
            except ValueError:
                return Response({"detail": "Invalid date or time format."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                parking_slots_needed = int(request.data.get('parking_slots_needed', 0))
            except ValueError:
                return Response({"detail": "Invalid parking slots value."}, status=status.HTTP_400_BAD_REQUEST)

            # Create the reservation
            reservation = EventReservation.objects.create(
                customer=customer,
                venue=venue,
                package=package,
                number_of_guests=number_of_guests,
                reservation_date=request.data['reservation_date'],
                reservation_time=request.data['reservation_time'],
                event_date_time=event_date_time,
                parking_slots_needed=parking_slots_needed,
                special_request=request.data.get('special_request', None),
                payment_method=request.data.get('payment_method', 'Card'),
                status='Confirmed'
            )

            # Calculate total cost
            package_price = Decimal(package.price)
            total_cost = Decimal(number_of_guests) * package_price
            reservation.total_cost = total_cost
            reservation.save()

            # Prepare email context
            email_context = {
                "customer_name": f"{customer.first_name} {customer.last_name}",
                "event_date": reservation.reservation_date,
                "event_time": reservation.reservation_time,
                "venue": venue.venue_name,
                "guests": reservation.number_of_guests,
                "package": package.package_name,
                "special_request": reservation.special_request or "None",
                "parking_slots": reservation.parking_slots_needed or "N/A",
                "total_cost": total_cost,
            }

            # Send confirmation email
            try:
                send_event_confirmation_email(customer.email_address, email_context)
            except Exception as e:
                return Response(
                    {"detail": f"Failed to send confirmation email: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Serialize the reservation
            serializer = EventReservationSerializer(reservation)
            return Response(
                {
                    "detail": "Reservation created successfully.",
                    "reservation": serializer.data,
                },
                status=status.HTTP_201_CREATED
            )

        except Venue.DoesNotExist:
            return Response({"detail": "Invalid venue ID."}, status=status.HTTP_400_BAD_REQUEST)
        except Package.DoesNotExist:
            return Response({"detail": "Invalid package ID."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
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

    def put(self, request, pk):
        try:
            reservation = EventReservation.objects.get(pk=pk)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EventReservationSerializer(reservation, data=request.data)
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

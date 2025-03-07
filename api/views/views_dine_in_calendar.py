from datetime import datetime
from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *
import logging
from django.db.models import Sum
import pytz

logger = logging.getLogger(__name__)  # Enable logging


class DineInCalendarListCreateView(views.APIView):

    def get(self, request):
        """
        Fetch all available slots for a given date and place in one request.
        """
        date_str = request.query_params.get("date")
        place = request.query_params.get("place")

        if not date_str or not place:
            return Response({"detail": "Missing required parameters: date and place."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            today = datetime.now(pytz.utc).date()

            if reservation_date < today:
                return Response({"detail": "Past dates are not allowed."}, status=status.HTTP_400_BAD_REQUEST)

            preferred_area = DiningArea.objects.filter(area_name__iexact=place.strip()).first()
            if not preferred_area:
                return Response({"detail": "Invalid dining place."}, status=status.HTTP_400_BAD_REQUEST)

            # Define session time ranges
            time_ranges = {
                "Morning": (9, 12),
                "Afternoon": (12, 18),
                "Evening": (18, 21),
            }

            available_slots = {}

            for session, (start_hour, end_hour) in time_ranges.items():
                # Fetch total guests for the session
                total_guests = DineInReservation.objects.filter(
                    reservation_date=reservation_date,
                    reservation_time__hour__gte=start_hour,
                    reservation_time__hour__lt=end_hour,
                    preferred_area=preferred_area
                ).aggregate(Sum("number_of_guests"))["number_of_guests__sum"] or 0

                max_capacity = 35
                remaining_slots = max(0, max_capacity - total_guests)

                available_slots[session] = remaining_slots  # Store slots per session

            return Response({"available_slots": available_slots}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def post(self, request):
        """
        Create a new dine-in reservation while enforcing the max reservation limit per session.
        """
        try:
            data = request.data
            serializer = DineInReservationSerializer(data=data)

            reservation_date = data.get("reservation_date")
            reservation_time = data.get("reservation_time")
            preferred_area_id = data.get("preferred_area")

            if not reservation_date or not reservation_time or not preferred_area_id:
                return Response(
                    {"detail": "Missing required fields: reservation_date, reservation_time, preferred_area."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                reservation_date = datetime.strptime(reservation_date, "%Y-%m-%d").date()
                reservation_time = datetime.strptime(reservation_time, "%H:%M:%S").time()
            except ValueError:
                return Response({"detail": "Invalid date/time format. Use YYYY-MM-DD and HH:MM:SS."}, status=status.HTTP_400_BAD_REQUEST)

            hour = reservation_time.hour
            session_type = None
            time_ranges = {
                "Morning": (9, 12),
                "Afternoon": (12, 18),
                "Evening": (18, 21),
            }

            for session, (start_hour, end_hour) in time_ranges.items():
                if start_hour <= hour < end_hour:
                    session_type = session
                    break

            if not session_type:
                return Response({"detail": "Invalid reservation time. Please select a valid time slot."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Fetch total guests already booked in this session
            existing_guests = DineInReservation.objects.filter(
                reservation_date=reservation_date,
                reservation_time__hour__gte=time_ranges[session_type][0],
                reservation_time__hour__lt=time_ranges[session_type][1]
            ).aggregate(total_guests=Sum("number_of_guests"))["total_guests"] or 0

            new_guests = int(data.get("number_of_guests", 0))
            if existing_guests + new_guests > 35:
                logger.warning("⚠ Reservation slot exceeds guest limit.")
                return Response(
                    {"detail": f"Only {35 - existing_guests} slots left in the {session_type} session."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Validate and save the reservation
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"detail": "Dine-in reservation created successfully.", "data": serializer.data},
                    status=status.HTTP_201_CREATED
                )

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"❌ Error creating dine-in reservation: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class DineInCalendarDetailView(views.APIView):
    """
    Handles retrieving, updating, and deleting a specific dine-in reservation.
    """

    def get(self, request, pk):
        """
        Fetch dine-in reservation by ID.
        """
        try:
            reservation = DineInReservation.objects.get(pk=pk)
            serializer = DineInReservationSerializer(reservation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk):
        """
        Update dine-in reservation by ID.
        """
        try:
            reservation = DineInReservation.objects.get(pk=pk)
            serializer = DineInReservationSerializer(reservation, data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"detail": "Dine-in reservation updated successfully.", "data": serializer.data},
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        """
        Delete dine-in reservation by ID.
        """
        try:
            reservation = DineInReservation.objects.get(pk=pk)
            reservation.delete()
            return Response({"detail": "Dine-in reservation deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except DineInReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

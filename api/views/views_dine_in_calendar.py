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
        Fetch available slots for a given date, place, and time, grouped by Morning, Afternoon, and Evening sessions.
        """
        date_str = request.query_params.get("date")
        place = request.query_params.get("place")
        time_str = request.query_params.get("time")
        session_param = request.query_params.get("session")  # New parameter for direct session filtering

        if not date_str:
            return Response(
                {"detail": "Missing required query parameter: date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reservation_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            today = datetime.now(pytz.utc).date()

            if reservation_date < today:
                return Response({"detail": "Past dates are not allowed."}, status=status.HTTP_400_BAD_REQUEST)

            if place:
                preferred_area = DiningArea.objects.filter(area_name__iexact=place.strip()).first()
                if not preferred_area:
                    return Response({"detail": "Invalid dining place."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Define time slots for Morning, Afternoon, and Evening
            time_ranges = {
                "Morning": (9, 12),
                "Afternoon": (12, 18),
                "Evening": (18, 21),
            }

            session_type = None

            if time_str:
                try:
                    # ✅ Accept both 12-hour (04:30 PM) and 24-hour (16:30:00) formats
                    try:
                        reservation_time = datetime.strptime(time_str, "%I:%M %p").time()  # 12-hour format
                    except ValueError:
                        reservation_time = datetime.strptime(time_str, "%H:%M:%S").time()  # 24-hour format

                    hour = reservation_time.hour

                    for session, (start_hour, end_hour) in time_ranges.items():
                        if start_hour <= hour < end_hour:
                            session_type = session
                            break

                    if not session_type:
                        return Response({"detail": "Invalid time slot selection."}, status=status.HTTP_400_BAD_REQUEST)

                except ValueError:
                    return Response({"detail": "Invalid time format. Use HH:MM AM/PM or HH:MM:SS."}, status=status.HTTP_400_BAD_REQUEST)

            elif session_param:
                session_type = session_param.capitalize()
                if session_type not in time_ranges:
                    return Response({"detail": "Invalid session type. Choose Morning, Afternoon, or Evening."}, status=status.HTTP_400_BAD_REQUEST)

            if not session_type:
                return Response({"detail": "Missing required query parameter: session or time."}, status=status.HTTP_400_BAD_REQUEST)

            session_start, session_end = time_ranges[session_type]

            # ✅ Fetch total guests for the entire session
            filters = {
                "reservation_date": reservation_date,
                "reservation_time__hour__gte": session_start,
                "reservation_time__hour__lt": session_end,
            }

            if place:
                filters["preferred_area"] = preferred_area

            total_guests = DineInReservation.objects.filter(**filters).aggregate(Sum("number_of_guests"))["number_of_guests__sum"] or 0

            max_capacity = 35  # ✅ Enforce per-session guest limit
            available_slots = max(0, max_capacity - total_guests)

            logger.info(f"📅 Date: {reservation_date}, 🏠 Place: {place}, ⏰ Session: {session_type}")
            logger.info(f"🔍 Available Slots: {available_slots} (Max: {max_capacity})")

            return Response({
                "session_type": session_type,
                "available_slots": available_slots,
                "total_reservations": total_guests
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"❌ Server error fetching reservations: {str(e)}")
            return Response({"error": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

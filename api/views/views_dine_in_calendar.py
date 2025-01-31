from datetime import datetime
from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *
import logging
from django.db.models import Count
import logging

logger = logging.getLogger(__name__)  # Enable logging

class DineInCalendarListCreateView(views.APIView):
    def get(self, request):
        date = request.query_params.get("date")
        place = request.query_params.get("place")
        time = request.query_params.get("time")

        if not date or not place or not time:
            return Response({"error": "Missing required query parameters: date, place, or time."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # ✅ Convert time properly (Fix incorrect conversion)
            reservation_time = datetime.strptime(time, "%H:%M").time()

            # ✅ Get the dining area
            preferred_area = DiningArea.objects.filter(area_name__iexact=place.strip()).first()
            if not preferred_area:
                return Response({"error": "Invalid dining place."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Fetch reservations count for the time slot
            reservations_count = DineInReservation.objects.filter(
                reservation_date=date,
                preferred_area=preferred_area,
                reservation_time=reservation_time
            ).count()

            # ✅ Log the reservations to debug
            logger.info(f"🔍 Checking slot {reservation_time} for {preferred_area.area_name} on {date}")
            logger.info(f"📌 Found {reservations_count} reservations")

            is_available = reservations_count < 5  # ✅ Prevent more than 5 reservations

            return Response({
                "available": is_available,
                "reservation_count": reservations_count  # ✅ Ensure frontend gets the correct count
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"❌ Error fetching reservations: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self, request):
        """
        Create a new dine-in reservation.
        """
        try:
            data = request.data
            serializer = DineInReservationSerializer(data=data)

            # ✅ Enforce a max of 5 reservations per slot
            existing_reservations = DineInReservation.objects.filter(
                reservation_date=data.get("reservation_date"),
                reservation_time=data.get("reservation_time"),
                preferred_area__id=data.get("preferred_area_id")
            ).count()

            if existing_reservations >= 5:
                logger.warning("Reservation slot is fully booked.")
                return Response(
                    {"detail": "This time slot is fully booked. Please choose another slot."},
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
            logger.error(f"Error creating dine-in reservation: {str(e)}")
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

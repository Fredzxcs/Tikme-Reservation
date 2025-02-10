from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *

class EventCalendarListCreateView(views.APIView):
    """
    Handles fetching all event reservations and creating new reservations.
    """

    def get(self, request):
        """
        Fetch all event reservations.
        """
        try:
            reservations = EventReservation.objects.all()
            serializer = EventReservationSerializer(reservations, many=True)
            reserved_dates = set(res.reservation_date for res in reservations)  # Extract dates
            return Response(list(reserved_dates), status=status.HTTP_200_OK)  # Send as list
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Create a new event reservation.
        """
        try:
            data = request.data
            reservation_date = data.get("reservation_date")

            # Check if the date is already fully booked
            if EventReservation.objects.filter(reservation_date=reservation_date).exists():
                return Response(
                    {"error": "This date is already fully booked."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = EventReservationSerializer(data=data)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventCalendarDetailView(views.APIView):
    """
    Handles retrieving, updating, and deleting a specific event reservation.
    """

    def get(self, request, pk):
        try:
            reservation = EventReservation.objects.get(pk=pk)
            serializer = EventReservationSerializer(reservation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk):
        try:
            reservation = EventReservation.objects.get(pk=pk)
            serializer = EventReservationSerializer(reservation, data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            reservation = EventReservation.objects.get(pk=pk)
            reservation.delete()
            return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

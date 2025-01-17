from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *


class EventCalendarListCreateView(views.APIView):
    """
    Handles fetching all reservations and creating new reservations.
    """

    def get(self, request):
        """
        Fetch all reservations.
        """
        try:
            reservations = EventReservation.objects.all()
            serializer = EventReservationSerializer(reservations, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Create a new reservation.
        """
        try:
            data = request.data
            serializer = EventReservationSerializer(data=data)

            # Validate and save the reservation
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventCalendarDetailView(views.APIView):
    """
    Handles retrieving, updating, and deleting a specific reservation.
    """

    def get(self, request, pk):
        """
        Fetch reservation by ID.
        """
        try:
            reservation = EventReservation.objects.get(pk=pk)
            serializer = EventReservationSerializer(reservation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk):
        """
        Update reservation by ID.
        """
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
        """
        Delete reservation by ID.
        """
        try:
            reservation = EventReservation.objects.get(pk=pk)
            reservation.delete()
            return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
        except EventReservation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

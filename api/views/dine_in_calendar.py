from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *


class DineInCalendarListCreateView(views.APIView):
    """
    Handles fetching all dine-in reservations and creating new dine-in reservations.
    """

    def get(self, request):
        """
        Fetch all dine-in reservations.
        """
        try:
            reservations = DineInReservation.objects.all()
            serializer = DineInReservationSerializer(reservations, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Create a new dine-in reservation.
        """
        try:
            data = request.data
            serializer = DineInReservationSerializer(data=data)

            # Validate and save the reservation
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"detail": "Dine-in reservation created successfully.", "data": serializer.data},
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
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

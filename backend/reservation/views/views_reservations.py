from rest_framework.response import Response
from rest_framework import status, views
from ..models import Reservations
from ..serializers import ReservationsSerializer

# Reservation Views
class ReservationsListCreateView(views.APIView):
    # GET: List all reservations
    def get(self, request):
        reservations = Reservations.objects.all()
        serializer = ReservationsSerializer(reservations, many=True)
        return Response(serializer.data)

    # POST: Create a new reservation
    def post(self, request):
        serializer = ReservationsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReservationsDetailView(views.APIView):
    # GET: Retrieve a specific reservation by ID
    def get(self, request, pk):
        try:
            reservation = Reservations.objects.get(pk=pk)
        except Reservations.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReservationsSerializer(reservation)
        return Response(serializer.data)

    # PUT: Update a specific reservation
    def put(self, request, pk):
        try:
            reservation = Reservations.objects.get(pk=pk)
        except Reservations.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReservationsSerializer(reservation, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE: Delete a specific reservation
    def delete(self, request, pk):
        try:
            reservation = Reservations.objects.get(pk=pk)
        except Reservations.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        reservation.delete()
        return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)

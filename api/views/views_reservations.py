from rest_framework.response import Response
from rest_framework import status, views
from django.shortcuts import get_object_or_404
from django.conf import settings
from ..models import Reservations
from ..serializers import ReservationsSerializer


# View to list all reservations or create a new reservation
class ReservationsListCreateView(views.APIView):
    def get(self, request):
        reservations = Reservations.objects.all()
        serializer = ReservationsSerializer(reservations, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReservationsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# View to retrieve, update, or delete a specific reservation by its ID
class ReservationsDetailView(views.APIView):
    """
    Retrieve, update, or delete a specific reservation by its ID.
    """
    def get(self, request, pk):
        reservation = get_object_or_404(Reservations, pk=pk)
        serializer = ReservationsSerializer(reservation)
        return Response(serializer.data)

    def put(self, request, pk):
        reservation = get_object_or_404(Reservations, pk=pk)
        serializer = ReservationsSerializer(reservation, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        reservation = get_object_or_404(Reservations, pk=pk)
        reservation.delete()
        return Response({"detail": "Reservation deleted."}, status=status.HTTP_204_NO_CONTENT)





from rest_framework.response import Response
from rest_framework import status, views
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from ..models import Reservations
from ..serializers import ReservationsSerializer
from ..forms import CancellationForm
from ..emails import send_cancellation_email


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


# View to check the status of a reservation based on ID and Email
class ReservationStatusCheckView(APIView):
    """
    Check the status of a reservation by ID and Email.
    """
    def post(self, request):
        reservation_id = request.data.get('reservation_id')
        email = request.data.get('email')

        # Validate input
        if not reservation_id or not email:
            return Response({"detail": "Reservation ID and Email are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the reservation exists and matches the email
        try:
            reservation = Reservations.objects.get(id=reservation_id, customer__email_address=email)
        except Reservations.DoesNotExist:
            return Response({"detail": "Reservation ID or Email is incorrect."}, status=status.HTTP_404_NOT_FOUND)

        # Serialize and return reservation details
        serializer = ReservationsSerializer(reservation)
        return Response(serializer.data)


# View to handle reservation cancellations
class ReservationCancelView(APIView):
    """
    Cancel a reservation based on reservation ID and email.
    """
    def post(self, request):
        reservation_id = request.data.get('reservation_id')
        email = request.data.get('email')
        comments = request.data.get('comments', '')

        # Validate input
        if not reservation_id or not email:
            return Response({"detail": "Reservation ID and Email are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the reservation exists and matches the email
        try:
            reservation = Reservations.objects.get(id=reservation_id, customer__email_address=email)
        except Reservations.DoesNotExist:
            return Response({"detail": "Reservation ID or Email is incorrect."}, status=status.HTTP_404_NOT_FOUND)

        # Update reservation status to canceled
        reservation.status = 'Canceled'
        reservation.save()

        # Send email notification to customer (for cancellation confirmation)
        self.send_cancellation_email(reservation, comments)

        return Response({"detail": "Reservation successfully canceled."}, status=status.HTTP_200_OK)


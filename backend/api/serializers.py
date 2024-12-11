from rest_framework import serializers
from .models import Customer, Venue, Package, Equipment, ServiceType, Reservations

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ['id', 'name']


class PackageSerializer(serializers.ModelSerializer):
    # Nested serializer to include Equipment details in Package
    equipment = EquipmentSerializer(read_only=True)  # Use read-only to prevent modification

    class Meta:
        model = Package
        fields = ['id', 'package_name', 'created_at', 'area_type', 'location', 'accommodation', 'equipment']


class VenueSerializer(serializers.ModelSerializer):
    # Nested Package serializer to show the associated Package details
    package = PackageSerializer(read_only=True)

    class Meta:
        model = Venue
        fields = ['id', 'venue_name', 'package', 'created_at']


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ['id', 'service_type', 'service_description', 'created_at']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'email_address', 'gender', 'created_at']


class ReservationsSerializer(serializers.ModelSerializer):
    # Include Customer and Venue details
    customer = CustomerSerializer(read_only=True)
    venue = VenueSerializer(read_only=True)
    service_type = ServiceTypeSerializer(read_only=True)

    class Meta:
        model = Reservations
        fields = ['id', 'customer', 'venue', 'service_type', 'guest_count', 'reservation_date', 'reservation_time', 'created_at', 'status']
        
        # Optional: Add 'status' field if using it for cancellation and status tracking
        # Assuming 'status' is a field in the Reservations model indicating if the reservation is 'Confirmed', 'Canceled', etc.

        
class ReservationStatusCheckSerializer(serializers.Serializer):
    reservation_id = serializers.CharField(max_length=255)
    email = serializers.EmailField()

    def validate(self, data):
        # Custom validation to check if reservation_id exists and matches the email
        reservation_id = data.get('reservation_id')
        email = data.get('email')

        # Check if reservation exists and matches the provided email
        try:
            reservation = Reservations.objects.get(id=reservation_id, customer__email_address=email)
        except Reservations.DoesNotExist:
            raise serializers.ValidationError("Reservation ID or Email is incorrect.")

        return data


class ReservationCancelSerializer(serializers.Serializer):
    reservation_id = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    comments = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, data):
        reservation_id = data.get('reservation_id')
        email = data.get('email')

        # Check if reservation exists and matches the provided email
        try:
            reservation = Reservations.objects.get(id=reservation_id, customer__email_address=email)
        except Reservations.DoesNotExist:
            raise serializers.ValidationError("Reservation ID or Email is incorrect.")

        # Optionally: Validate if the reservation is still in a state where cancellation is allowed
        if reservation.status == 'Canceled':
            raise serializers.ValidationError("This reservation has already been canceled.")
        
        return data

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
    class Meta:
        model = Reservations
        fields = ['id', 'customer', 'venue', 'service_type', 'guest_count', 'reservation_date', 'reservation_time', 'created_at']
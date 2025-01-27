from rest_framework import serializers
from .models import *


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'email_address', 'created_at']


class DiningAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiningArea
        fields = ['id', 'area_name', 'created_at']


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ['id', 'venue_name', 'created_at']


class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = ['id', 'package_name', 'price', 'created_at']


class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = '__all__'


class DineInReservationSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source='customer',
        write_only=True
    )
    preferred_area_id = serializers.PrimaryKeyRelatedField(
        queryset=DiningArea.objects.all(),
        source='preferred_area',
        write_only=True
    )
    preferred_area = serializers.StringRelatedField(read_only=True)  # Add a read-only representation of preferred_area
    advance_order = serializers.JSONField(required=False, default=[])
    total_bill = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    def validate_advance_order(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Advance order must be a list.")
        for order in value:
            if not all(key in order for key in ('product_id', 'quantity', 'price')):
                raise serializers.ValidationError("Each order must have 'product_id', 'quantity', and 'price'.")
        return value

    class Meta:
        model = DineInReservation
        fields = [
            'id', 'customer', 'customer_id', 'number_of_guests', 'reservation_date',
            'reservation_time', 'preferred_area', 'preferred_area_id',  
            'special_request', 'advance_order', 'reference_number','payment_method', 'status', 'total_bill', 'created_at'
        ]


class EventReservationSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source='customer',
        write_only=True
    )
    venue = VenueSerializer(read_only=True)
    venue_id = serializers.PrimaryKeyRelatedField(
        queryset=Venue.objects.all(),
        source='venue',
        write_only=True
    )
    package = PackageSerializer(read_only=True)
    package_id = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        source='package',
        write_only=True
    )
    total_cost = serializers.SerializerMethodField()

    def get_total_cost(self, obj):
        """
        Calculate the total cost based on the number of guests and the selected package's price.
        """
        if obj.package and obj.number_of_guests:
            return obj.number_of_guests * obj.package.price
        return 0

    class Meta:
        model = EventReservation
        fields = [
            'id', 'customer', 'customer_id', 'venue', 'venue_id', 'package',
            'package_id', 'number_of_guests', 'reservation_date', 'reservation_time',
            'event_date_time', 'parking_slots_needed', 'special_request',
            'payment_method', 'reference_number', 'status', 'created_at', 'total_cost'
        ]

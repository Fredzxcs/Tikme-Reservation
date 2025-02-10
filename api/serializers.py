from rest_framework import serializers
from .models import *
from decimal import Decimal

VALID_PAYMENT_METHODS = [
    'gcash', 'grab_pay', 'card', 'qrph', 'brankas_bdo', 'brankas_landbank', 'paymaya'
]

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
        fields = ['id', 'venue_name', 'capacity', 'created_at']


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
    preferred_area = serializers.StringRelatedField(read_only=True)  # Read-only representation
    advance_order = serializers.JSONField(required=False, default=[])
    total_bill = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    def validate_advance_order(self, value):
        """
        Validate advance_order to ensure each item has 'product_id', 'quantity', and 'price'.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Advance order must be a list.")
        for order in value:
            if not all(key in order for key in ('product_id', 'quantity', 'price')):
                raise serializers.ValidationError("Each order must have 'product_id', 'quantity', and 'price'.")
            try:
                order['quantity'] = int(order['quantity'])
                order['price'] = Decimal(str(order['price']))
                if order['quantity'] <= 0 or order['price'] <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                raise serializers.ValidationError("Invalid quantity or price in advance order.")
        return value

    def validate_payment_method(self, value):
        """
        Ensure payment_method is one of the allowed values.
        Default to 'none' if no value is provided.
        """
        if not value:  # ✅ If no value is provided, default to "none"
            return "none"

        value = value.lower()
        
        if value not in VALID_PAYMENT_METHODS:
            raise serializers.ValidationError(
                f"Invalid payment method '{value}'. Choose from: {', '.join(VALID_PAYMENT_METHODS)}."
            )
        
        return value  # ✅ Always return a valid value, never None


    def get_total_bill(self, obj):
        """
        Automatically calculate the total bill based on advance order.
        """
        if obj.advance_order:
            return sum(Decimal(order['quantity']) * Decimal(order['price']) for order in obj.advance_order)
        return Decimal(0)

    class Meta:
        model = DineInReservation
        fields = [
            'id', 'customer', 'customer_id', 'number_of_guests', 'reservation_date',
            'reservation_time', 'preferred_area', 'preferred_area_id',  
            'special_request', 'advance_order', 'reference_number', 'payment_method', 'status', 'total_bill', 'created_at'
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
        write_only=True,
        allow_null=True
    )

    total_cost = serializers.SerializerMethodField()

    def get_total_cost(self, obj):
        """
        Calculate the total cost based on the number of guests and the selected package's price.
        """
        if obj.package and obj.number_of_guests:
            return obj.number_of_guests * obj.package.price
        return Decimal(0)

    def validate_reservation_date(self, value):
        """
        Ensure only one reservation per date.
        """
        if EventReservation.objects.filter(reservation_date=value).exists():
            raise serializers.ValidationError("This date is already fully booked.")
        return value

    def validate_payment_method(self, value):
        """
        Ensure payment_method is one of the allowed values.
        """
        if value.lower() not in VALID_PAYMENT_METHODS:
            raise serializers.ValidationError(
                f"Invalid payment method '{value}'. Choose from: {', '.join(VALID_PAYMENT_METHODS)}."
            )
        return value.lower()

    class Meta:
        model = EventReservation
        fields = [
            'id', 'customer', 'customer_id', 'venue', 'venue_id', 'package', 'package_id',
            'number_of_guests', 'reservation_date', 'reservation_time', 'event_date_time',
            'parking_slots_needed', 'special_request', 'payment_method', 'reference_number',
            'status', 'created_at', 'total_cost'
        ]
from django.db import models
from django.core.exceptions import ValidationError
import uuid
from decimal import Decimal

# Customer Information
class Customer(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)
    email_address = models.EmailField(max_length=255, unique=True)  # Ensuring unique email
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# Dining Area for Dine-In Reservations
class DiningArea(models.Model):
    area_name = models.CharField(max_length=255, unique=True)  # Ensuring uniqueness
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.area_name

# Venue for Event Reservations
class Venue(models.Model):
    venue_name = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.venue_name

# Package for Event Reservations
class Package(models.Model):
    package_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.package_name

# Survey Model
class Survey(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField(default="2025-01-01")
    age = models.PositiveIntegerField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    company = models.CharField(max_length=255, null=True, blank=True)
    position = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(default="default@example.com")
    food_quality = models.PositiveIntegerField(null=True, blank=True)
    order_accuracy = models.PositiveIntegerField(null=True, blank=True)
    speed_of_service = models.PositiveIntegerField(null=True, blank=True)
    price = models.PositiveIntegerField(null=True, blank=True)
    ambiance = models.PositiveIntegerField(null=True, blank=True)
    cleanliness = models.PositiveIntegerField(null=True, blank=True)
    overall_experience = models.PositiveIntegerField(null=True, blank=True)
    recommend = models.CharField(max_length=3, choices=[('yes', 'Yes'), ('no', 'No')], null=True, blank=True)
    return_to_dine = models.CharField(max_length=3, choices=[('yes', 'Yes'), ('no', 'No')], null=True, blank=True)
    comments = models.TextField(null=True, blank=True)
    most_liked = models.TextField(null=True, blank=True)
    least_liked = models.TextField(null=True, blank=True)
    additional_comments = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Survey by {self.name} on {self.date}"

# ✅ Function for generating unique reference number
def generate_reference_number():
    return f"RES-{uuid.uuid4().hex[:8].upper()}"

# ✅ Dine-In Reservation Model
class DineInReservation(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    number_of_guests = models.PositiveIntegerField()
    reservation_date = models.DateField()
    reservation_time = models.TimeField()
    parking_slots_needed = models.PositiveIntegerField(default=0)
    preferred_area = models.ForeignKey(DiningArea, on_delete=models.SET_NULL, null=True)
    special_request = models.TextField(blank=True, null=True)

    # ✅ Use `default=list` instead of `null=True`
    advance_order = models.JSONField(default=list, blank=True) 

    # ✅ Reference number now correctly uses the function
    reference_number = models.CharField(max_length=50, unique=True, default=generate_reference_number)

    PAYMENT_METHOD_CHOICES = [
        ('none', 'None'),  # 🔥 Add this line
        ('gcash', 'GCash'),
        ('grab_pay', 'GrabPay'),
        ('card', 'Card'),
        ('qrph', 'QRPH'),
        ('brankas_bdo', 'Brankas BDO'),
        ('brankas_landbank', 'Brankas Landbank'),
        ('paymaya', 'PayMaya'),
    ]

    payment_method = models.CharField(
        max_length=50, choices=PAYMENT_METHOD_CHOICES, default='none', null=False, blank=False
    )


    total_bill = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
    ]

    status = models.CharField(
        max_length=50, choices=STATUS_CHOICES, default='Pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    # ✅ Calculate total bill from advance orders
    def calculate_total_bill(self):
        if self.advance_order:
            return sum(
                Decimal(str(item.get('quantity', 0))) * Decimal(str(item.get('price', 0)))
                for item in self.advance_order
            )
        return Decimal(0)

    # ✅ Custom save method with max reservations per slot
    def save(self, *args, **kwargs):
        # Check if max 5 reservations are reached per slot
        existing_reservations = DineInReservation.objects.filter(
            reservation_date=self.reservation_date,
            reservation_time=self.reservation_time,
            preferred_area=self.preferred_area
        ).count()

        if existing_reservations >= 5:
            raise ValidationError("This time slot is fully booked. Please select a different time.")

        # Ensure the total bill is calculated before saving
        self.total_bill = self.calculate_total_bill()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dine-In Reservation for {self.customer} on {self.reservation_date} at {self.reservation_time}"
    
# Event Reservation Model
class EventReservation(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE)
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True)
    number_of_guests = models.PositiveIntegerField()
    reservation_date = models.DateField(unique=True) 
    reservation_time = models.TimeField()
    event_date_time = models.DateTimeField()
    parking_slots_needed = models.PositiveIntegerField(default=0)
    special_request = models.TextField(null=True, blank=True)
    reference_number = models.CharField(
        max_length=50, unique=True, default=generate_reference_number
    )

    PAYMENT_METHOD_CHOICES = [
        ('none', 'None'),
        ('gcash', 'Gcash'),
        ('grab_pay', 'Grab Pay'),
        ('card', 'Card'),
        ('qrph', 'QRPH'),
        ('brankas_bdo', 'Brankas BDO'),
        ('brankas_landbank', 'Brankas Landbank'),
        ('paymaya', 'Paymaya'),
    ]

    payment_method = models.CharField(
        max_length=50,
        choices=PAYMENT_METHOD_CHOICES,
        default='none'
    )

    status = models.CharField(
        max_length=50,
        choices=[('Pending', 'Pending'), ('Confirmed', 'Confirmed'), ('Cancelled', 'Cancelled')],
        default='Pending'
    )

    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # ✅ New field added

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Automatically calculate total cost before saving."""
        if self.package:
            self.total_cost = Decimal(self.number_of_guests) * Decimal(self.package.price)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Event Reservation for {self.customer} at {self.venue} on {self.reservation_date}"
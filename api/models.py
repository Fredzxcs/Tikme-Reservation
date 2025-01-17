from django.db import models


# Customer Information
class Customer(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)
    email_address = models.EmailField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# Dining Area for Dine-In Reservations
class DiningArea(models.Model):
    area_name = models.CharField(max_length=255, unique=True)  # Name of the area (e.g., Alfresco, Air Conditioning)
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp for when the area was added

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

# Dine-In Reservation Model
class DineInReservation(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    number_of_guests = models.PositiveIntegerField()
    reservation_date = models.DateField()
    reservation_time = models.TimeField()
    parking_slots_needed = models.PositiveIntegerField(default=0)
    preferred_area = models.ForeignKey(DiningArea, on_delete=models.SET_NULL, null=True)
    special_request = models.TextField(null=True, blank=True)
    advance_order = models.JSONField(null=True, blank=True)
    payment_method = models.CharField(
        max_length=50,
        choices=[('MAYA', 'MAYA'), ('Card', 'Card'), ('Gcash', 'Gcash')],
        default='Card'
    )
    total_bill = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(
        max_length=50,
        choices=[('Pending', 'Pending'), ('Confirmed', 'Confirmed'), ('Cancelled', 'Cancelled')],
        default='Pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_total_bill(self):
        if self.advance_order:
            return sum(item['quantity'] * item['price'] for item in self.advance_order)
        return 0

    def save(self, *args, **kwargs):
        self.total_bill = self.calculate_total_bill()
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('customer', 'reservation_date', 'reservation_time')

    def __str__(self):
        return f"Dine-In Reservation for {self.customer} on {self.reservation_date} at {self.reservation_time}"
    
# Event Reservation Model
class EventReservation(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE)
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True)
    number_of_guests = models.PositiveIntegerField()
    reservation_date = models.DateField()
    reservation_time = models.TimeField()
    event_date_time = models.DateTimeField()  # Make sure this exists
    parking_slots_needed = models.PositiveIntegerField(default=0)
    special_request = models.TextField(null=True, blank=True)
    payment_method = models.CharField(
        max_length=50,
        choices=[('MAYA', 'MAYA'), ('Card', 'Card'), ('Gcash', 'Gcash')],
        default='Card'
    )
    status = models.CharField(
        max_length=50,
        choices=[('Pending', 'Pending'), ('Confirmed', 'Confirmed'), ('Cancelled', 'Cancelled')],
        default='Pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Event Reservation for {self.customer} at {self.venue}"

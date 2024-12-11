from django.db import models

class Customer(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)
    email_address = models.EmailField(max_length=255)
    gender = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Venue(models.Model):
    venue_name = models.CharField(max_length=255)
    package = models.ForeignKey('Package', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.venue_name

# Assuming you have an Equipment model that we will link to
class Equipment(models.Model):
    name = models.CharField(max_length=255)
    
    def __str__(self):  
        return self.name

class Package(models.Model):
    package_name = models.CharField(max_length=255, null=True, blank=True)  # Nullable
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # Nullable
    area_type = models.CharField(max_length=255, null=True, blank=True)  # Nullable
    location = models.CharField(max_length=255, null=True, blank=True)  # Nullable
    accommodation = models.TextField(null=True, blank=True)  # Nullable
    equipment = models.ForeignKey(
        Equipment, null=True, blank=True, on_delete=models.SET_NULL  # Nullable foreign key
    )

    def __str__(self):
        return self.package_name


class ServiceType(models.Model):
    service_type = models.CharField(max_length=100)
    service_description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.service_type

class Reservations(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE)
    service_type = models.ForeignKey(ServiceType, on_delete=models.CASCADE)
    guest_count = models.IntegerField()
    reservation_date = models.DateTimeField()
    reservation_time = models.TimeField()
    status = models.CharField(max_length=50, choices=[('Confirmed', 'Confirmed'), ('Canceled', 'Canceled')], default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    def __str__(self):
        return f"Reservation by {self.customer} for {self.venue}"


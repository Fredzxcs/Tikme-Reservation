from django.db import migrations, models
from datetime import datetime

def populate_venues(apps, schema_editor):
    Venue = apps.get_model('api', 'Venue')  # Replace 'api' with your app name
    venues = [
        {"venue_name": "Violeta", "capacity": 80},
        {"venue_name": "Sampaguita", "capacity": 70},
        {"venue_name": "Rosas", "capacity": 80},
        {"venue_name": "Rosas Extension", "capacity": 25},
        {"venue_name": "Lounge", "capacity": 20},
        {"venue_name": "Bougainvillea Balcony", "capacity": 25},
        {"venue_name": "African Talisay Trellis", "capacity": 120},
        {"venue_name": "Private Room", "capacity": 30},
        {"venue_name": "Royal Cafe", "capacity": 15},
    ]

    for venue in venues:
        Venue.objects.create(**venue)

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Replace with your actual initial migration file
    ]

    operations = [
        migrations.RunPython(populate_venues),
    ]

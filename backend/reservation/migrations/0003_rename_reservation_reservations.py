# Generated by Django 5.1.2 on 2024-11-30 08:49

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0002_equipment_package_accommodation_package_area_type_and_more'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Reservation',
            new_name='Reservations',
        ),
    ]

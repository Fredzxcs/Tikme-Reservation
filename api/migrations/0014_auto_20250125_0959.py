from django.db import migrations

def populate_reference_numbers(apps, schema_editor):
    DineInReservation = apps.get_model('api', 'DineInReservation')  # Replace 'api' with your app name
    reservations_to_update = []
    
    for reservation in DineInReservation.objects.all():
        if not reservation.reference_number:
            reservation.reference_number = f"REF-{reservation.pk:06d}"  # Generate unique reference numbers
            reservations_to_update.append(reservation)
    
    # Perform bulk update for efficiency
    DineInReservation.objects.bulk_update(reservations_to_update, ['reference_number'])

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0013_alter_dineinreservation_reference_number_and_more'),  # Update with the last migration
    ]

    operations = [
        migrations.RunPython(populate_reference_numbers),
    ]

from django.db import migrations

def populate_dining_areas(apps, schema_editor):
    DiningArea = apps.get_model('api', 'DiningArea')
    dining_areas = [
        {"area_name": "Alfresco"},
        {"area_name": "Air Conditioning"},
    ]

    for area in dining_areas:
        DiningArea.objects.get_or_create(**area)

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0009_diningarea_dineinreservation_parking_slots_needed_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_dining_areas),
    ]

from django.db import migrations

def populate_dining_areas(apps, schema_editor):
    DiningArea = apps.get_model('api', 'DiningArea')
    dining_areas = [
        {"id": 1, "area_name": "Air Conditioning"},
        {"id": 2, "area_name": "Alfresco"},
    ]

    for area in dining_areas:
        DiningArea.objects.update_or_create(id=area["id"], defaults={"area_name": area["area_name"]})

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0009_diningarea_dineinreservation_parking_slots_needed_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_dining_areas),
    ]

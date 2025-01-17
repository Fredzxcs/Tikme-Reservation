from django.db import migrations


def populate_packages(apps, schema_editor):
    Package = apps.get_model("api", "Package")
    packages = [
        {"package_name": "Silver", "price": 500},
        {"package_name": "Gold", "price": 700},
        {"package_name": "Diamond", "price": 900},
    ]

    for package in packages:
        Package.objects.create(
            package_name=package["package_name"],
            price=package["price"],
        )


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_auto_20250116_0036"),
    ]

    operations = [
        migrations.RunPython(populate_packages),
    ]

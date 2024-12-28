from django.http import JsonResponse
from rest_framework import views
from ..forms import ContactForm
from ..emails import send_contact_email

class ContactView(views.APIView):
    def post(self, request):
        # Use request.data for DRF APIView
        form = ContactForm(request.data)
        if form.is_valid():
            data = form.cleaned_data
            try:
                # Send the contact email
                send_contact_email(
                    name=data["name"],
                    customer_email=data["email"],
                    phone=data.get("phone"),
                    message=data["message"]
                )
                return JsonResponse(
                    {"success": True, "message": "Your message has been sent successfully."},
                    status=200
                )
            except Exception as e:
                return JsonResponse(
                    {"success": False, "error": f"Failed to send the message: {str(e)}"},
                    status=500
                )
        # Return form errors
        return JsonResponse(
            {"success": False, "error": form.errors},
            status=400
        )

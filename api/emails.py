from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string

def send_contact_email(name, customer_email, phone, message):
    try:
        # Render the email content
        html_content = render_to_string("email_templates/contact_email.html", {
            "name": name,
            "email": customer_email,
            "phone": phone,
            "message": message,
        })

        # Create the email
        email = EmailMessage(
            subject="New Contact Form Submission",
            body=html_content,
            from_email=settings.EMAIL_HOST_USER,  # Your system email
            to=[settings.CONTACT_EMAIL],  # Destination (admin/support email)
            reply_to=[customer_email],  # Set reply-to as the sender's email
        )
        email.content_subtype = "html"  # Send email as HTML
        email.send()

        return {"success": True, "message": "Email sent successfully."}
    except Exception as e:
        print(f"Error sending contact email: {e}")
        raise


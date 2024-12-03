from django.core.mail import EmailMessage, get_connection
from django.conf import settings
from django.template.loader import render_to_string

def send_contact_email(name, customer_email, phone, message):
    """
    Sends an HTML email from the customer to the configured host email using the first email account (EMAIL_HOST_USER_1).
    """
    try:
        # Render the email content as HTML
        html_content = render_to_string('email_templates/contact_support.html', {
            'name': name,
            'email': customer_email,  # Customer's email
            'phone': phone,
            'message': message,
        })

        # Use the first email account explicitly
        from_email = settings.EMAIL_HOST_USER_1  # Use the first email account

        # Create a custom SMTP connection for the first account
        connection = get_connection(
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER_1,
            password=settings.EMAIL_HOST_PASSWORD_1,
            use_tls=settings.EMAIL_USE_TLS,
        )

        # Create the email message
        email = EmailMessage(
            subject="New Contact Support Request",  # Email subject
            body=html_content,  # HTML email body
            from_email=from_email,  # Sender (your Gmail account)
            to=[from_email],  # Recipient (your Gmail account)
            reply_to=[customer_email],  # Customer's email for replies
            connection=connection,  # Use the explicit connection
        )
        email.content_subtype = "html"  # Ensure the email is sent as HTML
        email.send()

        return {"success": True, "message": "Email sent successfully."}

    except Exception as e:
        # Log the error and return a failure response
        print(f"Error sending contact email: {e}")
        return {"success": False, "message": f"Error sending email: {str(e)}"}

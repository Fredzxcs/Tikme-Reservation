import logging
import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, HttpResponseBadRequest
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import Employee, Token
from ..forms import SetupSecurityQuestionsForm, SetupPasswordForm
from ..serializers import SetupSecurityQuestionsSerializer, SetupPasswordSerializer

logger = logging.getLogger(__name__)

def generate_uidb64(user):
    return urlsafe_base64_encode(force_bytes(user.pk))

@api_view(['GET', 'POST'])
def setup_account(request, uidb64, token):
    """
    View to handle account setup using a JWT and user ID.
    """
    try:
        # Decode the UID and retrieve the employee
        uid = force_str(urlsafe_base64_decode(uidb64))
        employee = get_object_or_404(Employee, pk=uid)

        # Validate the token
        token_obj = Token.objects.get(token=token, user=employee)

        # Check if the token is expired
        if token_obj.expiration_time < timezone.now():
            logger.error("Token is expired.")
            return render(request, 'invalid_link.html', {
                'token_status': 'invalid',
                'message': "The link you have used is invalid or has expired. Please ensure you have copied the link correctly. If the issue persists, contact your system administrator."
            })

        # Check if the token has already been used
        if token_obj.used:
            logger.error("Token has already been used.")
            return render(request, 'invalid_link.html', {
                'token_status': 'used',
                'message': "The link you have used has already been completed or activated. If you believe this is an error, please contact your system administrator for assistance."
            })

    except (Token.DoesNotExist, ValueError, OverflowError, Employee.DoesNotExist):
        logger.error("Invalid or expired token.")
        return render(request, 'invalid_link.html', {
            'token_status': 'invalid',
            'message': "Invalid or expired token. Please check the link and try again."
        })

    # Render the security questions form
    form = SetupSecurityQuestionsForm()
    return render(request, 'setup_security_questions.html', {
        'form': form,
        'employee': employee,
        'token': token,
        'uidb64': uidb64,
    })


@api_view(['POST'])
def setup_security_questions(request):
    """
    API view for submitting the security questions form.
    """
    serializer = SetupSecurityQuestionsSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            uidb64 = generate_uidb64(user)
            token_obj = Token.generate_token(user)  # Generate a token for the user
            token = token_obj.token  # Get the generated token
            return Response({
                "message": "Security questions set up successfully.",
                "redirect_url": reverse('setup_password', kwargs={'uidb64': uidb64, 'token': token}),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error saving security questions: {e}")
            return Response({"detail": f"Error: {e}"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"detail": "Invalid data submitted.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def setup_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        employee = get_object_or_404(Employee, pk=uid)
        token_obj = Token.objects.get(token=token, user=employee)

        if token_obj.is_expired() or token_obj.used:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        security_questions = request.data.get('security_questions', [])
        security_answers = request.data.get('security_answers', [])
        new_password = request.data.get('new_password')

        if not security_questions or not security_answers:
            return Response({"detail": "Security questions and answers are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not new_password:
            return Response({"detail": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Save security questions and answers
        for question, answer in zip(json.loads(security_questions), json.loads(security_answers)):
            employee.securityquestion_set.create(question=question, answer=answer)

        # Set new password
        employee.set_password(new_password)
        employee.save()

        token_obj.mark_as_used()
        return Response({"detail": "Password and security questions updated successfully."}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error updating password and security questions: {e}")
        return Response({"detail": "An error occurred."}, status=status.HTTP_400_BAD_REQUEST)

from django.shortcuts import render
from ..models import *
from ..serializers import *

# from django.views.decorators.csrf import csrf_exempt (this is for testing)

# Authentication Rendering #
def reservation_customer_view(request):
    return render(request, 'reservation_customer.html')

def reservation_view(request):
    return render(request, 'reservation.html')
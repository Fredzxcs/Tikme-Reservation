from django import forms
from .models import Reservations

class ReservationCheckForm(forms.Form):
    reservation_id = forms.CharField(max_length=50)
    email = forms.EmailField()

class CancellationForm(forms.Form):
    reservation_id = forms.IntegerField()
    email = forms.EmailField()
    comments = forms.CharField(widget=forms.Textarea, required=False)

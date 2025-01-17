from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *

class VenueListCreateView(views.APIView):
    def get(self, request):
        venues = Venue.objects.all()
        serializer = VenueSerializer(venues, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = VenueSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VenueDetailView(views.APIView):
    def get(self, request, pk):
        try:
            venue = Venue.objects.get(pk=pk)
        except Venue.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = VenueSerializer(venue)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            venue = Venue.objects.get(pk=pk)
        except Venue.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = VenueSerializer(venue, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            venue = Venue.objects.get(pk=pk)
        except Venue.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        venue.delete()
        return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)

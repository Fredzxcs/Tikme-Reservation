from rest_framework.response import Response
from rest_framework import status, views
from ..models import ServiceType
from ..serializers import ServiceTypeSerializer

# Service Type Views
class ServiceTypeListCreateView(views.APIView):
    # GET: List all service types
    def get(self, request):
        service_types = ServiceType.objects.all()
        serializer = ServiceTypeSerializer(service_types, many=True)
        return Response(serializer.data)

    # POST: Create a new service type
    def post(self, request):
        serializer = ServiceTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ServiceTypeDetailView(views.APIView):
    # GET: Retrieve a specific service type by ID
    def get(self, request, pk):
        try:
            service_type = ServiceType.objects.get(pk=pk)
        except ServiceType.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ServiceTypeSerializer(service_type)
        return Response(serializer.data)

    # PUT: Update a specific service type
    def put(self, request, pk):
        try:
            service_type = ServiceType.objects.get(pk=pk)
        except ServiceType.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ServiceTypeSerializer(service_type, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE: Delete a specific service type
    def delete(self, request, pk):
        try:
            service_type = ServiceType.objects.get(pk=pk)
        except ServiceType.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        service_type.delete()
        return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)

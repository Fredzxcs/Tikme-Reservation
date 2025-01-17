from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *

class PackageListCreateView(views.APIView):
    def get(self, request):
        packages = Package.objects.all()
        serializer = PackageSerializer(packages, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PackageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PackageDetailView(views.APIView):
    def get(self, request, pk):
        try:
            package = Package.objects.get(pk=pk)
        except Package.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PackageSerializer(package)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            package = Package.objects.get(pk=pk)
        except Package.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PackageSerializer(package, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            package = Package.objects.get(pk=pk)
        except Package.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        package.delete()
        return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)

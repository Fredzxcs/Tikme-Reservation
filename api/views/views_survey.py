from rest_framework.response import Response
from rest_framework import status, views
from ..models import *
from ..serializers import *


class SurveyListCreateView(views.APIView):
    """
    Handles listing all surveys and creating new surveys.
    """

    def get(self, request):
        """
        Retrieve all survey records.
        """
        surveys = Survey.objects.all()
        serializer = SurveySerializer(surveys, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new survey record.
        """
        serializer = SurveySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Survey submitted successfully.", "survey": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SurveyDetailView(views.APIView):
    """
    Handles retrieving, updating, and deleting a single survey record.
    """

    def get(self, request, pk):
        """
        Retrieve a single survey record by ID.
        """
        try:
            survey = Survey.objects.get(pk=pk)
        except Survey.DoesNotExist:
            return Response({"detail": "Survey not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SurveySerializer(survey)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """
        Update a survey record by ID.
        """
        try:
            survey = Survey.objects.get(pk=pk)
        except Survey.DoesNotExist:
            return Response({"detail": "Survey not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SurveySerializer(survey, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Survey updated successfully.", "survey": serializer.data},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a survey record by ID.
        """
        try:
            survey = Survey.objects.get(pk=pk)
        except Survey.DoesNotExist:
            return Response({"detail": "Survey not found."}, status=status.HTTP_404_NOT_FOUND)

        survey.delete()
        return Response({"detail": "Survey deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

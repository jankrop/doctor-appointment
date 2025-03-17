from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import Lekarz, Pacjent, Wizyta

class LekarzSerializer(serializers.ModelSerializer):
    dates = serializers.SerializerMethodField()

    class Meta:
        model = Lekarz
        fields = '__all__'

    def get_dates(self, obj):
        return obj.wizyta_set.values_list('data_wizyty', flat=True)

class PacjentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pacjent
        fields = '__all__'

class WizytaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wizyta
        fields = '__all__'
        read_only_fields = ('pacjent', 'status')
        validators = [
            UniqueTogetherValidator(
                queryset=Wizyta.objects.all(),
                fields=('lekarz', 'data_wizyty'),
                message='Lekarz nie może mieć kilku wizyt w tym samym czasie.'
            )
        ]

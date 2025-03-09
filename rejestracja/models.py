from django.contrib.auth.models import User
from django.db import models

class Lekarz(models.Model):
    imie = models.CharField(max_length=50)
    nazwisko = models.CharField(max_length=50)
    specjalizacja = models.CharField(max_length=100)

    def __str__(self):
        return f'Lekarz: {self.imie} {self.nazwisko}'

class Pacjent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    telefon = models.CharField(max_length=12, null=True, blank=True)
    adres = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return f'Pacjent: {self.user.first_name} {self.user.last_name}'

class Wizyta(models.Model):
    pacjent = models.ForeignKey(Pacjent, on_delete=models.CASCADE)
    lekarz = models.ForeignKey(Lekarz, on_delete=models.CASCADE)
    data_wizyty = models.DateTimeField()
    status = models.SmallIntegerField(choices={0: 'zaplanowana', 1: 'odwołana', 2: 'zakończona'}, default=0)

    def __str__(self):
        return f'Wizyta: {self.pacjent} {self.lekarz} {self.data_wizyty}'
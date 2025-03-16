from django.contrib import admin

from .models import Lekarz, Pacjent, Wizyta

admin.site.register(Lekarz)
admin.site.register(Pacjent)
admin.site.register(Wizyta)
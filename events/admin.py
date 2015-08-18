from django.contrib import admin
from events.models import EventSet

# Register your models here.

class EventSetAdmin(admin.ModelAdmin):
    list_display = ('id', 'event_type', 'num_events', 'energy', 'geometry', 'desc', 'created_at')
admin.site.register(EventSet, EventSetAdmin)
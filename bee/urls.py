from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'events.views.eventsets', name='home'),
    url(r'^', include('events.urls')),

    url(r'^admin/', include(admin.site.urls)),
)

from django.conf.urls import patterns, url

from events import views

urlpatterns = patterns('',
    url(r'^$', views.eventsets, name='eventsets'),
    url(r'^set/(?P<set_id>\d+)/event/(?P<event_id>\d+)/$', views.event, name='event'),
    url(r'^set/(?P<set_id>\d+)/event/(?P<event_id>\d+)/(?P<name>[\w\-]+)/$', views.data, name='data'),
)

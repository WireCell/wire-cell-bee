from django.conf.urls import patterns, url

from events import views

urlpatterns = patterns('',
    url(r'^$', views.eventsets, name='eventsets'),
    url(r'^set/(?P<set_id>.+)/event/(?P<event_id>\d+)/$', views.event, name='event'),
    url(r'^set/(?P<set_id>.+)/event/list/$', views.event_list, name='event_list'),
    url(r'^set/(?P<set_id>.+)/event/(?P<event_id>\d+)/evd-2d/$', views.evd_2D, name='evd_2D'),
    url(r'^set/(?P<set_id>.+)/event/(?P<event_id>\d+)/(?P<name>[\w\-]+)/$', views.data, name='data'),

    url(r'^collection/(?P<collection_id>.+)/$', views.collection, name='collection'),

    url(r'^upload/$', views.upload, name='upload'),

)

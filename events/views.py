from django.shortcuts import render
from django.http import HttpResponse
from django.core import serializers

from events.models import EventSet
from bee import settings

import os, json

def eventsets(request):
    eventset_list = EventSet.objects.all().order_by('-created_at')

    if request.is_ajax():
        data = serializers.serialize("json", eventset_list)
        return HttpResponse(data)
    else:
        context = {
            'eventset_list': eventset_list,
        }
        return render(request, 'events/eventsets.html', context)

def event(request, set_id, event_id):
    eventset = EventSet.objects.get(pk=set_id)
    context = {
        'eventset': eventset,
        'event_id' : event_id,
    }

    def queryToOptions(request):
        '''only works for two nested levels'''
        options = {}
        q = request.GET
        for key, value in q.iteritems():
            try:
                value_clean = float(value)
            except ValueError:
                value_clean = value
            if value_clean == 'true':
                value_clean = True
            elif value_clean == 'false':
                value_clean = False

            if key.find('.') > 0:
                key1, key2 = key.split('.')
                options.setdefault(key1, {})
                options[key1][key2] = value_clean
            else:
                options[key] = value_clean
        return options

    options = queryToOptions(request)
    options.update({
        'nEvents' : eventset.num_events,
        'id' : int(event_id),
        'sst': eventset.recon_list()
    })
    if request.is_ajax():
        return HttpResponse(json.dumps(options))
    else:
        return render(request, 'events/event.html', context)

def data(request, set_id, event_id, name):
    '''only for ajax'''
    eventset = EventSet.objects.get(id=set_id)
    filename = settings.BASE_DIR + '/' + settings.DATA_DIR + '/' + eventset.alias + '/data/' + event_id
    filename += "/" + event_id
    if (name == 'mc'):
        filename += "-mc.json"
    elif (name == 'WireCell-charge'):
        filename += "-rec_charge_blob.json"
    elif (name == 'WireCell-simple'):
        filename += "-rec_simple.json"
    elif (name == 'WireCell-deblob'):
        filename += "-rec_charge_cell.json"
    elif (name == 'truth'):
        filename += "-truth.json"
    else:
        filename += "-" + name + ".json"
        # return HttpResponse(name + ' not recognized')

    try:
        data = open(filename).read()
        return HttpResponse(data)
    except IOError:
        return HttpResponse(filename + ' does not exist')


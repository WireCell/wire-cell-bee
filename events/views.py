from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
from django.core import serializers
from django.core.exceptions import *

from events.models import EventSet
# from events.models import UploadFile

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

def get_eventset(set_id):
    if (set_id.isdigit()):
        set_id = int(set_id)
        eventset = EventSet.objects.get(pk=set_id)
    else:
        eventset = EventSet()
        eventset.alias = set_id
    return eventset


def event_list(request, set_id):
    try:
        eventset = get_eventset(set_id)
    except ObjectDoesNotExist:
        return HttpResponse('Event set for ' + set_id + ' does not exist.')

    context = {
        'set_id': set_id,
        'event_list': [],
    }

    summary = eventset.summary()
    if summary:
        sorted_keys = summary.keys()
        sorted_keys.sort(key=int)
        for key in sorted_keys:
            context['event_list'].append(summary[key])
            context['event_list'][-1]['id'] = key

    # from pprint import pprint
    # pprint(context)

    return render(request, 'events/event_list.html', context)


def event(request, set_id, event_id):

    try:
        eventset = get_eventset(set_id)
    except ObjectDoesNotExist:
        return HttpResponse('Event set for ' + set_id + ' does not exist.')

    context = {
        'eventset': eventset,
        'set_id': set_id,
        'event_id': event_id,
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

    sst_list = eventset.recon_list(int(event_id))
    if (len(sst_list)==0):
        return HttpResponse("Sorry, no data found.")

    options = {
        'nEvents' : eventset.event_count(),
        'id' : int(event_id),
        'geom' : {},
        'hasMC' : eventset.has_MC(int(event_id)),
        'sst': sst_list
    }
    if (eventset.geom(event_id) == 'dune35t'):
        options['camera'] = {
            'depth': 800,
        }
        options['geom']['name'] = 'dune35t'
        options['geom']['angleU'] = 45
        options['geom']['angleV'] = 45
    elif (eventset.geom(event_id) == 'protodune'):
        options['camera'] = {
            'depth': 2400,
        }
        options['geom']['name'] = 'protodune'
        options['geom']['angleU'] = 35.7
        options['geom']['angleV'] = 35.7
    elif (eventset.geom(event_id) == 'dune10kt_workspace'):
        options['camera'] = {
            'depth': 3000,
        }
        options['geom']['name'] = 'dune10kt_workspace'
        options['geom']['angleU'] = 35.7
        options['geom']['angleV'] = 35.7
    options.update(queryToOptions(request))

    if request.is_ajax():
        return HttpResponse(json.dumps(options))
    else:
        return render(request, 'events/event.html', context)

def data(request, set_id, event_id, name):
    '''only for ajax'''
    eventset = get_eventset(set_id)
    # filename = settings.BASE_DIR + '/' + settings.DATA_DIR + '/' + eventset.alias + '/data/' + event_id
    filename = eventset.data_dir() + '/' + event_id + '/' + event_id
    if (name == 'mc'):
        filename += "-mc.json"
    if (name == 'op'):
        filename += "-op.json"
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


def evd_2D(request, set_id, event_id):
    # print
    d = "%smedia/%s/plots/%s/" % (settings.STATIC_URL, set_id, event_id)

    context = {
        'base_plots_url': d,
    }
    return render(request, 'events/evd_2D.html', context)
    # return HttpResponse(d)

def upload(request):
    '''file upload'''
    import uuid, subprocess
    if request.method == 'POST':
        new_file = request.FILES['file']
        # print new_file.name, new_file.size, new_file.content_type
        unique_name = str(uuid.uuid4())
        new_filename = settings.MEDIA_ROOT + unique_name + '.zip'
        # print new_filename
        with open(new_filename, 'wb+') as destination:
            for chunk in new_file.chunks():
                destination.write(chunk)

        cmd = 'unzip -l ' + new_filename + ' | head -n 5 | tail -n 2 | awk \'{print $4}\''
        # print cmd
        try:
            output = subprocess.check_output(cmd, shell=True)
            if (output.startswith('data/\ndata/')):
                print 'Good Format!'
            else:
                print 'Bad Format!', output,
                return HttpResponse('DataNotValid')
        except subprocess.CalledProcessError:
            return HttpResponse('DataNotValid')

        extract_dir = settings.MEDIA_ROOT + unique_name
        cmd = 'unzip %s -d %s && chmod -R g+w %s' % (
            new_filename, extract_dir, extract_dir)
        # cmd = 'unzip %s -d %s' % (new_filename, extract_dir)
        # print cmd
        subprocess.call(cmd, shell=True)
        return HttpResponse(unique_name)
    else:
        return HttpResponse('No Get, Please POST')

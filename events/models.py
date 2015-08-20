from django.db import models
from django.conf import settings
import convention
import os
from glob import glob

# Create your models here.

class EventSet(models.Model):
    event_type  = models.CharField(max_length=50)
    num_events  = models.IntegerField()
    energy      = models.CharField(max_length=50)
    geometry    = models.CharField(max_length=50)
    desc        = models.CharField(max_length=200, blank=True)
    alias       = models.CharField(max_length=100, blank=True)
    created_at  = models.DateTimeField('date created')

    def __unicode__(self):
        return u'%i: %s @ %s' % (self.pk, self.event_type, self.alias)

    def data_dir(self):
        d = None
        if (self.pk==None):  # temporay, not saved to database
            d = settings.MEDIA_ROOT + self.alias + '/data'
        else:
            d = "%s/%s/%s/data" % (settings.BASE_DIR, settings.DATA_DIR, self.alias)

        if os.path.exists(d):
            return d
        else:
            return None

    def event_list(self):
        d = self.data_dir()
        if d:
            return os.listdir(self.data_dir())
        else:
            return []

    def event_count(self):
        if (self.num_events>0):
            return self.num_events
        else:
            return len(self.event_list())

    def data_info(self, eventNo=0):
        results = {}
        for x in glob('%s/%i/*.json' % (self.data_dir(), eventNo)):
            f = os.path.basename(x).rstrip('.json')
            results[ f[f.find('-')+1:] ] = x
        return results

    def recon_list(self, eventNo=0):
        results = []
        info = self.data_info()
        for name in convention.SORTED_RECON_FILES:
            if (name in info):
                results.append(convention.FILENAME_ALIAS.get(name, name))
                info.pop(name, None)
        return results

    def has_MC(self):
        return 'mc' in self.data_info()


class UploadFile(models.Model):
    file = models.FileField(upload_to='raw/%Y/%m/%d')

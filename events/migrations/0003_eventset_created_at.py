# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_auto_20150727_2227'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventset',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2015, 7, 28, 22, 34, 48, 204491, tzinfo=utc), verbose_name=b'date created'),
            preserve_default=False,
        ),
    ]

# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='EventSet',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('event_type', models.CharField(max_length=50)),
                ('num_events', models.IntegerField()),
                ('energy', models.CharField(max_length=50)),
                ('geometry', models.CharField(max_length=50)),
                ('desc', models.CharField(max_length=200)),
                ('alias', models.CharField(max_length=100)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]

"""
Django settings for bee project.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.7/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

import socket
HOST_NAME = socket.gethostname()
SITE_LOCAL = SITE_BNL = False
DATA_DIR = 'nothing'
if HOST_NAME.startswith('lycastus'):
    SITE_BNL = True
    DATA_DIR = '../../public_html/examples'
    DEBUG = False
    ALLOWED_HOSTS = ['phy.bnl.gov', 'lycastus.phy.bnl.gov']
else:
    SITE_LOCAL = True
    DATA_DIR = '../wire-cell'
    DEBUG = True
    ALLOWED_HOSTS = []

from ConfigParser import RawConfigParser
conf = RawConfigParser()
conf.read(os.path.join(BASE_DIR, 'bee/bee.conf'))

SECRET_KEY = conf.get('common', 'SECRET_KEY')

TEMPLATE_DEBUG = True


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.sites',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'events',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'bee.urls'

WSGI_APPLICATION = 'bee.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.7/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'data/db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.7/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.7/howto/static-files/

STATIC_ROOT = os.path.join(BASE_DIR, '../bee-static')
if SITE_LOCAL:
    STATIC_URL = '/static/'
elif SITE_BNL:
    STATIC_URL = 'http://www.phy.bnl.gov/wire-cell/bee-static/'

# STATICFILES_DIRS = (
#     os.path.join(BASE_DIR, "static"),
#     # '/var/www/static/',
# )

# path to store uploaded filels
if SITE_LOCAL:
    MEDIA_ROOT = BASE_DIR + '/tmp/'
elif SITE_BNL:
    MEDIA_ROOT = conf.get('common', 'MEDIA_ROOT')

SITE_ID = 1
import random
import string
import os

APIKEY_PATH = '/opt/etherpad/APIKEY.txt'

# Read APIKEY for ep_weave and set as the extension settings
with open(APIKEY_PATH, 'r') as f:
    apikey = f.read()

base_prefix = os.environ.get('JUPYTERHUB_SERVICE_PREFIX', '/')

# Enables EpWeaveAPI by default
c.SidestickiesAPI.api_class = "nbtags.api.EpWeaveAPI"
c.EpWeaveAPI.url = f"{base_prefix}ep_weave/"
c.EpWeaveAPI.apikey = apikey
c.EpWeaveAPI.api_url = "http://localhost:9002/"

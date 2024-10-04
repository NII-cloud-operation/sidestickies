import random
import string

APIKEY_PATH = '/opt/etherpad/APIKEY.txt'

# Read APIKEY for ep_weave and set as the extension settings
with open(APIKEY_PATH, 'r') as f:
    apikey = f.read()

# Enables EpWeaveAPI by default
c.SidestickiesAPI.api_class = "nbtags.api.EpWeaveAPI"
c.EpWeaveAPI.url = "/ep_weave/"
c.EpWeaveAPI.apikey = apikey
c.EpWeaveAPI.api_url = "http://localhost:9002/"

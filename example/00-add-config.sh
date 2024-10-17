#!/bin/bash

set -xe

TARGET_CONFIG_DIR=/jupyter_notebook_config.d/

if [[ -f /opt/nbtags/config.py ]] ; then
  cp /opt/nbtags/config.py ${TARGET_CONFIG_DIR}
else
  if [[ ! -f /opt/etherpad/APIKEY.txt ]] ; then
    cat /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 24 > /opt/etherpad/APIKEY.txt
  fi
  cp /opt/nbtags/config.default.py ${TARGET_CONFIG_DIR}
fi

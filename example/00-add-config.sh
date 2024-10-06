#!/bin/bash

set -xe

TARGET_CONFIG=/etc/jupyter/jupyter_notebook_config.py

echo >> ${TARGET_CONFIG}
if [[ -f /opt/nbtags/config.py ]] ; then
  cat /opt/nbtags/config.py >> ${TARGET_CONFIG}
else
  if [[ ! -f /opt/etherpad/APIKEY.txt ]] ; then
    cat /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 24 > /opt/etherpad/APIKEY.txt
  fi
  cat /opt/nbtags/config.default.py >> ${TARGET_CONFIG}
fi

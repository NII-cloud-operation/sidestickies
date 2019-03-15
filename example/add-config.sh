#!/bin/bash

TARGET_CONFIG=/etc/jupyter/jupyter_notebook_config.py

if [[ -f /opt/nbtags/config.py ]] ; then
  echo >> ${TARGET_CONFIG}
  cat /opt/nbtags/config.py >> ${TARGET_CONFIG}
fi

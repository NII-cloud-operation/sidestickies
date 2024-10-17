#!/bin/bash

set -xe

# For Solr and Etherpad
supervisord -c /opt/nbtags/supervisor.conf

if [ ! -z "$WAIT_FOR_EP_WEAVE_READY" ]; then
    if [[ ! -f /opt/nbtags/config.py ]] ; then
        while ! nc -z localhost 8983; do
          sleep 0.5
        done
        while ! nc -z localhost 9002; do
          sleep 0.5
        done
        while ! curl http://localhost:8983/solr/pad/admin/ping | grep '"status":"OK"'; do
          sleep 0.5
        done
    fi
fi

export SUPERVISOR_INITIALIZED=1
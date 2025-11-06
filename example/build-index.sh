#!/bin/bash

set -xe

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

# For nbsearch
while ! nc -z localhost 9000; do
  sleep 0.5
done
while ! curl http://localhost:8983/solr/jupyter-cell/admin/ping | grep '"status":"OK"'; do
  sleep 0.5
done
jupyter nbsearch update-index --debug $CONDA_DIR/etc/jupyter/jupyter_notebook_config.py local
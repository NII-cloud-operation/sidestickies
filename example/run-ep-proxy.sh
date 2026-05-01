#!/bin/bash

set -xe

export DOLLAR='$'
export PORT=$1
export EP_WEAVE_BASE_PATH="${JUPYTERHUB_SERVICE_PREFIX:-/}ep_weave"
envsubst < /opt/nbtags/nginx-ep-proxy.conf.template > /tmp/nginx-ep-proxy-${PORT}.conf

nginx -c /tmp/nginx-ep-proxy-${PORT}.conf

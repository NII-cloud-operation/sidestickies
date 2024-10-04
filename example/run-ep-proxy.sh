#!/bin/bash

set -xe

export DOLLAR='$'
export PORT=$1
envsubst < /opt/nbtags/nginx-ep-proxy.conf.template > /tmp/nginx-ep-proxy-${PORT}.conf

nginx -c /tmp/nginx-ep-proxy-${PORT}.conf

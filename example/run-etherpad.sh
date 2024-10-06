#!/bin/bash

set -xe

export EP_WEAVE_BASE_PATH="${JUPYTERHUB_SERVICE_PREFIX:-/}ep_weave"
pnpm run prod
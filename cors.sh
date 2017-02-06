#!/bin/sh

__SELFDIR=`dirname "$0"`
cd "${__SELFDIR}" || exit 2

echo "Starting CORS Proxy (in [${PWD}]) with the following arguments: '$*'"
exec node proxy.js $@

#!/bin/sh
# Script to stop fcdb-api Docker container

CONTAINER=`docker rm -f fcdb-api`

echo "Removed fcdb-api container $CONTAINER"

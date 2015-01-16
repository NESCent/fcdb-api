#!/bin/sh
# Script to stop MySQL Docker container for DB

CONTAINER=`docker rm -f fcdb-mysql`

echo "Removed database container $CONTAINER"

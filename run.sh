#!/bin/sh
# Script to run fcdb-api Docker container, passing credentials as ENV variables

CONTAINER=`docker run --link fcdb-mysql:db -e FCDB_MYSQL_PASSWORD=$DOCKER_FCDB_MYSQL_PASSWORD -P -d --name="fcdb-api" dleehr/fcdb-api`

echo "Started container $CONTAINER"
PORT=`docker port $CONTAINER 8081`
echo "Port on docker host is $PORT"

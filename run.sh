#!/bin/sh
# Script to run fcdb-api Docker container, passing credentials as ENV variables

CONTAINER=`docker run -e FCDB_MYSQL_HOST=$DOCKER_FCDB_MYSQL_HOST -e FCDB_MYSQL_PORT=$DOCKER_FCDB_MYSQL_PORT -e FCDB_MYSQL_PASSWORD=$DOCKER_FCDB_MYSQL_PASSWORD -P -d dleehr/fcdb-api`

echo "Started container $CONTAINER"
PORT=`docker port $CONTAINER 8081`
echo "Port on docker host is $PORT"

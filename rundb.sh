#!/bin/sh
# Script to run MySQL Docker container for DB, passing credentials as ENV variables

CONTAINER=`docker run -P -d -v /var/lib/mysql:/var/lib/mysql --name="fcdb-mysql" mysql`

echo "Started database container $CONTAINER"
PORT=`docker port $CONTAINER 3306 | cut -f 2 -d :`
echo "Port on docker host is $PORT"

echo "Connect with mysql -u root -p -h `boot2docker ip` -P $PORT"

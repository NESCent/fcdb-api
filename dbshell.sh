#!/bin/sh

PORT=`docker port fcdb-mysql 3306 | cut -f 2 -d :`
mysql -u api -p -h `boot2docker ip` -P $PORT FossilCalibration

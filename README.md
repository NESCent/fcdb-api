fcdb-api
========

Read-only REST API for accessing data stored in [FossilCalibrations](https://github.com/NESCent/FossilCalibrations).

Uses Node.js, Express, and node-mysql
Includes Dockerfile for running with Docker

Getting Started
===============

1. Install [FossilCalibrations](https://github.com/NESCent/FossilCalibrations)
2. Create a read-only API database user in MySQL. Grant access and set a password:

        $ mysql -u root -p
        mysql> create user api;
        mysql> grant select, execute on FossilCalibration.* to api;
        mysql> exit
        $ mysql -u api FossilCalibration
        mysql> set password=password('secret');
        mysql> exit

3. Clone this repository

        git clone git@github.com:NESCent/fcdb-api.git
        
4. Store credentials in a protected file on the server, e.g.

        cat <<- EOF > .fcdb-api-credentials
        export FCDB_MYSQL_USER="api"
        export FCDB_MYSQL_PASSWORD="<password here>"
        export FCDB_MYSQL_PORT=3306
        export FCDB_MYSQL_HOST=127.0.0.1
        EOF

5. Install Node.js (or Docker)

Running with Node
=================

1. Install node modules

        $ cd fcdb-api
        $ npm install
        
2. Run server.js (Edit and customize port if desired)

        $ source .fcdb-api-credentials && node server.js
        Server listening on port 8081
        
`nodemon` can be used to restart node when files change

        $ nodemon server.js 
        10 Oct 11:23:57 - [nodemon] v1.2.1
        10 Oct 11:23:57 - [nodemon] to restart at any time, enter `rs`
        10 Oct 11:23:57 - [nodemon] watching: *.*
        10 Oct 11:23:57 - [nodemon] starting `node server.js`
        Server listening on port 8081


Running with Docker
===================

Running with Docker is under development.

The current setup uses container linking and assumes the MySQL database will be running in another Docker container. It can be adapted 

## Configuring environment variables

When building the Docker image, the Dockerfile replaces the config.js with a version that takes advantage of container linking - the MySQL host and port are provided by Docker, and only if the database is also running inside a docker container.

To connect to a database on a different host, set the connection parameters as above and remove the line from the Dockerfile that replaces config.js

## Building the Docker image

        $ cd fcdb-api
        $ docker build -t NESCent/fcdb-api .

## Running in Docker

### Running a database container

Use the rundb.sh script. This starts a mysql container. On first run, it will create the database and load it with data. This is outside the scope of running the container.

        $ rundb.sh

### Running an fcdb-api container

If you are using the rundb.sh script to run your database, you need only to make sure `DOCKER_FCDB_MYSQL_PASSWORD` is set in the environment.

      $ export DOCKER_FCDB_MYSQL_PASSWORD=password && ./run.sh
      
### Stopping containers

Stop the fcdb-api container with `stop.sh`
Stop the fcdb-mysql container with `stopdb.sh`
      
### Docker Notes

- By default, node will terminate if an uncaught error is found, so `forever` is used to automatically restart node.
- The host/port sent to the docker container for MySQL must be an address that is reachable from the container.
- The docker container will internally server on port 8081, but this will be exposed on the docker host as a different port. Run `docker ps` or `docker port fcdb-api 8081` to find out what the external port is
      
        $ docker ps
        CONTAINER ID        IMAGE                    PORTS                     NAMES
        68ab266238c8        NESCent/fcdb-api:latest          0.0.0.0:49172->8081/tcp   fcdb-api     

Docker
======

Below are notes about running fcdb-api with [Docker](https://www.docker.com). Docker can be used to run applications and services in containers, which contain application dependencies/runtimes. In this case, Node.js is installed inside the Docker container, and need not be on the host.

*Running with Docker is experimental and under development.*

This approach uses container linking and assumes the MySQL database will be running in another Docker container. This is probably not the case for the production installation of FCDB.

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

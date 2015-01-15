fcdb-api
========

Read-only REST API for accessing data stored in [FossilCalibrations](https://github.com/NESCent/FossilCalibrations).

Uses Node.js, Express, and node-mysql
Includes Dockerfile for running with Docker

Getting Started
===============

1. Install [FossilCalibrations](https://github.com/NESCent/FossilCalibrations)
2. Create a read-only API database user in MySQL

        $ mysql -u root -p
        mysql> create user fcdb_api;
        mysql> grant select, execute on FossilCalibration.* to api;
        mysql> exit
        $ mysql -u api FossilCalibration
        mysql> set password=password('secret');
        mysql> exit

3. Clone this repository

        git clone git@github.com:dleehr/fcdb-api.git
        
4. Copy `config/connectionParams.js.template` to `config/connectionParams.js` and populate with credentials
5. Install Node.js (or Docker)

Running with Node
=================

1. Install node modules

        $ cd fcdb-api
        $ npm install
        
2. Run server.js (Edit and customize port if desired)

        $ node server.js
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

Running with Docker is still under development.

The current dockerfile requires sharing a volume between the host and the container, to access the connection parameters. This could easily be reworked to pass these in as command-line arguments.

1. Build the docker image (Only required once)
  
        $ cd fcdb-api
        $ docker build -t dleehr/fcdb-api .

2. Export any connection parameter variables to your shell, as they will need to be passed:
3. Start the docker container, providing the ENV variables to override (see run.sh)

        $ ./run.sh

### Docker Notes

- By default, node will terminate if an uncaught error is found, so `nodemon` is used to automatically restart node.
- The host/port sent to the docker container must be an address that is reachable from the container.
- The docker container will internally server on port 8081, but this will be exposed on the docker host as a different port. Run `docker ps` or `docker port` to find out what the external port is
      
        $ docker ps
        CONTAINER ID        IMAGE                    PORTS                     NAMES
        68ab266238c8        fcdb-api:latest          0.0.0.0:49172->8081/tcp   mad_blackwell     


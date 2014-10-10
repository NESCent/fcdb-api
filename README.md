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

Running with Docker is still under development, and development instructions vary 

The current dockerfile requires sharing a volume between the host and the container, so that the application's javascript files can be edited on the host and executed by the container

1. Build the docker container (Only required once)
  
        $ cd fcdb-api
        $ docker build -t fcdb-api .

2. Run node in the docker container, sharing your fcdb-api directory as /fcdb-api

        $ docker run -it -v /Users/dan/Code/javascript/fcdb-api:/fcdb-api -P fcdb-api nodemon /fcdb-api/server.js
        9 Oct 04:15:25 - [nodemon] v1.2.1
        9 Oct 04:15:25 - [nodemon] to restart at any time, enter `rs`
        9 Oct 04:15:25 - [nodemon] watching: *.*
        9 Oct 04:15:25 - [nodemon] starting `node /fcdb-api/server.js`
        Server listening on port 8081

### Docker Notes

- Volume sharing from a Mac host is not yet enabled in Boot2docker - it's not in the boot2docker.iso that is available for download. I [built my own boot2docker.iso](https://github.com/boot2docker/boot2docker/blob/master/doc/BUILD.md) as the current boot2docker master branch does enable this.
- `nodemon`'s ability to restart node when files change doesn't seem to work across a Docker volume, but you can type `rs` into the console to force a reload
- The docker container will internally server on port 8081, but this will be exposed on the docker host as a different port. Run `docker ps` or `docker port` to find out what the external port is
      
        $ docker ps
        CONTAINER ID        IMAGE                    PORTS                     NAMES
        68ab266238c8        fcdb-api:latest          0.0.0.0:49172->8081/tcp   mad_blackwell     

- Each invocation of `docker run` will generate a new container and use a new port, so it's much easier during development to reload the existing container.

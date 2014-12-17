FROM dockerfile/nodejs
MAINTAINER Dan Leehr "dan.leehr@nescent.org"

ADD . /fcdb-api
RUN npm -g update npm
RUN npm install -g forever
WORKDIR /fcdb-api
RUN npm install
EXPOSE 8081
ENTRYPOINT ["forever", "server.js"]
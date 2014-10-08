FROM dockerfile/nodejs
MAINTAINER Dan Leehr "dan.leehr@nescent.org"

RUN npm -g update npm
RUN npm install -g forever
RUN npm install -g nodemon

EXPOSE 8081

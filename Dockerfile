FROM dockerfile/nodejs
MAINTAINER Dan Leehr "dan.leehr@nescent.org"

RUN npm -g update npm
RUN npm install -g forever

EXPOSE 8081

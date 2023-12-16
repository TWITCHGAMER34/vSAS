FROM node:18-alpine

RUN apk update && apk upgrade
RUN apk add vim
RUN npm install -g npm

WORKDIR /usr/src/app

COPY . /usr/src/app/
RUN npm install

EXPOSE 3000
CMD [ "node", "index.js" ]
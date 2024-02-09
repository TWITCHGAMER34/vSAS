FROM node:18-alpine

RUN apk update && apk upgrade
RUN apk add vim
RUN npm install -g knex

WORKDIR /usr/src/app

COPY . /usr/src/app/
RUN yarn install
RUN yarn add sharp --ignore-engines

EXPOSE 3000
CMD knex migrate:latest && yarn start
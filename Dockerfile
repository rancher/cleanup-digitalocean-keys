FROM node:8-alpine

WORKDIR /run
COPY package.json /run
COPY yarn.lock /run
COPY index.js /run

RUN yarn
ENTRYPOINT ["/usr/local/bin/node","index.js"]

FROM node:10-alpine

MAINTAINER Luciano Filho
WORKDIR /app
RUN mkdir /proj/
COPY ./ /app/
COPY ./key-gcp-lucianofilho-pubsub.json /app/
COPY ./key-gcp-lucianofilho-pubsub.json /proj/

ADD ./id_rsa /
ADD ./key-gcp-lucianofilho-pubsub.json /proj/
RUN chmod 0400 /id_rsa

RUN apk add --no-cache --virtual .temp_deps ca-certificates openssh-client linux-headers build-base git && \
    echo "StrictHostKeyChecking=no" >> /etc/ssh/ssh_config && \
    ssh-agent sh -c 'ssh-add /id_rsa; npm install' && \
    apk del .temp_deps && \
    apk add --no-cache bash

ENTRYPOINT ["node", "index.js"]

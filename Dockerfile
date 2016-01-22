FROM cloudron/base:0.8.0
MAINTAINER sogo developers <support@cloudron.io>

EXPOSE 3000

RUN mkdir -p /app/code
WORKDIR /app/code

RUN apt-get update && apt-get install -y sogo

ADD start.sh /app/code/start.sh

CMD [ "/app/code/start.sh" ]

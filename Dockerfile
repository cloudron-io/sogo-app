FROM cloudron/base:0.8.0
MAINTAINER sogo developers <support@cloudron.io>

EXPOSE 3000

RUN mkdir -p /app/code
WORKDIR /app/code

RUN apt-get update && apt-get install -y sogo

ADD sogo.conf /app/code/sogo.conf
ADD nginx.conf /app/code/nginx.conf
ADD start.sh /app/code/start.sh

RUN rm /etc/sogo/sogo.conf && ln -s /run/sogo.conf /etc/sogo/sogo.conf

CMD [ "/app/code/start.sh" ]

FROM cloudron/base:0.8.0
MAINTAINER sogo developers <support@cloudron.io>

EXPOSE 3000

RUN mkdir -p /app/code
WORKDIR /app/code

RUN apt-get update && apt-get install -y sogo memcached

ADD sogo.conf nginx.conf start.sh /app/code/

RUN rm /etc/sogo/sogo.conf && ln -s /run/sogo.conf /etc/sogo/sogo.conf
RUN rm -rf /var/log/nginx && mkdir /run/nginx && ln -s /run/nginx /var/log/nginx
RUN mkdir /run/GNUstep && ln -s /run/GNUstep /home/cloudron/GNUstep

CMD [ "/app/code/start.sh" ]

FROM cloudron/base:0.8.1
MAINTAINER SOGo developers <support@cloudron.io>

EXPOSE 3000

RUN mkdir -p /app/code
WORKDIR /app/code

RUN echo "deb http://inverse.ca/ubuntu-v3/ trusty trusty" >> "/etc/apt/sources.list"
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 19CDA6A9810273C4

RUN apt-get update && apt-get install -y sogo=3.1.3-1 memcached

ADD sogo.conf nginx.conf start.sh /app/code/

RUN rm /etc/sogo/sogo.conf && ln -s /run/sogo.conf /etc/sogo/sogo.conf
RUN rm -rf /var/log/nginx && mkdir /run/nginx && ln -s /run/nginx /var/log/nginx
RUN mkdir /run/GNUstep && ln -s /run/GNUstep /home/cloudron/GNUstep

RUN chown -R cloudron:cloudron /etc/sogo

CMD [ "/app/code/start.sh" ]

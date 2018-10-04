FROM ubuntu:18.04
MAINTAINER Gyeongwon Kim <sutt69@kaist.ac.kr>

RUN sed -i 's/archive.ubuntu.com/kr.archive.ubuntu.com/g' /etc/apt/sources.list
RUN apt-get clean && apt-get update

RUN useradd -ms /bin/bash worker

RUN apt-get install -y python3 python3-pip

#ADD ./proxy_worker /home/worker/proxy_worker
#RUN chown -R worker:worker /home/worker/proxy_worker
#RUN pip3 install -r /home/worker/proxy_worker/requirements.txt

ADD ./proxy_worker/requirements.txt /
RUN pip3 install -r /requirements.txt

USER worker
WORKDIR /home/worker/proxy_worker


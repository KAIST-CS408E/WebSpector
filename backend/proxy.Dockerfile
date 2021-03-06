FROM ubuntu:18.04
MAINTAINER Jihee Park <j31d0@kaist.ac.kr>

RUN sed -i 's/archive.ubuntu.com/kr.archive.ubuntu.com/g' /etc/apt/sources.list
RUN apt-get clean && apt-get update

RUN useradd -ms /bin/bash wproxy

RUN apt-get install -y python python-pip

USER wproxy
WORKDIR /home/wproxy/

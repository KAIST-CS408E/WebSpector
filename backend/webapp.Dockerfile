FROM ubuntu:18.04
MAINTAINER Gyeongwon Kim <sutt69@kaist.ac.kr>

RUN sed -i 's/archive.ubuntu.com/kr.archive.ubuntu.com/g' /etc/apt/sources.list
RUN apt-get clean && apt-get update
RUN apt-get install -y python python-pip mysql-server libmysqlclient-dev

ADD ./webapp/requirements.txt /requirements.txt
RUN pip install -r /requirements.txt

ADD ./webapp/ /app
WORKDIR /app

CMD ["./run.sh"]


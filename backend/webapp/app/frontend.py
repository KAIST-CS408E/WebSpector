from flask import Blueprint, render_template, url_for, redirect, flash, request, abort, send_from_directory
from . import db_session
from .models import *
from urlparse import urlparse

import socket
import time
import struct
import requests
import json

frontend = Blueprint('frontend', __name__)

pop_tracker = ["stats.g.doubleclick.net", "www.googleadservices.com", "www.google-analytics.com", "ssl.google-analytics.com", "laz-g-cdn.alicdn.com", "www.googletagmanager.com", "a.travel-assets.com"]

location_obj = ["window.navigator.language"]
device_obj = ["window.navigator.platform", "window.navigator.vendor"]
identi_obj = []
history_obj = ["window.location"]
cookie_obj = ["window.localStorage", "window.document.cookie"]
agent_obj = ["window.navigator.appVersion","window.navigator.userAgent"]

def req_inspect_url(url):
    result = []
    for i in range(1, 5):
        pay = b"\xFF" + chr(i)
        pay += struct.pack('>I', len(url))
        pay += b'{}'.format(url)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("54.180.94.105", 31333))
        s.sendall(pay)
        if s.recv(1) != b'\xff':
            continue
        result.append(ord(s.recv(1)))
        s.close()
    print result
    return result

def parse_url(it):
    return it.split("://")[1]

@frontend.route("/")
def index():
    return render_template('index.html.j2', search='http://www.example.com/')

@frontend.route('/search', methods=['GET'])
def search():
    url = str()
    if 'key' in request.args:
        url = request.args.get('key')
    return render_template('search.html.j2', url=url)

@frontend.route('/api/result', methods=["GET"])
def result():
    url = str()
    if 'url' in request.args:
        url = request.args.get('url')

    #if url[:7] != "http://" and url[:8] != "https://":
    #    return json.dumps({"error" : "Missing schema(Need http:// or https:// in front of url)}"})

    #r = requests.get(url)
    #if r.status == 404:
    #    return json.dumps({"error" : "Page Not Found"})
    #url = r.url  # grab redirected url

    req_inspect_url(url)

    lst = Inspect.query.filter(Inspect.location.like("%" + url +"%")).all()  # grab all inspect data that include 

    location_point = 0
    device_point = 0
    identi_point = 0
    history_point = 0
    cookie_point = 0
    agent_point = 0

    pop_tracking = False

    summery_lst = {}
    report_lst = []
    result = {}

    access_lst = {}
    access_top_name = []
    access_top_value = []

    for it in lst:
        if it.name == "EventListener":  # Not useful
            continue
        trace_url = ""
        try:
            trace_url = parse_url(it.trace)
        except:
            continue

        if it.name in access_lst:
            access_lst[it.name] += 1
        else:
            access_lst[it.name] = 1

        if trace_url in summery_lst:
            continue
        else:
            if urlparse("http://" + trace_url).netloc in pop_tracker:
                pop_tracking = True
            summery_lst[trace_url] = it

    for nurl, inspect in summery_lst.iteritems():
        if inspect.name in location_obj:
            if location_point < 10:
                location_point += 1
        if inspect.name in device_obj:
            if device_point < 10:
                device_point += 1
        if inspect.name in identi_obj:
            if identi_point < 10:
                identi_point += 1
        if inspect.name in history_obj:
            if history_point < 10:
                history_point += 1
        if inspect.name in cookie_obj:
            if cookie_point < 10:
                cookie_point += 1
        if inspect.name in agent_obj:
            if agent_point < 10:
                agent_point += 1

    max_val = 1
    for key, value in sorted(access_lst.iteritems(), key=lambda (k,v): (v,k))[::-1]:
        if len(access_top_name) == 5:
            break
        if len(access_top_name) == 0:
            max_val = value
        access_top_name.append(key)
        access_top_value.append(float(value) / float(max_val) * 100)

    score = 100
    score -= location_point
    score -= location_point
    score -= identi_point
    score -= history_point
    score -= cookie_point
    score -= agent_point
    if pop_tracking:
        score -= 40
    if score < 10:
        score = 10

    result["score"] = score
    result["location"] = bool(location_point)
    result["device"] = bool(device_point)
    result["identi"] = bool(identi_point)
    result["history"] = bool(history_point)
    result["cookie"] = bool(cookie_point)
    result["agent"] = bool(agent_point)
    result["radar_key"] = access_top_name
    result["radar_value"] = [access_top_value]
    return json.dumps(result)



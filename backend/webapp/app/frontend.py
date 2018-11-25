from flask import Blueprint, render_template, url_for, redirect, flash, request, abort, send_from_directory
from . import db_session
from .models import *

import requests
import json

frontend = Blueprint('frontend', __name__)

@frontend.route("/")
def index():
    return render_template('index.html.j2', search='http://www.example.com/')

@app.route('/search', methods=['GET'])
def search():
    url = str()
    if 'key' in request.args:
        url = request.args.get('key')
    return render_template('search.html.j2', url=url)

@app.route('/api/result', methods=["GET"])
def result():
    time.sleep(1)
    url = str()
    if 'url' in request.args:
        url = request.args.get('url')
    return '{"url": "' + url + '"}'



from flask import Blueprint, render_template, url_for, redirect, flash, request, abort, send_from_directory
from . import db_session
from .models import *
import json

frontend = Blueprint('frontend', __name__)

@frontend.route("/")
def index():
    return render_template("index.html")

@frontend.route("/api/inspect/<url>")
def inspect():
    return

@frontend.route("/api/result/<reqkey>")
def inspect():
    return


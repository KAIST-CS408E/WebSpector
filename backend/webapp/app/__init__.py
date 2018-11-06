from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from . import config

app = Flask(__name__, static_url_path = "/static")
app.config.update(config.configs)

engine = create_engine(app.config['DBNAME'], convert_unicode = True)
engine.raw_connection().text_factory = str
db_session = scoped_session(
    sessionmaker(autocommit = False, autoflush = False, bind = engine)
)
Base = declarative_base()
Base.query = db_session.query_property()

from .frontend import frontend
app.register_blueprint(frontend, url_prefix = config.prefix)

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from . import Base

class Inspect(Base):
    id = Column(Integer, primary_key=True)
    name = Column(String(4000), unique = False)
    property = Column(String(4000), unique = False)
    location = Column(String(4000), unique = False) 
    trace = Column(String(4000), unique = False)
    time = Column(DateTime, unique = False)

    def __init__(self, name, property, location, trace, time):
        self.name = name
        self.property = property
        self.location = location
        self.trace = trace
        self.time = time

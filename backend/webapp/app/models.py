from sqlalchemy import Column, Integer, DateTime, Text, JSON
from . import Base

class Inspect(Base):
    id = Column(Integer, primary_key=True)
    name = Column(Text, unique = False)
    property = Column(JSON, unique = False)
    location = Column(Text, unique = False) 
    trace = Column(Text, unique = False)
    time = Column(DateTime, unique = False)

    def __init__(self, name, property, location, trace, time):
        self.name = name
        self.property = property
        self.location = location
        self.trace = trace
        self.time = time

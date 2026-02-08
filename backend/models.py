from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    builds = relationship("Build", back_populates="owner")

class Build(Base):
    __tablename__ = "builds"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prompt = Column(String)
    device_name = Column(String)
    description = Column(Text)
    
    # Store the generated content as JSON/Text
    parts_json = Column(JSON)      # List of parts
    wiring_json = Column(JSON)     # Wiring instructions (list or structured)
    firmware_code = Column(Text)   # The C++/Arduino code
    enclosure_md = Column(Text)    # Enclosure description (Markdown)
    openscad_code = Column(String, nullable=True) # Keeping for legacy
    cad_script = Column(String, nullable=True) # New build123d script
    openscad_lid = Column(String, nullable=True)
    openscad_body = Column(String, nullable=True)
    stl_lid_url = Column(String, nullable=True)
    stl_body_url = Column(String, nullable=True)
    analysis = Column(String, nullable=True) # Analysis of the design
    steps_json = Column(JSON)      # Assembly steps
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="builds")

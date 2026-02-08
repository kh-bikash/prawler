from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import engine, Base
import models # Explicit import to register models
from routers import auth, builds

load_dotenv()

# Create tables (simple migration)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Prawler API", description="Modo Clone Backend API")

# CORS Setup - ALLOW ALL for debugging
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(builds.router)

@app.get("/")
def read_root():
    return {"message": "Prawler API is running"}

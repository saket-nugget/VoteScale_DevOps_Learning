import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Step 1: Load the secret variables from the .env file
load_dotenv()

# Step 2: Grab the database URL we just wrote
DATABASE_URL = os.getenv("DATABASE_URL")

# Step 3: Create the Engine (the physical pipeline to the DB)
engine = create_engine(DATABASE_URL)

# Step 4: Create a Session template (to run queries during API requests)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Step 5: Create a Base class (our future tables will inherit from this)
Base = declarative_base()

# backend/src/app.py

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database import engine, check_db_connection, Base
from src.routes.api import api_router  # Ensure this matches the exposed router in __init__.py
import logging
from concurrent.futures import ThreadPoolExecutor
import asyncio

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a thread pool executor for blocking tasks
executor = ThreadPoolExecutor(max_workers=3)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown logic for the application.
    """
    # Startup logic
    logger.info("Starting up the application...")
    loop = asyncio.get_event_loop()
    try:
        # Check database connection
        await loop.run_in_executor(executor, check_db_connection)
        # Create all tables defined in models (if they don't already exist)
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully")
    except Exception as e:
        logger.error(f"Database connection or schema initialization failed: {e}")
        raise

    yield  # Application runs here

    # Shutdown logic
    logger.info("Shutting down the application...")
    executor.shutdown()

# Initialize FastAPI app with lifespan handler
app = FastAPI(lifespan=lifespan)

# Configure CORS middleware to allow frontend communication
origins = [
    "http://localhost:3000",  # React frontend (default Vite port)
    "http://localhost:5173",  # React frontend (alternative port)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include API routes
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    # Run the FastAPI app using Uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

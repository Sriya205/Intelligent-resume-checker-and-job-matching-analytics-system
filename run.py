import sys
sys.path.append('.')
import uvicorn
import subprocess
import threading
import time
import os
import sys
import logging
from config.config import MODEL_DIR  # Import config; ensure MODEL_DIR = "src/models" in config/config.py

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(PROJECT_ROOT, MODEL_DIR, "resume_matcher.pkl")

def run_api():
    """Run the FastAPI server."""
    try:
        logger.info("Starting API server...")
        uvicorn.run("src.api.app:app", host="127.0.0.1", port=8000)
    except Exception as e:
        logger.error(f"Failed to start API: {e}")
        raise

def run_dashboard():
    """Run the Dash dashboard."""
    try:
        dashboard_path = os.path.join(PROJECT_ROOT, "dashboards", "app.py")
        if not os.path.exists(dashboard_path):
            raise FileNotFoundError(f"Dashboard app not found at {dashboard_path}")
        
        logger.info("Starting dashboard...")
        # Run in the dashboards directory without changing global cwd
        subprocess.run([sys.executable, dashboard_path], cwd=os.path.join(PROJECT_ROOT, "dashboards"), check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"Dashboard failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to start dashboard: {e}")
        raise

def main():
    """Main function to run both API and dashboard."""
    logger.info("Starting Intelligent Resume Screening System...")
    
    # Check if model exists and train if not
    if not os.path.exists(MODEL_PATH):
        logger.info("Model not found. Training model...")
        try:
            from src.ml.train_model import train_model
            train_model()
            logger.info("Model trained successfully.")
        except Exception as e:
            logger.error(f"Model training failed: {e}")
            sys.exit(1)  # Exit if training fails
    
    # Start API in a separate thread
    api_thread = threading.Thread(target=run_api, daemon=True)
    api_thread.start()
    
    logger.info("API server started on http://localhost:8000")
    logger.info("API docs available at http://localhost:8000/docs")
    
    # Wait a bit for API to start
    time.sleep(2)
    
    # Run dashboard (this will block until dashboard exits)
    run_dashboard()

if __name__ == "__main__":
    main()
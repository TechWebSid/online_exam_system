@echo off
echo Starting Face Authentication Server (Simplified Version)...
set FLASK_APP=app_simplified.py
set FLASK_ENV=development
python -m flask run --host=0.0.0.0 --port=5001 
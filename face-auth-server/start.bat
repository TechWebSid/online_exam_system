@echo off
echo Initializing face authentication server...

REM Initialize the database
python init_db.py

REM Start the Flask server
python app.py 
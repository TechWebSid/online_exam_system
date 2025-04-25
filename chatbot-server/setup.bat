@echo off
echo Installing required packages...
pip install -r requirements.txt

echo Downloading spaCy model...
python -m spacy download en_core_web_md

echo Setup completed successfully!
pause 
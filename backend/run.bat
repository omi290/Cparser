@echo off
REM Activate virtual environment and run Flask app

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask server...
python app.py

pause

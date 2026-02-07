# C Parser Visualizer - Backend Setup

## Option 1: Using Virtual Environment (Recommended)

### Create and activate virtual environment
```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
.\venv\Scripts\activate

# Activate on Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

### To deactivate
```bash
deactivate
```

## Option 2: Global Installation

```bash
# Install dependencies globally
pip install -r requirements.txt

# Run the application
python app.py
```

## Dependencies

- Flask==3.0.0
- flask-cors==4.0.0

## Running the Backend

The backend server will start on `http://localhost:5000`

```bash
python app.py
```

You should see:
```
🚀 Starting C Parser Visualizer API...
📍 Server running on http://localhost:5000
📝 Phase 1: Lexical Analysis
```

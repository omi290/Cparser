# C Parser Visualizer

A web-based educational tool that visualizes the compilation phases of C code, starting with **Phase 1: Lexical Analysis**.

![Phase](https://img.shields.io/badge/Phase-1%20Lexical%20Analysis-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![Backend](https://img.shields.io/badge/Backend-Flask-000000)

## 🎯 Project Overview

This project helps students and developers understand how C code is processed by a compiler. Currently, Phase 1 demonstrates **lexical analysis** (tokenization), breaking down C source code into meaningful tokens.

### Current Features (Phase 1)

- ✅ **Tabbed Interface**: Switch between Lexical, Semantic, and Syntax Analysis phases
- ✅ **Lexical Analysis**: Tokenize C code into keywords, identifiers, numbers, operators, and separators
- ✅ **Visual Token Table**: Display tokens with type, value, and line number
- ✅ **Colored Token Stream**: Syntax-highlighted token visualization
- ✅ **Real-time Processing**: Instant tokenization via Flask API
- ✅ **Modern UI**: Dark-themed, responsive interface with smooth animations
- 🚧 **Semantic Analysis**: Coming Soon (Phase 2)
- 🚧 **Syntax Analysis**: Coming Soon (Phase 3)

### Supported C Subset

**Keywords**: `int`, `float`, `char`, `if`, `else`, `while`, `for`, `return`

**Operators**: `+`, `-`, `*`, `/`, `=`, `==`, `<`, `>`, `<=`, `>=`

**Separators**: `;`, `{`, `}`, `(`, `)`

**Numbers**: Integers and floats (e.g., `42`, `3.14`)

**Identifiers**: Variable names following C naming rules

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **npm** or **yarn**

### Installation

#### 1. Clone or navigate to the project directory

```bash
cd c:\Users\omp72\OneDrive\Desktop\Cparser
```

#### 2. Backend Setup (with Virtual Environment - Recommended)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Alternative: Without Virtual Environment**
```bash
cd backend
pip install -r requirements.txt
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
```

### Running the Application

You need to run both the backend and frontend servers.

#### Terminal 1 - Start Backend (Flask)

```bash
cd backend
python app.py
```

The backend API will run on `http://localhost:5000`

#### Terminal 2 - Start Frontend (React)

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000` and should open automatically in your browser.

## 📖 Usage

1. **Write C Code**: Enter your C code in the left panel editor
2. **Click "Visualize Tokens"**: Process the code through the lexical analyzer
3. **Switch Tabs**: Navigate between Lexical, Semantic, and Syntax Analysis tabs
4. **View Results** (Lexical Analysis tab): 
   - **Token Table**: See all tokens with their types and line numbers
   - **Colored Stream**: View syntax-highlighted token sequence

### Example Code

```c
int main() {
    int a = 5;
    float b = 3.14;
    if (a == 5) {
        return 0;
    }
}
```

## 🏗️ Project Structure

```
c-parser-visualizer/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── lexer/
│   │   ├── __init__.py
│   │   ├── token_types.py     # Token type definitions
│   │   └── tokenizer.py       # Regex-based lexical analyzer
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── TokenTable.jsx
│   │   │   └── TokenStream.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js         # Axios API client
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🔌 API Documentation

### POST `/tokenize`

Tokenizes C source code.

**Request:**
```json
{
  "code": "int a = 5;"
}
```

**Response:**
```json
[
  {"type": "KEYWORD", "value": "int", "line": 1},
  {"type": "IDENTIFIER", "value": "a", "line": 1},
  {"type": "OPERATOR", "value": "=", "line": 1},
  {"type": "NUMBER", "value": "5", "line": 1},
  {"type": "SEPARATOR", "value": ";", "line": 1}
]
```

## 🎨 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Python Regex** - Pattern matching for tokenization

## 🗺️ Roadmap

### Phase 2: Semantic Analysis (Planned)
- Symbol table generation
- Variable tracking and scope management
- Type checking
- Duplicate declaration detection

### Phase 3: Syntax Analysis (Planned)
- Recursive descent parser
- Abstract Syntax Tree (AST) generation
- Parse tree visualization
- Syntax error reporting

## 🤝 Contributing

This is an educational project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Use it for learning

## 📝 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Built as an educational compiler visualization tool.

---

**Current Status**: Phase 1 Complete ✅

**Next**: Phase 2 - Semantic Analysis

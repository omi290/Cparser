# 🚀 C Parser Visualizer

An educational web-based tool for visualizing C code compilation phases, starting with **Phase 1: Lexical Analysis**.

[![GitHub](https://img.shields.io/badge/GitHub-omi290%2FCparser-blue)](https://github.com/omi290/Cparser)
[![Python](https://img.shields.io/badge/Python-3.8+-green)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-black)](https://flask.palletsprojects.com/)

---

## 📖 Overview

C Parser Visualizer is an interactive educational tool designed to help students and developers understand the compilation process of C programs. The application breaks down C code into its fundamental components and visualizes each compilation phase.

### Current Features (Phase 1: Lexical Analysis)

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
**Identifiers**: Variable and function names  
**Numbers**: Integers and floating-point numbers

---

## 🏗️ Architecture

```
┌─────────────────┐         HTTP/JSON         ┌──────────────────┐
│  React Frontend │ ◄─────────────────────► │  Flask Backend   │
│   (Port 3000)   │                           │   (Port 5000)    │
└─────────────────┘                           └──────────────────┘
        │                                              │
        │                                              │
   ┌────▼────┐                                   ┌────▼─────┐
   │  Vite   │                                   │ Tokenizer│
   │  Build  │                                   │  Engine  │
   └─────────┘                                   └──────────┘
```

**Tech Stack:**
- **Frontend**: React 18, Vite, Tailwind CSS, Axios
- **Backend**: Python 3.8+, Flask 3.0, Flask-CORS
- **Tokenizer**: Regex-based lexical analyzer

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/omi290/Cparser.git
cd Cparser
```

**2. Backend Setup:**
```bash
cd backend
setup.bat
```
This creates a virtual environment and installs all Python dependencies.

**3. Frontend Setup:**
```bash
cd frontend
npm install
```

### Running the Application

You need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\activate
python app.py
```
✅ Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ App runs on: http://localhost:3000

**Open your browser:** http://localhost:3000

---

## 📖 Usage

1. **Write C code** in the left panel editor
2. **Click "Visualize Tokens"** to process the code
3. **Switch tabs** to view different analysis phases:
   - **Lexical Analysis** (Active) - View tokenized output
   - **Semantic Analysis** (Coming Soon)
   - **Syntax Analysis** (Coming Soon)
4. **View results** in the token table and colored stream

### Example

**Input:**
```c
int main() {
    int a = 5;
    float b = 3.14;
    return 0;
}
```

**Output:**
- Token table showing each token's type, value, and line number
- Colored visualization with syntax highlighting

---

## 📁 Project Structure

```
Cparser/
├── backend/                 # Flask API Server
│   ├── lexer/              # Tokenizer implementation
│   │   ├── __init__.py
│   │   ├── token_types.py  # Token definitions
│   │   └── tokenizer.py    # Lexical analyzer
│   ├── app.py              # Flask application
│   ├── .env.example        # Environment template
│   ├── requirements.txt    # Python dependencies
│   ├── setup.bat           # Setup script
│   └── run.bat             # Quick start script
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   └── styles/         # CSS styles
│   ├── .env.example        # Environment template
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
│
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## 🔧 Configuration

### Backend (.env)
```env
PORT=5000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
FLASK_DEBUG=True
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🛠️ Development

### Backend Development

```bash
cd backend
.\venv\Scripts\activate
python app.py
```

**Run tests:**
```bash
python test_tokenizer.py
```

### Frontend Development

```bash
cd frontend
npm run dev
```

**Build for production:**
```bash
npm run build
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Find process using port:**
```bash
netstat -ano | findstr :3000
```

**Kill process:**
```bash
taskkill /PID <PROCESS_ID> /F
```

### Backend Connection Failed

1. Ensure backend is running on port 5000
2. Check CORS settings in `backend/.env`
3. Restart both servers

### Module Not Found

```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

**For complete troubleshooting guide, see:** [RUNNING_GUIDE.md](RUNNING_GUIDE.md)

---

## 📚 Documentation

- **[RUNNING_GUIDE.md](RUNNING_GUIDE.md)** - Complete guide to run the project
- **[backend/README.md](backend/README.md)** - Backend setup details
- **Environment Configuration** - See `.env.example` files

---

## 🗺️ Roadmap

### Phase 1: Lexical Analysis ✅ (Current)
- [x] Tokenizer implementation
- [x] Token visualization
- [x] Web interface
- [x] Tabbed UI for future phases

### Phase 2: Semantic Analysis 🚧 (Planned)
- [ ] Symbol table generation
- [ ] Variable tracking
- [ ] Scope management
- [ ] Type checking

### Phase 3: Syntax Analysis 🚧 (Planned)
- [ ] Parse tree generation
- [ ] AST visualization
- [ ] Syntax error reporting

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available for educational purposes.

---

## 👤 Author

**omi290**
- GitHub: [@omi290](https://github.com/omi290)
- Repository: [Cparser](https://github.com/omi290/Cparser)

---

## 🙏 Acknowledgments

- Built with React, Flask, and modern web technologies
- Inspired by compiler design principles
- Created as an educational tool for learning compilation phases

---

## 📧 Support

If you have any questions or run into issues:
1. Check the [RUNNING_GUIDE.md](RUNNING_GUIDE.md)
2. Open an issue on GitHub
3. Review the troubleshooting section above

---

**⭐ Star this repository if you find it helpful!**

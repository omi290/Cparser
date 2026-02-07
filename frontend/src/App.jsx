import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';

function App() {
    return (
        <div className="min-h-screen bg-bg-primary">
            <Navbar />
            <Home />
        </div>
    );
}

export default App;

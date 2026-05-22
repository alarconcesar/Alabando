import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Search from './pages/Search';
import HymnDetail from './pages/HymnDetail';
import Settings from './pages/Settings';
import Albumes from './pages/Albumes';
import Favoritos from './pages/Favoritos';
import Nuevos from './pages/Nuevos';
import History from './pages/History';
import InstallPrompt from './components/InstallPrompt';

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'naranja';
    document.documentElement.setAttribute('data-theme', theme === 'naranja' ? '' : theme);
  }, []);

  return (
    <Router>
      <div className="app-layout">
        <Navigation />
        <div className="main-content-wrapper">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/albumes" element={<Albumes />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/nuevos" element={<Nuevos />} />
            <Route path="/history" element={<History />} />
            <Route path="/himno/:id" element={<HymnDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <InstallPrompt />
      </div>
    </Router>
  );
}

export default App;

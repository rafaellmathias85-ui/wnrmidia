import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import Playlists from './pages/Playlists';
import Displays from './pages/Displays';
import Settings from './pages/Settings';
import Login from './pages/Login';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <Router basename="/wnrmidia/app">
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h1>WnrMidia</h1>
          </div>
          <ul className="sidebar-menu">
            <li><NavLink to="/" end>Dashboard</NavLink></li>
            <li><NavLink to="/videos">Vídeos</NavLink></li>
            <li><NavLink to="/playlists">Playlists</NavLink></li>
            <li><NavLink to="/displays">Displays</NavLink></li>
            <li><NavLink to="/settings">Configurações</NavLink></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/displays" element={<Displays />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

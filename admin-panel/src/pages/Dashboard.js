import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDisplays: 0,
    activeDisplays: 0,
    totalVideos: 0,
    totalPlaylists: 0
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [displays, videos, playlists] = await Promise.all([
        axios.get(`${API_URL}/displays`, { headers }),
        axios.get(`${API_URL}/videos`, { headers }),
        axios.get(`${API_URL}/playlists`, { headers })
      ]);

      const activeDisplays = displays.data.filter(d => d.status === 'online').length;

      setStats({
        totalDisplays: displays.data.length,
        activeDisplays,
        totalVideos: videos.data.length,
        totalPlaylists: playlists.data.length
      });
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/wnrmidia/app/';
        return;
      }

      toast.error('Erro ao carregar estatísticas');
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Displays Ativos</h3>
          <p className="stat-number">{stats.activeDisplays}</p>
          <p className="stat-total">de {stats.totalDisplays}</p>
        </div>

        <div className="stat-card">
          <h3>Total de Vídeos</h3>
          <p className="stat-number">{stats.totalVideos}</p>
        </div>

        <div className="stat-card">
          <h3>Playlists</h3>
          <p className="stat-number">{stats.totalPlaylists}</p>
        </div>

        <div className="stat-card">
          <h3>Taxa de Atividade</h3>
          <p className="stat-number">
            {stats.totalDisplays > 0 ? Math.round((stats.activeDisplays / stats.totalDisplays) * 100) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

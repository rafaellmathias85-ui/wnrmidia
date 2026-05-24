import React, { useState, useEffect, useRef } from 'react';
import Footer from './Footer';

const API_BASE = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const Player = () => {
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [displayId, setDisplayId] = useState(null);
  const [orientation, setOrientation] = useState('landscape');
  const [status, setStatus] = useState('Conectando ao servidor...');
  const displayIdRef = useRef(null);

  useEffect(() => {
    registerDisplay();
  }, []);

  useEffect(() => {
    if (window.electron && displayId) {
      displayIdRef.current = displayId;
      window.electron.connectSocket();

      window.electron.onPlaylistUpdated(() => fetchPlaylist(displayId));
      window.electron.onPlaylistReordered(() => fetchPlaylist(displayId));
      window.electron.onPlaylistChanged(() => fetchPlaylist(displayId));
    }
  }, [displayId]);

  const registerDisplay = async () => {
    try {
      if (window.electron) {
        setStatus('Registrando display...');
        const result = await window.electron.registerDisplay({
          displayName: 'Display 01',
          displayType: 'telao',
          hwInfo: navigator.userAgent
        });

        if (result.success) {
          setDisplayId(result.displayId);
          setOrientation(result.orientation || 'landscape');
          setStatus('Aguardando playlist...');
          fetchPlaylist(result.displayId);
        } else {
          setStatus('Erro ao registrar display: ' + result.error);
        }
      } else {
        setStatus('Ambiente Electron não detectado');
      }
    } catch (error) {
      setStatus('Erro de conexão: ' + error.message);
    }
  };

  const fetchPlaylist = async (id) => {
    try {
      const result = await window.electron.getPlaylist(id);
      if (result.success && result.playlist && result.playlist.videos && result.playlist.videos.length > 0) {
        setPlaylist(result.playlist.videos);
        setCurrentVideoIndex(0);
        setStatus('');
      } else {
        setStatus('Nenhuma playlist atribuída a este display');
      }
    } catch (error) {
      setStatus('Erro ao buscar playlist: ' + error.message);
    }
  };

  const handleVideoEnd = () => {
    if (window.electron && playlist[currentVideoIndex]) {
      window.electron.reportPlay({
        videoId: playlist[currentVideoIndex].id,
        duration: playlist[currentVideoIndex].duration_seconds
      });
    }
    setCurrentVideoIndex((prev) => (prev + 1) % playlist.length);
  };

  const handleVideoError = (e) => {
    const vid = playlist[currentVideoIndex];
    console.error('Erro ao carregar vídeo:', vid?.file_path, e.nativeEvent);
    setTimeout(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % playlist.length);
    }, 3000);
  };

  if (status) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#000', color: '#fff',
        flexDirection: 'column', gap: '20px', fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '48px' }}>📺</div>
        <h2 style={{ margin: 0 }}>WnrMidia Player</h2>
        <p style={{ color: '#aaa', margin: 0 }}>{status}</p>
      </div>
    );
  }

  const currentVideo = playlist[currentVideoIndex];
  const videoUrl = currentVideo.file_path.startsWith('http')
    ? currentVideo.file_path
    : `${API_BASE}/${currentVideo.file_path}`;

  const isPortrait = orientation === 'portrait';

  const wrapperStyle = isPortrait ? {
    position: 'fixed',
    width: '100vh',
    height: '100vw',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(90deg)',
    background: '#000',
    overflow: 'hidden',
  } : {
    width: '100vw',
    height: '100vh',
    background: '#000',
    position: 'relative',
  };

  return (
    <div style={wrapperStyle}>
      <video
        key={currentVideo.id}
        autoPlay
        muted
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        style={{
          width: '100%',
          height: isPortrait ? '100%' : 'calc(100% - 52px)',
          objectFit: 'contain',
          display: 'block',
        }}
      >
        <source src={videoUrl} type={currentVideo.mime_type || 'video/mp4'} />
      </video>

      {!isPortrait && <Footer />}
    </div>
  );
};

export default Player;

import React from 'react';
import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-page">
      <h1>Configurações</h1>
      
      <div className="settings-section">
        <h2>Informações do Sistema</h2>
        <p>Versão: 1.0.0</p>
        <p>Build: 2024</p>
      </div>

      <div className="settings-section">
        <h2>API Configuration</h2>
        <p>URL Base: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
      </div>

      <div className="settings-section">
        <h2>Suporte</h2>
        <p>Email: suporte@wnrmidia.com</p>
        <p>Documentação: https://docs.wnrmidia.com</p>
      </div>
    </div>
  );
};

export default Settings;

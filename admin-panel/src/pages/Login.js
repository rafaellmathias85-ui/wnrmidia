import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [twoFaToken, setTwoFaToken] = useState('');
  const [requiresTwoFa, setRequiresTwoFa] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setName('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (response.data.requiresTwoFa) {
        setUserId(response.data.userId);
        setRequiresTwoFa(true);
        toast.success('Autenticação de dois fatores ativada');
      } else {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Login realizado com sucesso!');
        onLoginSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { email, name, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Conta criada com sucesso!');
      onLoginSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFaVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/2fa/verify-login`, {
        userId,
        token: twoFaToken
      });
      localStorage.setItem('token', response.data.token);
      toast.success('Autenticação de dois fatores confirmada!');
      onLoginSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Token 2FA inválido');
    } finally {
      setLoading(false);
    }
  };

  if (requiresTwoFa) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>WnrMidia</h1>
          <h2>Verificação de Dois Fatores</h2>
          <form onSubmit={handleTwoFaVerify}>
            <input
              type="text"
              placeholder="Código 2FA (6 dígitos)"
              value={twoFaToken}
              onChange={(e) => setTwoFaToken(e.target.value)}
              required
              maxLength="6"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'register') {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>WnrMidia</h1>
          <h2>Criar Conta</h2>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          <p>
            Já tem conta?{' '}
            <button
              className="link-btn"
              onClick={() => { resetForm(); setMode('login'); }}
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>WnrMidia</h1>
        <h2>Painel Administrativo</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>
        <p>
          Não tem conta?{' '}
          <button
            className="link-btn"
            onClick={() => { resetForm(); setMode('register'); }}
          >
            Criar conta
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

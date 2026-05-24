import React, { useState, useEffect } from 'react';
import './Footer.css';

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌧️', 81: '🌧️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};
const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function weatherIcon(code) {
  if (code == null) return '🌡️';
  return WEATHER_ICONS[code] || WEATHER_ICONS[Math.floor(code / 10) * 10] || '🌡️';
}

const Footer = () => {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [dollar, setDollar] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        let lat = -23.5505, lon = -46.6333;
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
          );
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {}
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weather_code` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
          `&timezone=auto&forecast_days=2`;
        const data = await (await fetch(url)).json();
        setWeather(data);
      } catch {}
    };
    load();
    const t = setInterval(load, 30 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await (await fetch('https://economia.awesomeapi.com.br/last/USD-BRL')).json();
        setDollar(parseFloat(data.USDBRL.bid).toFixed(2).replace('.', ','));
      } catch {}
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const day = DAYS[now.getDay()];
  const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const curTemp = weather ? Math.round(weather.current.temperature_2m) : null;
  const curCode = weather ? weather.current.weather_code : null;
  const tmrMax = weather ? Math.round(weather.daily.temperature_2m_max[1]) : null;
  const tmrMin = weather ? Math.round(weather.daily.temperature_2m_min[1]) : null;
  const tmrCode = weather ? weather.daily.weather_code[1] : null;

  return (
    <div className="footer-bar">
      <div className="footer-left">
        <span className="footer-clock">{hh}:{mm}</span>
        <span className="footer-sep">|</span>
        <span className="footer-date">{day} {date}</span>

        {curTemp !== null && (
          <>
            <span className="footer-sep">|</span>
            <span className="footer-weather">
              {weatherIcon(curCode)} {curTemp}°C
            </span>
          </>
        )}

        {tmrMax !== null && (
          <>
            <span className="footer-sep">|</span>
            <span className="footer-tomorrow">
              AMANHÃ {weatherIcon(tmrCode)} {tmrMin}°/{tmrMax}°
            </span>
          </>
        )}

        {dollar && (
          <>
            <span className="footer-sep">|</span>
            <span className="footer-dollar">US$ R$ {dollar}</span>
          </>
        )}
      </div>

      <div className="footer-right">
        <span className="footer-brand">WNRMidia</span>
      </div>
    </div>
  );
};

export default Footer;

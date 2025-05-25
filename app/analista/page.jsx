'use client';
import { useEffect, useState } from 'react';
import jwt_decode from 'jwt-decode';
import PanelAnalista from '../components/PanelAnalista/PanelAnalista'; // ajusta la ruta según tu proyecto

export default function AnalistaPage() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Leer cookie
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const token = getCookie('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setUsuario(decoded);
      } catch (err) {
        setUsuario(null);
      }
    }
  }, []);

  if (!usuario || !usuario.nombreCompleto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="bg-gray-900 text-red-400 p-6 rounded-xl text-center">
          No se detectó el usuario. Inicia sesión correctamente.
        </div>
      </div>
    );
  }

  return (
    <PanelAnalista nombreCompleto={usuario.nombreCompleto} />
  );
}

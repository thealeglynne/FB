'use client';
import { useEffect } from 'react';
import Leader from '../leader-panel/page';

export default function GerenciaPage() {
  // 🚫 Protege contra salida con botón "atrás"
  useEffect(() => {
    const confirmBeforeExit = (event) => {
      const confirmed = window.confirm('¿Deseas cerrar sesión y salir del panel de gerencia?');
      if (confirmed) {
        document.cookie = 'token=; Max-Age=0; path=/'; // elimina el token
        window.location.href = '/login'; // redirige manualmente
      } else {
        history.pushState(null, '', location.href); // evita retroceso
      }
    };

    if (typeof window !== 'undefined') {
      history.pushState(null, '', location.href); // añade estado inicial
      window.addEventListener('popstate', confirmBeforeExit);
      return () => window.removeEventListener('popstate', confirmBeforeExit);
    }
  }, []);

  // 🔘 Maneja clic en botón "Cerrar sesión"
  const handleLogout = () => {
    const confirmLogout = window.confirm('¿Estás seguro que deseas cerrar sesión?');
    if (confirmLogout) {
      document.cookie = 'token=; Max-Age=0; path=/'; // elimina token
      window.location.href = '/login'; // redirige
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-800">Panel de Gerencia</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition"
        >
          Cerrar sesión
        </button>
      </div>

      <div>
        <Leader />
      </div>
    </div>
  );
}

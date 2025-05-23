'use client';
import { useEffect } from 'react';
import Leader from '../leader-panel/page';
import LiderPanelinfo from '../components/vistaPaneelLiderGerencia/infoDistribucionTareasPorEquipos';
import HaderOn from '../components/header/headerON';

export default function GerenciaPage() {
  // 🚫 Protección para evitar salir con botón "atrás"
  useEffect(() => {
    const confirmBeforeExit = (event) => {
      const confirmed = window.confirm('¿Deseas cerrar sesión y salir del panel de gerencia?');
      if (confirmed) {
        document.cookie = 'token=; Max-Age=0; path=/'; // elimina el token
        window.location.href = '/'; // redirige a la página principal
      } else {
        history.pushState(null, '', location.href); // evita retroceso
      }
    };

    if (typeof window !== 'undefined') {
      history.pushState(null, '', location.href); // añade estado inicial para evitar retroceso
      window.addEventListener('popstate', confirmBeforeExit);
      return () => window.removeEventListener('popstate', confirmBeforeExit);
    }
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <HaderOn />
        <Leader />
        <LiderPanelinfo />
      </div>
    </div>
  );
}

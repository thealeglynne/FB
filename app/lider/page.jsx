'use client';
import { useEffect } from 'react';
import LidFront from './lidFornt'
import HaderOn from '../components/header/headerON'
import MaainLider from '../components/mainLider/main'

export default function LiderFront() {
  // 🚫 Protege contra salida con botón "atrás"
  useEffect(() => {
    const confirmBeforeExit = (event) => {
      const confirmed = window.confirm('¿Deseas cerrar sesión y salir del panel de gerencia?');
      if (confirmed) {
        document.cookie = 'token=; Max-Age=0; path=/'; // elimina el token
        window.location.href = '/'; // redirige manualmente
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

  

  return (
    <div className="p-8 space-y-6">
      

      <div>
        <HaderOn />
        <MaainLider />
       <LidFront />
      </div>
    </div>
  );
}
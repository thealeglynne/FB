'use client';

import { useEffect } from 'react';
import Header from '../app/components/header/header';
import Main from '../app/components/mainHome/Main';

export default function Home() {
  useEffect(() => {
    // ⛔ Bloquea navegación hacia atrás
    if (typeof window !== 'undefined') {
      history.pushState(null, '', location.href);

      const handlePopState = () => {
        history.pushState(null, '', location.href);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  return (
    <div className="">
      <Header />
      <Main />
    </div>
  );
}

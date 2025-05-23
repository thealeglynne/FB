'use client';

import { useEffect, useState } from 'react';

export default function Main() {
  // Texto para animar
  const title = "FlowTracker SEALAB";
  const paragraph = `Bienvenido a SEALAB, tu plataforma avanzada gestión paso a paso en la creacion de contenidos.
Optimiza cada etapa, mejora la colaboración y garantiza la calidad en cada entrega de tu fábrica de contenidos.`;

  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedParagraph, setDisplayedParagraph] = useState('');

  useEffect(() => {
    let titleIndex = 0;
    let paraIndex = 0;

    // Animar título
    const titleInterval = setInterval(() => {
      setDisplayedTitle(title.slice(0, titleIndex + 1));
      titleIndex++;
      if (titleIndex === title.length) clearInterval(titleInterval);
    }, 80);

    // Animar párrafo después que termine el título
    const paraTimeout = setTimeout(() => {
      const paraInterval = setInterval(() => {
        setDisplayedParagraph(paragraph.slice(0, paraIndex + 1));
        paraIndex++;
        if (paraIndex === paragraph.length) clearInterval(paraInterval);
      }, 30);
    }, title.length * 80 + 500);

    return () => {
      clearInterval(titleInterval);
      clearTimeout(paraTimeout);
    };
  }, []);

  return (
    <main
      className="relative w-full min-h-[80vh] flex flex-col md:flex-row items-center justify-center px-6 py-12 gap-8 text-white"
      style={{
        backgroundImage: "url('https://i.pinimg.com/originals/47/6b/6c/476b6cad083d66ff7c9ef2bff1d892a8.gif')",
        backgroundSize: '60%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay oscuro para mejor contraste */}
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      {/* Contenedor de texto centrado y responsivo */}
      <div className="relative z-10 w-full md:w-1/2 flex flex-col items-center text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold whitespace-pre-wrap">{displayedTitle}</h2>
        <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap max-w-xl">{displayedParagraph}</p>
      </div>

      {/* Contenedor vacío para mantener estructura en desktop */}
      <div className="relative z-10 md:w-1/2"></div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function MainG() {
  const title = "FlowGIF SEALAB";
  const paragraph = `Este panel de liderazgo te permite supervisar y coordinar en tiempo real la distribución y el avance de tareas asignadas a tu equipo GIF. Facilita la toma de decisiones, optimiza el uso de los recursos y garantiza el cumplimiento eficiente de los objetivos dentro de la fábrica de contenidos. Como líder GIF, tendrás una visión clara y actualizada del desempeño de los analistas de tu grupo, lo que te permitirá gestionar prioridades, identificar cuellos de botella y asegurar la calidad y el progreso de cada proyecto..`;

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
      className="relative w-full min-h-115 flex flex-col items-center justify-center px-6 py-12 gap-8 text-white"
      style={{
        backgroundImage: "url('https://i.pinimg.com/originals/1a/b4/54/1ab4540492dd84656133461294b0cfe0.gif')",
        backgroundSize: '100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <div className="relative z-10 w-full flex flex-col items-center text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold whitespace-pre-wrap w-full">{displayedTitle}</h2>
        <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap w-full">{displayedParagraph}</p>
      </div>
    </main>
  );
}

'use client';

import Image from 'next/image';
import './main.css'; // para estilos opcionales extra

export default function Main() {
  return (
    <main className="main-section bg-black text-white w-full flex flex-col md:flex-row items-center justify-between px-6 py-12 gap-8">
      
      {/* Texto a la izquierda */}
      <div className="text-left md:w-1/2 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Bienvenido a Nuestra Plataforma</h2>
        <p className="text-gray-300 text-base leading-relaxed">
          Descubre una experiencia única diseñada para ti.<br />
          Te ofrecemos innovación, confianza y un diseño centrado en el usuario.<br />
          Nuestro enfoque se basa en la simplicidad y el rendimiento.<br />
          Explora todo lo que tenemos preparado para ti hoy mismo.
        </p>
      </div>

      {/* Imagen a la derecha */}
      <div className="md:w-1/2 flex justify-center">
        <Image
          src="https://i.pinimg.com/736x/62/ad/ad/62adadfa650cc093c9309e38dc29f5d8.jpg" // ⚠️ Cambia esta ruta por tu imagen en /public/img/
          alt="Imagen ilustrativa"
          width={500}
          height={400}
          className="rounded-2xl shadow-lg object-cover w-full max-w-[500px]"
        />
      </div>
    </main>
  );
}

export default function Footer() {
    return (
      <footer className="w-full max-h-[50px] bg-black text-white flex items-center justify-between px-6 py-4">
        {/* Circulo con texto centrado */}
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full border border-white text-sm font-semibold">
          GLYNNE SEALAB
        </div>
  
        {/* Texto derechos reservados */}
        <p className="text-sm md:text-base whitespace-nowrap">
          Derechos Reservados
        </p>
      </footer>
    );
  }
  
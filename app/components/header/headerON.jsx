'use client';
import './headrOn.css';
import Login from '../../login/page'


export default function Header({ onLoginClick }) {
    // 🔘 Maneja clic en botón "Cerrar sesión"
  const handleLogout = () => {
    const confirmLogout = window.confirm('¿Estás seguro que deseas cerrar sesión?');
    if (confirmLogout) {
      document.cookie = 'token=; Max-Age=0; path=/'; // elimina token
      window.location.href = '/'; // redirige
    }
  };
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <img src="https://i.pinimg.com/736x/2e/21/17/2e21174c914bbda7eb287049b124f403.jpg" alt="Logo Lumina" className="logo-img" />
        </div>
        <div className=" items-center">
        
        <div className="flex justify-start md:justify-end w-full ">
  <style>{`
    .btn-glow {
      position: relative;
      overflow: hidden;
    }
    .btn-glow::after {
      content: "";
      position: absolute;
      left: -75%;
      top: 0;
      width: 50%;
      height: 100%;
      background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.16) 50%, transparent 60%);
      transform: skewX(-20deg);
      transition: left 0.6s;
      pointer-events: none;
    }
    .btn-glow:hover::after {
      left: 120%;
    }
  `}</style>
  <button
    onClick={handleLogout}
    className="btn-glow bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 sm:px-6 py-2 rounded-xl transition border border-gray-700 w-[150px] sm:w-[200px] md:w-[250px] lg:w-[161px]"
  >
    Cerrar sesión
  </button>
</div>
      </div>
      </div>
    </header>
  );
}

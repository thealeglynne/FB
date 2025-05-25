'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const { role } = await res.json();
      switch (role) {
        case 'gerencia':
          router.push('/gerencia');
          break;
        case 'lider':
          router.push('/lider');
          break;
        case 'analista':
          router.push('/analista');
          break;
        case 'auxiliar':
          router.push('/auxiliar');
          break;
        case 'practicante':
          router.push('/practicante');
          break;
        default:
          setError('Rol desconocido');
      }
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn-glow bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl transition-all border border-gray-700 w-[150px] sm:w-[200px] md:w-[250px] lg:w-[161px]"
      >
        Iniciar sesión
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" 
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-gray-900 p-6 rounded-2xl shadow-lg max-w-sm sm:max-w-md w-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-2xl font-bold" 
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-center text-white text-2xl sm:text-3xl font-semibold mb-4">
              Iniciar sesión
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-3 mb-4 text-sm sm:text-base"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Usuario"
              />
              <input
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-3 mb-4 text-sm sm:text-base"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
              />
              <button 
                type="submit"
                className="btn-glow bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl transition-all border border-gray-700 w-[150px] sm:w-[200px] md:w-[250px] lg:w-[161px]"
              >
                Entrar
              </button>
              {error && <p className="text-red-500 text-xs sm:text-sm text-center">{error}</p>}
            </form>
          </div>
        </div>
      )}
      
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
    </>
  );
}

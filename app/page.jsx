'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        if (!res.ok) throw new Error('No autorizado');

        const data = await res.json();
        redirectByRole(data.role, router);
      } catch (err) {
        setChecking(false); // Mostrar login si no hay sesión
      }
    };

    checkAuth();
  }, []);

  // 🚨 Detectar retroceso del navegador desde las vistas protegidas
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const confirmExit = window.confirm('¿Deseas cerrar sesión y salir de esta vista?');
      if (confirmExit) {
        document.cookie = 'token=; Max-Age=0; path=/'; // Borra cookie
        router.push('/login');
      } else {
        e.preventDefault();
        history.pushState(null, '', location.href); // Evita retroceso
      }
    };

    // Solo activar si ya hay token
    if (document.cookie.includes('token=')) {
      window.addEventListener('popstate', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('popstate', handleBeforeUnload);
    };
  }, [router]);

  if (checking) return <p>Cargando...</p>;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-8 gap-12 sm:p-20 font-sans">
      <Login />
    </div>
  );
}

function redirectByRole(role, router) {
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
      alert('Rol desconocido');
  }
}

// Componente Login embebido
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      redirectByRole(data.role, router);
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
      <input className="border p-2" value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuario" />
      <input className="border p-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
      <button className="bg-blue-500 text-white py-2" type="submit">Iniciar sesión</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}

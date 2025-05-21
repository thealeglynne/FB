'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
      <input
        className="border p-2"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Usuario"
      />
      <input
        className="border p-2"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Contraseña"
      />
      <button className="bg-blue-500 text-white py-2" type="submit">Iniciar sesión</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}

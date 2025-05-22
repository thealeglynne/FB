'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './LoginPage.css';


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
      <button onClick={() => setIsOpen(true)} className="btn-glow login-open-button">
        Iniciar sesión
      </button>

      {isOpen && (
        <div className="login-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="login-close-button" onClick={() => setIsOpen(false)}>✕</button>
            <h2 className="login-title">Iniciar sesión</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                className="login-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Usuario"
              />
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
              />
              <button className="login-button" type="submit">Entrar</button>
              {error && <p className="login-error">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

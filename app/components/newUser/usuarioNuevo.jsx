'use client';
import { useEffect, useState } from "react";

// PON TUS VALORES AQUÍ
const BIN_ID = '683358498960c979a5a0fa92';
const API_KEY = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

const equipos = ['ALFA','GAMA','DELTA','SIGMA','LAMDA','OMGA','KAPPA','THETA'];

function limpiarUsuario(nombre) {
  return nombre
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // tildes
    .toLowerCase()
    .replace(/\s+/g, '');
}

export default function CrearUsuarioPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState({
    nombreCompleto: '',
    username: '',
    correo: '',
    rol: 'analista',
    equipo: equipos[0],
    password: '',
  });

  // Cargar usuarios al inicio
  useEffect(() => {
    async function cargarUsuarios() {
      setCargando(true);
      try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
          headers: { 'X-Access-Key': API_KEY }
        });
        const data = await res.json();
        setUsuarios(Array.isArray(data.record) ? data.record : []);
      } catch (e) {
        setMensaje('Error al cargar usuarios');
      }
      setCargando(false);
    }
    cargarUsuarios();
  }, []);

  // Autogenera username y correo
  useEffect(() => {
    if (!form.nombreCompleto.trim()) return;
    const username = limpiarUsuario(form.nombreCompleto);
    setForm(f => ({
      ...f,
      username,
      correo: `${username}@tudominio.com` // cámbialo por tu dominio real si quieres
    }));
  }, [form.nombreCompleto]);

  // Guardar nuevo usuario
  async function guardarUsuario(e) {
    e.preventDefault();
    if (!form.nombreCompleto.trim() || !form.username.trim() || !form.correo.trim() || !form.password.trim()) {
      setMensaje('Completa todos los campos obligatorios');
      return;
    }
    // Evita duplicados
    if (usuarios.some(u => u.username === form.username)) {
      setMensaje('El nombre de usuario ya existe');
      return;
    }
    const nuevo = {
      ...form,
      tareasAsignadas: [],
      creadoEn: new Date().toISOString(),
    };
    const nuevosUsuarios = [...usuarios, nuevo];
    setMensaje('Guardando...');
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': API_KEY,
          'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify(nuevosUsuarios)
      });
      setUsuarios(nuevosUsuarios);
      setMensaje('Usuario creado con éxito');
      setShowModal(false);
      setForm({
        nombreCompleto: '',
        username: '',
        correo: '',
        rol: 'analista',
        equipo: equipos[0],
        password: '',
      });
    } catch (err) {
      setMensaje('Error al guardar usuario');
    }
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-800 transition"
      >
        Agregar nuevo usuario
      </button>
      {mensaje && (
        <div className="mt-2 text-sm text-yellow-300">{mensaje}</div>
      )}
      {/* Lista de usuarios */}
      <div className="mt-4 bg-gray-900 rounded-xl p-4 border border-gray-700 max-h-96 overflow-auto">
        <h3 className="text-cyan-300 font-bold mb-2">Usuarios existentes:</h3>
        {cargando ? (
          <div className="text-gray-300">Cargando...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-gray-400">No hay usuarios registrados aún.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr>
                <th className="px-2 py-1 text-cyan-400">Nombre</th>
                <th className="px-2 py-1 text-cyan-400">Usuario</th>
                <th className="px-2 py-1 text-cyan-400">Correo</th>
                <th className="px-2 py-1 text-cyan-400">Rol</th>
                <th className="px-2 py-1 text-cyan-400">Equipo</th>
                <th className="px-2 py-1 text-cyan-400">#Tareas</th>
                <th className="px-2 py-1 text-cyan-400">Creado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.username}>
                  <td className="px-2 py-1 text-white">{u.nombreCompleto}</td>
                  <td className="px-2 py-1 text-gray-300">{u.username}</td>
                  <td className="px-2 py-1 text-gray-300">{u.correo}</td>
                  <td className="px-2 py-1 text-cyan-400">{u.rol}</td>
                  <td className="px-2 py-1 text-cyan-400">{u.equipo}</td>
                  <td className="px-2 py-1 text-green-300">{u.tareasAsignadas?.length ?? 0}</td>
                  <td className="px-2 py-1 text-gray-400">{u.creadoEn ? u.creadoEn.split('T')[0] : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para crear usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-cyan-700 rounded-xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-xl font-bold"
              aria-label="Cerrar"
            >×</button>
            <h2 className="text-cyan-400 font-bold text-lg mb-3">Nuevo Usuario</h2>
            <form className="space-y-2" onSubmit={guardarUsuario}>
              <div>
                <label className="block text-xs text-cyan-200">Nombre completo*</label>
                <input
                  type="text"
                  value={form.nombreCompleto}
                  onChange={e => setForm(f => ({ ...f, nombreCompleto: e.target.value }))}
                  className="w-full p-2 rounded bg-black border border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-200">Nombre de usuario*</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full p-2 rounded bg-black border border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-200">Correo electrónico*</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  className="w-full p-2 rounded bg-black border border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-200">Rol*</label>
                <select
                  value={form.rol}
                  onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                  className="w-full p-2 rounded bg-black border border-gray-700 text-white"
                  required
                >
                  <option value="analista">Analista</option>
                  <option value="auxiliar">Auxiliar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-cyan-200">Equipo*</label>
                <select
                  value={form.equipo}
                  onChange={e => setForm(f => ({ ...f, equipo: e.target.value }))}
                  className="w-full p-2 rounded bg-black border border-gray-700 text-white"
                  required
                >
                  {equipos.map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-cyan-200">Contraseña*</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full p-2 rounded bg-black border border-gray-700 text-white"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-cyan-700 text-white px-4 py-2 rounded font-semibold hover:bg-cyan-800"
                >
                  Guardar usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react'; // <-- Importa React aquí

// Config de usuarios (ajusta el BIN_ID y API_KEY si tu bin cambia)
const BIN_ID_USUARIOS = '683358498960c979a5a0fa92';
const API_KEY_USUARIOS = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

export default function VisualEquipos({ equipo, tareas }) {
  const [usuariosEquipo, setUsuariosEquipo] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!equipo) {
      setUsuariosEquipo([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_USUARIOS}`, {
      headers: { 'X-Access-Key': API_KEY_USUARIOS }
    })
      .then(res => res.json())
      .then(data => {
        const all = Array.isArray(data.record) ? data.record : [];
        // Solo analistas y auxiliares del equipo seleccionado
        setUsuariosEquipo(
          all.filter(u =>
            (u.rol === 'analista' || u.rol === 'auxiliar') &&
            u.equipo === equipo
          )
        );
      })
      .catch(() => setUsuariosEquipo([]))
      .finally(() => setCargando(false));
  }, [equipo]);

  if (!equipo) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-cyan-300">
        Integrantes del equipo {equipo}
      </h2>
      {cargando ? (
        <div className="text-gray-400">Cargando integrantes...</div>
      ) : usuariosEquipo.length === 0 ? (
        <div className="text-gray-400">No hay integrantes registrados en este equipo.</div>
      ) : (
        <div className="overflow-auto max-h-80">
          <table className="w-full text-xs text-left">
            <thead>
              <tr>
                <th className="px-2 py-1 text-cyan-400">Nombre</th>
                <th className="px-2 py-1 text-cyan-400">Rol</th>
                <th className="px-2 py-1 text-cyan-400">Correo</th>
                <th className="px-2 py-1 text-cyan-400">#Tareas</th>
                <th className="px-2 py-1 text-cyan-400">¿Tiene tareas?</th>
              </tr>
            </thead>
            <tbody>
              {usuariosEquipo.map(u => {
                // Busca todas las tareas asignadas a ese usuario
                const tareasAsignadas = tareas.filter(
                  t =>
                    t.Analista === u.nombreCompleto ||
                    t.Auxiliar === u.nombreCompleto
                );
                const cantidadTareas = tareasAsignadas.length;
                return (
                  <React.Fragment key={u.username}>
                    <tr>
                      <td className="px-2 py-1 text-white">{u.nombreCompleto}</td>
                      <td className="px-2 py-1 text-cyan-300">{u.rol}</td>
                      <td className="px-2 py-1 text-gray-300">{u.correo}</td>
                      <td className="px-2 py-1 text-green-300 text-center">{cantidadTareas}</td>
                      <td className="px-2 py-1 text-center">
                        {cantidadTareas > 0 ? (
                          <span className="text-green-400 font-bold">Sí</span>
                        ) : (
                          <span className="text-red-400 font-bold">No</span>
                        )}
                      </td>
                    </tr>
                    {/* Si tiene tareas, mostrar la lista de tareas debajo */}
                    {cantidadTareas > 0 && (
                      <tr>
                        <td colSpan={5} className="pl-6 pr-2 py-2 bg-gray-800 text-xs text-cyan-200">
                          <strong>Tareas asignadas:</strong>
                          <ul className="list-disc ml-4">
                            {tareasAsignadas.map((t, idx) => (
                              <li key={idx}>
                                {t.Nombre_Granulo || t.Materia || 'Tarea sin nombre'}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

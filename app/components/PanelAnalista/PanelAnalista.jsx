'use client';
import React, { useEffect, useState } from 'react';

// Cambia estos valores si tu JSONbin de tareas cambia:
const BIN_ID_TAREAS = '682f89858a456b7966a3e42c';
const API_KEY = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

// Este componente espera recibir `username` y/o `nombreCompleto` del usuario logueado
export default function PanelAnalista({ username, nombreCompleto }) {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!nombreCompleto) return; // Necesitamos el nombre completo
    setCargando(true);
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
      headers: { 'X-Access-Key': API_KEY }
    })
      .then(res => res.json())
      .then(data => {
        const all = Array.isArray(data.record) ? data.record : [];
        // Filtra por tareas donde el analista sea este usuario
        setTareas(all.filter(t =>
          t.Analista === nombreCompleto ||
          t.Auxiliar === nombreCompleto ||
          t.Practicante === nombreCompleto
        ));
      })
      .catch(() => setTareas([]))
      .finally(() => setCargando(false));
  }, [nombreCompleto]);

  if (!nombreCompleto) {
    return (
      <div className="bg-gray-900 text-red-400 p-6 rounded-xl text-center">
        No se detectó el usuario. Inicia sesión correctamente.
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-cyan-400">
          Mis tareas asignadas
        </h1>
        <div className="mb-6 text-cyan-200 text-lg">
          Usuario: <span className="font-semibold">{nombreCompleto}</span>
        </div>
        {cargando ? (
          <div className="text-gray-400">Cargando tareas...</div>
        ) : tareas.length === 0 ? (
          <div className="text-gray-400">No tienes tareas asignadas.</div>
        ) : (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4">
            <table className="min-w-max w-full text-xs sm:text-sm border-separate border-spacing-0">
              <thead className="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-cyan-400">Tarea (Gránulo)</th>
                  <th className="px-3 py-2 text-cyan-400">Materia</th>
                  <th className="px-3 py-2 text-cyan-400">Equipo</th>
                  <th className="px-3 py-2 text-cyan-400">Fecha Asignación</th>
                  <th className="px-3 py-2 text-cyan-400">Observaciones</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900">
                {tareas.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-800 transition group">
                    <td className="px-3 py-2 font-semibold text-cyan-200">
                      {t.Nombre_Granulo || t.Actividad || 'Sin nombre'}
                    </td>
                    <td className="px-3 py-2 text-white">{t.Materia || '-'}</td>
                    <td className="px-3 py-2 text-cyan-300">{t.Equipo || '-'}</td>
                    <td className="px-3 py-2 text-green-300">{t.Fecha_Asignacion || '-'}</td>
                    <td className="px-3 py-2 text-gray-300">{t.Observaciones || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

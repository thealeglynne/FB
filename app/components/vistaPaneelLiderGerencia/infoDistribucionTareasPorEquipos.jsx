'use client';
import { useState, useEffect, useCallback } from 'react';
import GraphicsLider from '../vistaPaneelLiderGerencia/panelGraficasLiderGerencia';

const datos = {
  equipos: ['ALFA','GAMA','DELTA','SIGMA','LAMDA','OMGA']
};

const BIN_ID_CURSOS = '682f27e08960c979a59f5afe';
const BIN_ID_TAREAS = '682f89858a456b7966a3e42c';
const API_KEY_ACCESS = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

const buttonGlowStyle = `
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
`;

export default function SistemaGestionTareas() {
  const [cursos, setCursos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(datos.equipos[0] || '');

  // Función para cargar datos y asignar cursos sin equipo
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const resCursos = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_CURSOS}`, {
        headers: { 'X-Access-Key': API_KEY_ACCESS }
      });
      const dataCursos = await resCursos.json();
      const cursosData = Array.isArray(dataCursos.record) ? dataCursos.record : [];

      const resTareas = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
        headers: { 'X-Access-Key': API_KEY_ACCESS }
      });
      const dataTareas = await resTareas.json();
      const tareasData = Array.isArray(dataTareas.record) ? dataTareas.record : [];

      // Asignar equipos a cursos sin asignar
      let cursosActualizados = [...cursosData];
      const cursosSinAsignar = cursosData.filter(c => !c.asignado_a);
      if (cursosSinAsignar.length > 0) {
        const conteoEquipos = datos.equipos.map(equipo => ({
          equipo,
          count: cursosData.filter(c => c.asignado_a === equipo).length
        })).sort((a, b) => a.count - b.count);

        let equipoIndex = 0;
        cursosSinAsignar.forEach(curso => {
          const equipo = conteoEquipos[equipoIndex % conteoEquipos.length].equipo;
          cursosActualizados = cursosActualizados.map(c =>
            c.ID_Programa === curso.ID_Programa && c['Nombre del Programa'] === curso['Nombre del Programa']
              ? { ...c, asignado_a: equipo }
              : c
          );
          equipoIndex++;
        });

        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_CURSOS}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': API_KEY_ACCESS,
            'X-Bin-Versioning': 'false'
          },
          body: JSON.stringify(cursosActualizados)
        });
      }

      setCursos(cursosActualizados);
      setTareas(tareasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial y refresco automático cada 5 minutos (300000 ms)
  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(() => {
      cargarDatos();
    }, 300000);

    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  // Filtrar cursos y tareas por equipo seleccionado
  const cursosFiltrados = cursos.filter(curso => curso.asignado_a === equipoSeleccionado);
  const tareasFiltradas = tareas.filter(tarea => tarea.Equipo === equipoSeleccionado);

  if (cargando) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-lg">Cargando y distribuyendo materias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <style>{buttonGlowStyle}</style>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">
            Panel de visualización de Tareas y Cursos
          </h1>
          <div className="flex items-center gap-4">
            <label htmlFor="equipoSelect" className="block text-sm font-medium text-gray-300 mb-1">Equipo Actual (solo referencia)</label>
            <select
              id="equipoSelect"
              value={equipoSeleccionado}
              onChange={e => setEquipoSeleccionado(e.target.value)}
              className="appearance-none p-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 pr-8"
            >
              {datos.equipos.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>

            {/* Botón refrescar */}
            <button
              onClick={cargarDatos}
              type="button"
              className="btn-glow px-4 py-2 rounded-xl font-semibold border border-green-500 text-green-400 hover:bg-green-700 transition"
              title="Refrescar datos"
            >
              🔄 Refrescar
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">
            Cursos Asignados (Equipo {equipoSeleccionado})
          </h2>
          {cursosFiltrados.length === 0 ? (
            <p className="text-gray-400">No hay cursos asignados para este equipo.</p>
          ) : (
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead className="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Programa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Escuela</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Equipo Asignado</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900">
                {cursosFiltrados.map((curso, idx) => (
                  <tr key={idx} className="hover:bg-gray-800 transition group">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-white border-b border-gray-800 group-last:border-b-0">
                      {curso['Nombre del Programa']}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800 group-last:border-b-0">
                      {curso['Escuela']}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800 group-last:border-b-0">
                      {curso.asignado_a || 'No asignado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <GraphicsLider cursos={cursosFiltrados} tareas={tareasFiltradas} />
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">
            Tareas Registradas (Equipo {equipoSeleccionado})
          </h2>
          {tareasFiltradas.length === 0 ? (
            <p className="text-gray-400">No hay tareas registradas para este equipo.</p>
          ) : (
            <div className="overflow-auto max-h-[70vh] max-w-full border border-gray-700 rounded-xl">
              <table className="min-w-max w-full text-sm border-separate border-spacing-0">
                <thead className="bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Equipo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Materia</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">ID Gránulo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Fecha Asignación</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900">
                  {tareasFiltradas.map((tarea, idx) => (
                    <tr key={idx} className="hover:bg-gray-800 transition group">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-white border-b border-gray-800">{tarea.Equipo}</td>
                      <td className="px-4 py-3 text-gray-400 border-b border-gray-800">{tarea.Materia}</td>
                      <td className="px-4 py-3 text-gray-400 border-b border-gray-800">{tarea.ID_Granulo}</td>
                      <td className="px-4 py-3 text-gray-400 border-b border-gray-800">{tarea.Fecha_Asignacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

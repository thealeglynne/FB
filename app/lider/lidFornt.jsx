'use client';
import { useState, useEffect, useMemo } from 'react';
import LiderChart from './chrtLider';

const BIN_ID_CURSOS = '682f27e08960c979a59f5afe';
const BIN_ID_TAREAS = '683473998561e97a501bb4f1';
const BIN_ID_USUARIOS = '683358498960c979a5a0fa92';
const API_KEY = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

const GRANULOS_NOMBRES = ["Tema 1", "Tema 2", "Tema 3", "Tema 4", "Tema 5"];
const ACTIVIDADES = [
  { Tipo: "Video educativo", Tiempo_Ideal_Min: 20 },
  { Tipo: "Podcast (temática)", Tiempo_Ideal_Min: 15 },
  { Tipo: "Infografía", Tiempo_Ideal_Min: 210 },
  { Tipo: "Imágenes y personajes", Tiempo_Ideal_Min: 15 },
  { Tipo: "Actividades en iSpring", Tiempo_Ideal_Min: 25 },
  { Tipo: "Prevalidación", Tiempo_Ideal_Min: 12.5 },
  { Tipo: "Subida de SCORM a Drive", Tiempo_Ideal_Min: 30 },
  { Tipo: "Validación final a Moodle", Tiempo_Ideal_Min: 30 }
];
const EQUIPOS = ['ALFA', 'GAMA', 'DELTA', 'SIGMA', 'LAMDA', 'OMGA', 'KAPPA', 'THETA'];

function normalizarNombre(nombre) {
  if (!nombre) return '';
  return nombre
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export default function PanelLider() {
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [asignando, setAsignando] = useState(false);

  // Filtros
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroAnalista, setFiltroAnalista] = useState('');
  const [filtroEscuela, setFiltroEscuela] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // -- FUNCIÓN DE RECARGA MANUAL --
  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [resCursos, resTareas, resUsuarios] = await Promise.all([
        fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_CURSOS}`, { headers: { 'X-Access-Key': API_KEY } }),
        fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, { headers: { 'X-Access-Key': API_KEY } }),
        fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_USUARIOS}`, { headers: { 'X-Access-Key': API_KEY } }),
      ]);
      const cursos = await resCursos.json();
      const tareas = await resTareas.json();
      const usuarios = await resUsuarios.json();
      setCursos(Array.isArray(cursos.record) ? cursos.record : []);
      setTareas(Array.isArray(tareas.record) ? tareas.record : []);
      setUsuarios(Array.isArray(usuarios.record) ? usuarios.record : []);
    } catch {}
    setCargando(false);
  };

  // -- Carga inicial SOLO una vez --
  useEffect(() => { cargarTodo(); }, []);

  // -- Ajuste y reasignación cada vez que cambian los datos importantes o el equipo --
  useEffect(() => {
    if (!equipoSeleccionado || cargando) return;

    async function ajustarTareas() {
      setAsignando(true);

      let nuevasTareas = [...tareas];
      let hayCambios = false;

      // 1. Analistas válidos actuales del equipo
      const analistas = usuarios.filter(u => u.rol === 'analista' && u.equipo === equipoSeleccionado);
      const analistasValidos = analistas.map(u => normalizarNombre(u.nombreCompleto));

      // 2. Quitar tareas de usuarios eliminados (solo de este equipo)
      const tareasEliminadas = nuevasTareas.filter(
        t => t.Equipo === equipoSeleccionado &&
          !analistasValidos.includes(normalizarNombre(t.Analista))
      );
      nuevasTareas = nuevasTareas.filter(
        t => t.Equipo !== equipoSeleccionado ||
          analistasValidos.includes(normalizarNombre(t.Analista))
      );

      // 3. Reasignar tareas eliminadas (que no estén iniciadas)
      tareasEliminadas.forEach(tareaEliminada => {
        if (analistasValidos.length === 0) return;
        // Calcular cargas actuales
        const carga = {};
        analistasValidos.forEach(a => {
          carga[a] = nuevasTareas.filter(
            t => t.Equipo === equipoSeleccionado && normalizarNombre(t.Analista) === a
          ).length;
        });
        // Buscar analista con menos carga
        let asignarA = analistasValidos[0];
        for (let a of analistasValidos) {
          if (carga[a] < carga[asignarA]) asignarA = a;
        }
        // Solo reasignar si no hay ninguna actividad iniciada
        const ningunaIniciada = tareaEliminada.Gránulos.every(granulo =>
          granulo.Actividades.every(act => (act.Estado === "Pendiente" || !act.Estado) && !act.Fecha_Inicio)
        );
        if (ningunaIniciada) {
          nuevasTareas.push({
            ...tareaEliminada,
            Analista: usuarios.find(u => normalizarNombre(u.nombreCompleto) === asignarA)?.nombreCompleto || asignarA,
            Fecha_Asignacion: new Date().toISOString().split('T')[0],
            Observaciones: "Reasignada automáticamente",
          });
          hayCambios = true;
        }
      });

      // 4. NUEVO: Reasignar tareas no iniciadas de quien MÁS TIENE al que no tiene ninguna
      const tareasEquipo = nuevasTareas.filter(t => t.Equipo === equipoSeleccionado);
      analistasValidos.forEach(nuevoAnalista => {
        // Si el nuevo analista no tiene tareas, buscar tarea para reasignar
        const tieneTarea = tareasEquipo.some(t => normalizarNombre(t.Analista) === nuevoAnalista);
        if (!tieneTarea) {
          // Calcula quién es el analista con más tareas
          const cargaPorAnalista = {};
          analistasValidos.forEach(a => {
            cargaPorAnalista[a] = tareasEquipo.filter(t => normalizarNombre(t.Analista) === a).length;
          });
          // Busca el analista con MÁS tareas (>0)
          let mayorAnalista = analistasValidos[0];
          for (let a of analistasValidos) {
            if (cargaPorAnalista[a] > cargaPorAnalista[mayorAnalista]) mayorAnalista = a;
          }
          if (cargaPorAnalista[mayorAnalista] > 0) {
            // Busca una tarea NO iniciada de ese analista
            const tareaCandidato = tareasEquipo.find(t =>
              normalizarNombre(t.Analista) === mayorAnalista &&
              t.Gránulos.every(granulo =>
                granulo.Actividades.every(
                  act => (act.Estado === "Pendiente" || !act.Estado) && !act.Fecha_Inicio
                )
              )
            );
            if (tareaCandidato) {
              nuevasTareas = nuevasTareas.filter(t => t !== tareaCandidato);
              nuevasTareas.push({
                ...tareaCandidato,
                Analista: usuarios.find(u => normalizarNombre(u.nombreCompleto) === nuevoAnalista)?.nombreCompleto || nuevoAnalista,
                Fecha_Asignacion: new Date().toISOString().split('T')[0],
                Observaciones: "Reasignada automáticamente",
              });
              hayCambios = true;
            }
          }
        }
      });

      // 5. Asignación normal para materias nuevas del equipo
      const materiasEquipo = cursos.filter(c => c.asignado_a === equipoSeleccionado);
      materiasEquipo.forEach((curso) => {
        const yaAsignada = nuevasTareas.some(
          t => t.Equipo === equipoSeleccionado && t.Materia === curso['Nombre del Programa']
        );
        if (yaAsignada) return;

        const materiasPorAnalista = {};
        analistas.forEach(a => {
          materiasPorAnalista[a.nombreCompleto] = nuevasTareas.filter(
            t =>
              normalizarNombre(t.Analista) === normalizarNombre(a.nombreCompleto) &&
              t.Equipo === equipoSeleccionado
          ).length;
        });

        const analistaAsignado = analistas.reduce((minA, currA) =>
          materiasPorAnalista[currA.nombreCompleto] < materiasPorAnalista[minA.nombreCompleto]
            ? currA : minA, analistas[0]
        );

        nuevasTareas.push({
          Analista: analistaAsignado.nombreCompleto,
          Equipo: equipoSeleccionado,
          Materia: curso['Nombre del Programa'],
          Escuela: curso['Escuela'],
          Fecha_Asignacion: new Date().toISOString().split('T')[0],
          Observaciones: "",
          Gránulos: GRANULOS_NOMBRES.map((nombre, i) => ({
            ID_Granulo: i + 1,
            Nombre_Granulo: nombre,
            Actividades: ACTIVIDADES.map(act => ({
              Tipo: act.Tipo,
              Fecha_Asignacion: new Date().toISOString().split('T')[0],
              Fecha_Inicio: "",
              Fecha_Fin: "",
              Tiempo_Ideal_Min: act.Tiempo_Ideal_Min,
              Tiempo_Real_Min: "",
              Estado: "Pendiente",
              Observaciones: ""
            }))
          }))
        });
        hayCambios = true;
      });

      if (hayCambios) {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': API_KEY,
            'X-Bin-Versioning': 'false'
          },
          body: JSON.stringify(nuevasTareas)
        });
        setTareas(nuevasTareas);
      }
      setAsignando(false);
    }
    ajustarTareas();
    // eslint-disable-next-line
  }, [equipoSeleccionado, cursos, tareas, usuarios, cargando]);

  // Memoizados para performance UI
  const analistasEquipo = useMemo(() =>
    usuarios.filter(u => u.rol === 'analista' && u.equipo === equipoSeleccionado),
    [usuarios, equipoSeleccionado]
  );
  const tareasEquipo = useMemo(() =>
    tareas.filter(t => t.Equipo === equipoSeleccionado),
    [tareas, equipoSeleccionado]
  );

  const materiasUnicas = [...new Set(tareasEquipo.map(t => t.Materia))];
  const analistasUnicos = [...new Set(tareasEquipo.map(t => t.Analista))];
  const escuelasUnicas = [...new Set(tareasEquipo.map(t => t.Escuela))];

  const tareasFiltradas = useMemo(() => {
    return tareasEquipo
      .filter(t =>
        (!filtroMateria || t.Materia === filtroMateria) &&
        (!filtroAnalista || t.Analista === filtroAnalista) &&
        (!filtroEscuela || t.Escuela === filtroEscuela)
      );
  }, [tareasEquipo, filtroMateria, filtroAnalista, filtroEscuela]);

  const actividadesFiltradas = (granulos) => {
    return granulos.map(g => ({
      ...g,
      Actividades: g.Actividades.filter(a => !filtroEstado || a.Estado === filtroEstado)
    })).filter(g => g.Actividades.length > 0);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-lg">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        {/* BOTÓN DE ACTUALIZAR */}
        <div className="w-full flex items-center justify-end mb-2">
          <button
            className="bg-cyan-700 hover:bg-cyan-900 text-white font-bold py-2 px-4 rounded-xl transition"
            onClick={cargarTodo}
            disabled={cargando || asignando}
          >
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {/* SELECCIÓN DE EQUIPO */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 mb-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-cyan-400">Panel de Líder</h1>
            <label className="block text-base mb-1">Selecciona tu equipo:</label>
            <select
              value={equipoSeleccionado}
              onChange={e => setEquipoSeleccionado(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 transition"
            >
              <option value="">-- Selecciona un equipo --</option>
              {EQUIPOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            {asignando && <div className="text-yellow-400 mt-2">Ajustando tareas automáticamente...</div>}
          </div>
        </div>

        {/* INTEGRANTES DEL EQUIPO */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-lg p-4 sm:p-6 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-cyan-300 mb-2">Analistas del equipo</h2>
          {analistasEquipo.length === 0 ? (
            <div className="text-gray-400">No hay analistas registrados en este equipo.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm mb-2">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 text-cyan-400">Nombre</th>
                    <th className="text-left px-3 py-2 text-cyan-400">Correo</th>
                    <th className="text-left px-3 py-2 text-cyan-400"># Materias</th>
                  </tr>
                </thead>
                <tbody>
                  {analistasEquipo.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-800 transition">
                      <td className="px-3 py-2">{a.nombreCompleto}</td>
                      <td className="px-3 py-2">{a.correo}</td>
                      <td className="px-3 py-2 text-green-300 font-bold text-center">
                        {
                          tareasEquipo.filter(
                            t => normalizarNombre(t.Analista) === normalizarNombre(a.nombreCompleto)
                          ).length
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <LiderChart tareasEquipo={tareasEquipo} analistasEquipo={analistasEquipo} />

        {/* FILTROS AVANZADOS */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-lg p-4 sm:p-6 mb-4 flex flex-col sm:flex-row flex-wrap gap-4">
          <div>
            <label className="text-cyan-300 text-xs">Materia:</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
              value={filtroMateria}
              onChange={e => setFiltroMateria(e.target.value)}
            >
              <option value="">Todas</option>
              {materiasUnicas.map((mat, idx) => (
                <option key={idx} value={mat}>{mat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-cyan-300 text-xs">Analista:</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
              value={filtroAnalista}
              onChange={e => setFiltroAnalista(e.target.value)}
            >
              <option value="">Todos</option>
              {analistasUnicos.map((an, idx) => (
                <option key={idx} value={an}>{an}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-cyan-300 text-xs">Escuela:</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
              value={filtroEscuela}
              onChange={e => setFiltroEscuela(e.target.value)}
            >
              <option value="">Todas</option>
              {escuelasUnicas.map((esc, idx) => (
                <option key={idx} value={esc}>{esc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-cyan-300 text-xs">Estado actividad:</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En progreso">En progreso</option>
              <option value="Terminado">Terminado</option>
            </select>
          </div>
          <button
            className="px-3 py-2 mt-4 sm:mt-0 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            onClick={() => {
              setFiltroMateria('');
              setFiltroAnalista('');
              setFiltroEscuela('');
              setFiltroEstado('');
            }}
          >
            Limpiar Filtros
          </button>
        </div>

        {/* MATERIAS Y GRÁNULOS (FILTRADAS) */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-cyan-300 mb-2">Materias y estado de gránulos</h2>
          {tareasFiltradas.length === 0 ? (
            <div className="text-gray-400">No hay materias asignadas con esos filtros.</div>
          ) : (
            <div className="overflow-auto max-h-[65vh]">
              {tareasFiltradas.map((mat, idx) => (
                <div key={idx} className="mb-8">
                  <h3 className="font-semibold text-cyan-200 text-base mb-2">
                    {mat.Materia}
                    <span className="ml-2 px-2 py-1 bg-cyan-800 text-white text-xs rounded-full">{mat.Escuela}</span>
                    <span className="ml-2 px-2 py-1 bg-cyan-700 text-white text-xs rounded-full">{mat.Analista}</span>
                  </h3>
                  <div className="mb-2 text-sm text-gray-400">
                    <b>Fecha de asignación:</b> {mat.Fecha_Asignacion || '-'} &nbsp; | &nbsp;
                    <b>Observaciones:</b> {mat.Observaciones || '-'}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="min-w-max w-full text-xs sm:text-sm mb-2 border-separate border-spacing-0">
                      <thead className="bg-gray-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-cyan-400">Gránulo</th>
                          <th className="px-3 py-2 text-cyan-400">Actividad</th>
                          <th className="px-3 py-2 text-cyan-400">Estado</th>
                          <th className="px-3 py-2 text-cyan-400">Fecha Asignación</th>
                          <th className="px-3 py-2 text-cyan-400">Fecha Inicio</th>
                          <th className="px-3 py-2 text-cyan-400">Fecha Fin</th>
                          <th className="px-3 py-2 text-cyan-400">Tiempo Ideal</th>
                          <th className="px-3 py-2 text-cyan-400">Tiempo Real</th>
                          <th className="px-3 py-2 text-cyan-400">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900">
                        {actividadesFiltradas(mat.Gránulos).map((g, idxG) =>
                          g.Actividades.map((act, idxA) => (
                            <tr key={`${idxG}-${idxA}`} className="hover:bg-gray-800 transition group">
                              <td className="px-3 py-2 font-semibold text-cyan-200">{g.Nombre_Granulo}</td>
                              <td className="px-3 py-2 text-white">{act.Tipo}</td>
                              <td className={`px-3 py-2 font-bold text-center rounded-lg ${
                                act.Estado === 'Terminado'
                                  ? 'bg-green-700 text-white'
                                  : act.Estado === 'En progreso'
                                  ? 'bg-yellow-600 text-black'
                                  : 'bg-gray-800 text-gray-200'
                              }`}>
                                {act.Estado || 'Pendiente'}
                              </td>
                              <td className="px-3 py-2 text-green-200">{act.Fecha_Asignacion || '-'}</td>
                              <td className="px-3 py-2 text-cyan-200">{act.Fecha_Inicio || '-'}</td>
                              <td className="px-3 py-2 text-cyan-200">{act.Fecha_Fin || '-'}</td>
                              <td className="px-3 py-2 text-yellow-300">{act.Tiempo_Ideal_Min}</td>
                              <td className="px-3 py-2 text-yellow-300">{act.Tiempo_Real_Min || '-'}</td>
                              <td className="px-3 py-2 text-gray-300">{act.Observaciones || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

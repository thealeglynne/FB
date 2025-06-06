'use client';
import { useState, useEffect, useMemo } from 'react';
import LiderChart from './chrtLider';
import MaiLider from '../lider/page'

// Configuración de bins y API
const BIN_ID_CURSOS = '682f27e08960c979a59f5afe';
const BIN_ID_TAREAS = '683473998561e97a501bb4f1';
const BIN_ID_USUARIOS = '683358498960c979a5a0fa92';
const API_KEY = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

// Parámetros de tareas
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
  const [cargando, setCargando] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [asignando, setAsignando] = useState(false);

  // Filtros para UI
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroAnalista, setFiltroAnalista] = useState('');
  const [filtroEscuela, setFiltroEscuela] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEquipo, setFiltroEquipo] = useState(''); // Equipo debe ser seleccionado primero

  // --- FUNCIÓN DE RECARGA MANUAL ---
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

  // --- Carga inicial ---
  useEffect(() => { cargarTodo(); }, []);

  // --- ASIGNACIÓN SECUENCIAL A EQUIPOS Y ROUND-ROBIN DE ANALISTAS DENTRO DE EQUIPO ---
  useEffect(() => {
    if (cargando) return;

    async function asignarTareasEquiposYAnalistas() {
      setAsignando(true);

      // 1. Filtra materias activas
      const materiasActivas = cursos.filter(c => c['Nombre del Programa']);

      // 2. Asignación secuencial: primero a equipos, luego a analistas DENTRO del equipo (round robin)
      let tareasNuevas = [];
      EQUIPOS.forEach((equipo, equipoIdx) => {
        // Todas las materias que le tocan a este equipo, en orden de entrada
        const materiasDelEquipo = materiasActivas.filter((_, idx) => EQUIPOS[idx % EQUIPOS.length] === equipo);

        // Analistas activos de este equipo (el orden es estable)
        const analistasEquipo = usuarios.filter(
          u => u.rol === 'analista' && u.equipo === equipo
        );
        if (materiasDelEquipo.length === 0) return;

        materiasDelEquipo.forEach((curso, idxMateriaEnEquipo) => {
          // Round robin entre analistas del equipo
          let analista = '';
          if (analistasEquipo.length > 0) {
            analista = analistasEquipo[idxMateriaEnEquipo % analistasEquipo.length].nombreCompleto;
          }

          // Busca si ya existe la tarea para esa materia y equipo
          const existente = tareas.find(
            t => t.Equipo === equipo && t.Materia === curso['Nombre del Programa']
          );

          tareasNuevas.push({
            ...(existente || {}),
            Analista: analista,
            Equipo: equipo,
            Materia: curso['Nombre del Programa'],
            Escuela: curso['Escuela'],
            Fecha_Asignacion: existente?.Fecha_Asignacion || new Date().toISOString().split('T')[0],
            Observaciones: existente?.Observaciones || "",
            Gránulos: existente?.Gránulos || GRANULOS_NOMBRES.map((nombre, i) => ({
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
        });
      });

      // 3. Solo actualizar si hay cambios reales
      const stringify = obj => JSON.stringify(obj, null, 2);
      if (stringify(tareasNuevas) !== stringify(tareas)) {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': API_KEY,
            'X-Bin-Versioning': 'false'
          },
          body: JSON.stringify(tareasNuevas)
        });
        setTareas(tareasNuevas);
      }
      setAsignando(false);
    }

    asignarTareasEquiposYAnalistas();
    // eslint-disable-next-line
  }, [cursos, usuarios, cargando]);

  // Memo para performance UI (opcional)
  const materiasUnicas = useMemo(() => [
    ...new Set(
      tareas
        .filter(t => t.Equipo === filtroEquipo)
        .map(t => t.Materia)
    )
  ], [tareas, filtroEquipo]);

  const analistasUnicos = useMemo(() => [
    ...new Set(
      usuarios
        .filter(u => u.rol === 'analista' && u.equipo === filtroEquipo)
        .map(u => u.nombreCompleto)
    )
  ], [usuarios, filtroEquipo]);

  const escuelasUnicas = useMemo(() => [
    ...new Set(
      tareas
        .filter(t => t.Equipo === filtroEquipo)
        .map(t => t.Escuela)
    )
  ], [tareas, filtroEquipo]);

  // Equipos únicos presentes en las tareas
  const equiposUnicos = [...new Set(tareas.map(t => t.Equipo))].filter(Boolean);

  // --------- FIX para evitar error de map sobre undefined -----------
  const actividadesFiltradas = (granulos) => {
    if (!Array.isArray(granulos)) return [];
    return granulos.map(g => ({
      ...g,
      Actividades: g.Actividades.filter(a => !filtroEstado || a.Estado === filtroEstado)
    })).filter(g => g.Actividades.length > 0);
  };

  // Filtro SOLO aplica cuando se selecciona equipo
  const tareasFiltradas = useMemo(() => {
    if (!filtroEquipo) return [];
    return tareas
      .filter(t =>
        t.Equipo === filtroEquipo &&
        (!filtroMateria || t.Materia === filtroMateria) &&
        (!filtroAnalista || t.Analista === filtroAnalista) &&
        (!filtroEscuela || t.Escuela === filtroEscuela)
      );
  }, [tareas, filtroEquipo, filtroMateria, filtroAnalista, filtroEscuela]);

  // Para LiderChart: muestra solo la data del equipo seleccionado.
  const tareasEquipo = tareas.filter(t => t.Equipo === filtroEquipo);
  const analistasEquipo = usuarios.filter(u => u.rol === 'analista' && u.equipo === filtroEquipo);

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
      {/* FILTRO OBLIGATORIO DE EQUIPO */}
      <div className="max-w-xl mx-auto my-10 bg-gray-900 border border-gray-700 rounded-2xl shadow-lg p-6 flex flex-col items-center gap-6">
        <label className="text-cyan-300 font-bold text-base">
          Selecciona un equipo para visualizar información
        </label>
        <select
          className="w-full max-w-xs bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-lg"
          value={filtroEquipo}
          onChange={e => {
            setFiltroEquipo(e.target.value);
            // Limpiar otros filtros al cambiar equipo
            setFiltroMateria('');
            setFiltroAnalista('');
            setFiltroEscuela('');
            setFiltroEstado('');
          }}
        >
          <option value="">-- Selecciona Equipo --</option>
          {EQUIPOS.map((eq, idx) => (
            <option key={idx} value={eq}>{eq}</option>
          ))}
        </select>
      </div>

      {/* Solo mostrar el resto si hay equipo seleccionado */}
      {filtroEquipo && (
        <>
          {/* Gráfica global */}
          <LiderChart tareasEquipo={tareasEquipo} analistasEquipo={analistasEquipo} />

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
            
            {/* FILTROS */}
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
                        <span className="ml-2 px-2 py-1 bg-cyan-900 text-white text-xs rounded-full">{mat.Equipo}</span>
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
        </>
      )}
    </div>
  );
}

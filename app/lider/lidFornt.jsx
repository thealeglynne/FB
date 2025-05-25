'use client';
import { useState, useEffect, useMemo } from 'react';

const BIN_ID_CURSOS = '682f27e08960c979a59f5afe';
const BIN_ID_TAREAS = '682f89858a456b7966a3e42c';
const BIN_ID_USUARIOS = '683358498960c979a5a0fa92';
const API_KEY_ACCESS = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

const equipos = ['ALFA','GAMA','DELTA','SIGMA','LAMDA','OMGA','KAPPA','THETA'];

export default function SistemaGestionTareasDinamico() {
  const [cursos, setCursos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [cargando, setCargando] = useState(true);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);

  const [tareaEditIndex, setTareaEditIndex] = useState(null);

  const [formAsignacion, setFormAsignacion] = useState({
    Analista: '',
    Auxiliar: '',
    Practicante: '',
    Equipo: '',
    Materia: '',
    ID_Granulo: '',
    Nombre_Granulo: '',
    Fecha_Asignacion: new Date().toISOString().split('T')[0],
    Observaciones: '',
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const [resCursos, resTareas, resUsuarios] = await Promise.all([
          fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_CURSOS}`, { headers: { 'X-Access-Key': API_KEY_ACCESS }}),
          fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, { headers: { 'X-Access-Key': API_KEY_ACCESS }}),
          fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_USUARIOS}`, { headers: { 'X-Access-Key': API_KEY_ACCESS }}),
        ]);
        const dataCursos = await resCursos.json();
        const dataTareas = await resTareas.json();
        const dataUsuarios = await resUsuarios.json();

        setCursos(Array.isArray(dataCursos.record) ? dataCursos.record : []);
        setTareas(Array.isArray(dataTareas.record) ? dataTareas.record : []);
        setUsuarios(Array.isArray(dataUsuarios.record) ? dataUsuarios.record : []);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  // Cursos del equipo SIN tarea asignada
  function cursoYaAsignado(curso) {
    return tareas.some(t =>
      t.Equipo === curso.asignado_a &&
      t.Materia === curso['Nombre del Programa'] &&
      (
        t.Analista?.trim() ||
        t.Auxiliar?.trim() ||
        t.Practicante?.trim()
      )
    );
  }

  const cursosDelEquipo = useMemo(() => {
    if (!equipoSeleccionado) return [];
    return cursos
      .filter(c => c.asignado_a === equipoSeleccionado)
      .filter(c => !cursoYaAsignado(c));
  }, [equipoSeleccionado, cursos, tareas]);

  const tareasDelEquipo = useMemo(() => {
    if (!equipoSeleccionado) return [];
    return tareas.filter(t => t.Equipo === equipoSeleccionado);
  }, [equipoSeleccionado, tareas]);

  // --- USUARIOS FILTRADOS POR EQUIPO Y ROL ---
  const analistasEquipo = useMemo(() =>
    usuarios.filter(u => u.rol === 'analista' && u.equipo === equipoSeleccionado),
    [usuarios, equipoSeleccionado]
  );
  const auxiliaresEquipo = useMemo(() =>
    usuarios.filter(u => u.rol === 'auxiliar' && u.equipo === equipoSeleccionado),
    [usuarios, equipoSeleccionado]
  );
  const practicantesEquipo = useMemo(() =>
    usuarios.filter(u => u.rol === 'practicante' && u.equipo === equipoSeleccionado),
    [usuarios, equipoSeleccionado]
  );

  // --- LOGICA DE TAREAS ---
  const generarIdGranulo = () => {
    if (!equipoSeleccionado) return '1';
    const tareasEquipo = tareas.filter(t => t.Equipo === equipoSeleccionado);
    const maxId = tareasEquipo.reduce((max, t) => {
      const idNum = parseInt(t.ID_Granulo) || 0;
      return idNum > max ? idNum : max;
    }, 0);
    return (maxId + 1).toString();
  };

  useEffect(() => {
    if (materiaSeleccionada && equipoSeleccionado) {
      if (tareaEditIndex === null) {
        setFormAsignacion({
          Analista: '',
          Auxiliar: '',
          Practicante: '',
          Equipo: equipoSeleccionado,
          Materia: materiaSeleccionada['Nombre del Programa'],
          ID_Granulo: generarIdGranulo(),
          Nombre_Granulo: '',
          Fecha_Asignacion: new Date().toISOString().split('T')[0],
          Observaciones: '',
        });
      }
    }
  }, [materiaSeleccionada, equipoSeleccionado]);

  const handleGuardarTarea = async (e) => {
    e.preventDefault();
    if (!formAsignacion.Analista.trim() || !formAsignacion.ID_Granulo.trim() || !formAsignacion.Nombre_Granulo.trim() || !formAsignacion.Fecha_Asignacion.trim()) {
      alert('Por favor, completa los campos obligatorios (*)');
      return;
    }

    try {
      let nuevasTareas = [...tareas];
      if (tareaEditIndex !== null) {
        nuevasTareas[tareaEditIndex] = {
          ...nuevasTareas[tareaEditIndex],
          Analista: formAsignacion.Analista,
          Auxiliar: formAsignacion.Auxiliar || '',
          Practicante: formAsignacion.Practicante || '',
          Equipo: equipoSeleccionado,
          Materia: formAsignacion.Materia,
          ID_Granulo: formAsignacion.ID_Granulo,
          Nombre_Granulo: formAsignacion.Nombre_Granulo,
          Fecha_Asignacion: formAsignacion.Fecha_Asignacion,
          Observaciones: formAsignacion.Observaciones || '',
        };
      } else {
        const tareaNueva = {
          Analista: formAsignacion.Analista,
          Auxiliar: formAsignacion.Auxiliar || '',
          Practicante: formAsignacion.Practicante || '',
          Equipo: equipoSeleccionado,
          Materia: formAsignacion.Materia,
          ID_Granulo: formAsignacion.ID_Granulo,
          Nombre_Granulo: formAsignacion.Nombre_Granulo,
          Actividad: '',
          Rol: '',
          Fecha_Asignacion: formAsignacion.Fecha_Asignacion,
          Fecha_Inicio: '',
          Fecha_Fin: '',
          Tiempo_Real_Min: '',
          Tiempo_Ideal_Min: '',
          Observaciones: formAsignacion.Observaciones || '',
        };
        nuevasTareas.push(tareaNueva);
      }

      setTareas(nuevasTareas);
      setMostrarFormulario(false);
      setMateriaSeleccionada(null);
      setTareaEditIndex(null);

      setFormAsignacion({
        Analista: '',
        Auxiliar: '',
        Practicante: '',
        Equipo: equipoSeleccionado,
        Materia: '',
        ID_Granulo: '',
        Nombre_Granulo: '',
        Fecha_Asignacion: new Date().toISOString().split('T')[0],
        Observaciones: '',
      });

      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': API_KEY_ACCESS,
          'X-Bin-Versioning': 'false',
        },
        body: JSON.stringify(nuevasTareas),
      });
    } catch (error) {
      console.error('Error guardando tarea:', error);
      alert('Error al guardar la tarea, intenta de nuevo.');
    }
  };

  // NUEVO: ELIMINAR TAREA
  const handleEliminarTarea = async (idx) => {
    if (!confirm('¿Deseas eliminar esta tarea? El curso volverá a estar disponible en “Cursos Asignados”.')) return;
    try {
      const tarea = tareasDelEquipo[idx];
      const indiceGlobal = tareas.findIndex(t =>
        t.Equipo === tarea.Equipo &&
        t.Materia === tarea.Materia &&
        t.ID_Granulo === tarea.ID_Granulo &&
        t.Nombre_Granulo === tarea.Nombre_Granulo
      );
      if (indiceGlobal === -1) return;
      const nuevasTareas = [...tareas];
      nuevasTareas.splice(indiceGlobal, 1);
      setTareas(nuevasTareas);

      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': API_KEY_ACCESS,
          'X-Bin-Versioning': 'false',
        },
        body: JSON.stringify(nuevasTareas),
      });
    } catch (error) {
      alert('Error al eliminar la tarea');
    }
  };

  // -------------------------------------------

  if (cargando) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-lg">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!equipoSeleccionado) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">
            Gestión de Tareas
          </h1>
          <label htmlFor="equipoSelect" className="block text-sm font-medium text-gray-300 mb-2">
            Selecciona tu equipo:
          </label>
          <select
            id="equipoSelect"
            onChange={e => setEquipoSeleccionado(e.target.value)}
            className="appearance-none w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-8"
          >
            <option value="">-- Selecciona un equipo --</option>
            {equipos.map(eq => <option key={eq} value={eq}>{eq}</option>)}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* NUEVO: Tabla de analistas del equipo */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          <h2 className="text-lg font-bold text-cyan-400 mb-2">Analistas del equipo {equipoSeleccionado}</h2>
          {analistasEquipo.length === 0
            ? <div className="text-gray-400">No hay analistas registrados en este equipo.</div>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1 text-cyan-400">Nombre</th>
                    <th className="text-left px-2 py-1 text-cyan-400">Correo</th>
                  </tr>
                </thead>
                <tbody>
                  {analistasEquipo.map((a, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1">{a.nombreCompleto}</td>
                      <td className="px-2 py-1">{a.correo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        {/* Cursos asignados */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 mb-6 max-w-full max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Cursos Asignados</h2>
            <button
              disabled={cursosDelEquipo.length === 0}
              onClick={() => {
                if (cursosDelEquipo.length === 0) return;
                setMateriaSeleccionada(cursosDelEquipo[0]);
                setMostrarFormulario(true);
                setTareaEditIndex(null);
                setFormAsignacion(prev => ({ ...prev, ID_Granulo: generarIdGranulo() }));
              }}
              className={`btn-glow bg-gray-800 text-white font-semibold px-4 py-2 rounded-xl transition border border-gray-700
                ${cursosDelEquipo.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
            >
              Nueva Tarea
            </button>
          </div>
          {cursosDelEquipo.length === 0 ? (
            <p className="text-gray-400">No hay cursos asignados a este equipo pendientes por tarea.</p>
          ) : (
            <table className="min-w-max w-full text-sm border-separate border-spacing-0 bg-gray-900">
              <thead className="bg-gray-900 sticky top-0 z-10 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-300 whitespace-nowrap">Programa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300 whitespace-nowrap border-b border-gray-700">Escuela</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300 whitespace-nowrap border-b border-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900">
                {cursosDelEquipo.map((curso, idx) => (
                  <tr key={idx} className="hover:bg-gray-800 transition group">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-white border-b border-gray-800 group-last:border-b-0">
                      {curso['Nombre del Programa']}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800 group-last:border-b-0">
                      {curso['Escuela']}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap border-b border-gray-800 group-last:border-b-0">
                      <button
                        onClick={() => {
                          setMateriaSeleccionada(curso);
                          setMostrarFormulario(true);
                          setTareaEditIndex(null);
                          setFormAsignacion(prev => ({ ...prev, ID_Granulo: generarIdGranulo() }));
                        }}
                        className="text-green-500 hover:text-green-400 font-semibold"
                      >
                        Asignar Tarea
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulario de asignación */}
        {mostrarFormulario && materiaSeleccionada && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative overflow-y-auto max-h-[80vh]">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold"
                onClick={() => {
                  setMostrarFormulario(false);
                  setMateriaSeleccionada(null);
                  setTareaEditIndex(null);
                }}
                aria-label="Cerrar"
                type="button"
              >
                ×
              </button>
              <h2 className="text-xl font-bold text-white mb-2">{tareaEditIndex !== null ? 'Editar Tarea' : 'Asignar Tarea'}</h2>
              <p className="text-sm text-green-400 mb-4">{materiaSeleccionada['Nombre del Programa']}</p>
              <form onSubmit={handleGuardarTarea} className="space-y-4">
                {/* Analista */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Analista *</label>
                  <select
                    value={formAsignacion.Analista}
                    onChange={e => setFormAsignacion({...formAsignacion, Analista: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                    required
                  >
                    <option value="">-- Selecciona un analista --</option>
                    {analistasEquipo.map((a, i) => (
                      <option key={i} value={a.nombreCompleto}>{a.nombreCompleto}</option>
                    ))}
                  </select>
                </div>
                {/* Auxiliar */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Auxiliar (opcional)</label>
                  <select
                    value={formAsignacion.Auxiliar}
                    onChange={e => setFormAsignacion({...formAsignacion, Auxiliar: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                  >
                    <option value="">-- Selecciona un auxiliar --</option>
                    {auxiliaresEquipo.map((a, i) => (
                      <option key={i} value={a.nombreCompleto}>{a.nombreCompleto}</option>
                    ))}
                  </select>
                </div>
                {/* Practicante */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Practicante (opcional)</label>
                  <select
                    value={formAsignacion.Practicante}
                    onChange={e => setFormAsignacion({...formAsignacion, Practicante: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                  >
                    <option value="">-- Selecciona un practicante --</option>
                    {practicantesEquipo.map((p, i) => (
                      <option key={i} value={p.nombreCompleto}>{p.nombreCompleto}</option>
                    ))}
                  </select>
                </div>
                {/* ID Gránulo */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">ID Gránulo *</label>
                  <input
                    type="text"
                    value={formAsignacion.ID_Granulo}
                    onChange={e => setFormAsignacion({...formAsignacion, ID_Granulo: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                    required
                  />
                </div>
                {/* Nombre Gránulo */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Nombre Gránulo *</label>
                  <input
                    type="text"
                    value={formAsignacion.Nombre_Granulo}
                    onChange={e => setFormAsignacion({...formAsignacion, Nombre_Granulo: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                    required
                  />
                </div>
                {/* Fecha de Asignación */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Fecha de Asignación *</label>
                  <input
                    type="date"
                    value={formAsignacion.Fecha_Asignacion}
                    onChange={e => setFormAsignacion({...formAsignacion, Fecha_Asignacion: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                    required
                  />
                </div>
                {/* Observaciones */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Observaciones</label>
                  <textarea
                    value={formAsignacion.Observaciones}
                    onChange={e => setFormAsignacion({...formAsignacion, Observaciones: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                    rows="3"
                  />
                </div>
                {/* Botones */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setMateriaSeleccionada(null);
                      setTareaEditIndex(null);
                    }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition border border-gray-600 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition border border-green-700 font-semibold"
                  >
                    {tareaEditIndex !== null ? 'Guardar Cambios' : 'Guardar Tarea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabla de tareas */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">Tareas Registradas</h2>
          {tareasDelEquipo.length === 0 ? (
            <p className="text-gray-400">No hay tareas registradas para este equipo.</p>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] border border-gray-700 rounded-xl">
              <table className="min-w-full text-sm border-separate border-spacing-0">
                <thead className="bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Materia</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Analista</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Auxiliar</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Practicante</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">ID Gránulo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Nombre Gránulo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Fecha Asignación</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Observaciones</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900">
                  {tareasDelEquipo.map((tarea, idx) => (
                    <tr key={idx} className="hover:bg-gray-800 transition group">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-white border-b border-gray-800">{tarea.Materia}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800">{tarea.Analista}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800">{tarea.Auxiliar || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800">{tarea.Practicante || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800">{tarea.ID_Granulo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800">{tarea.Nombre_Granulo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800">{tarea.Fecha_Asignacion}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800">{tarea.Observaciones || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center border-b border-gray-800 space-x-2">
                        <button
                          onClick={() => handleEliminarTarea(idx)}
                          className="text-red-500 hover:text-red-400 font-semibold"
                          aria-label="Eliminar tarea"
                          title="Eliminar tarea"
                        >
                          Eliminar
                        </button>
                      </td>
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

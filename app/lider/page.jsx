'use client';
import { useState, useEffect } from 'react';

const EQUIPOS = ['ALFA', 'GAMA', 'DELTA', 'SIGMA', 'LAMDA', 'OMEGA'];
const BIN_ID_CURSOS = '682f27e08960c979a59f5afe';
const BIN_ID_TAREAS = '682f89858a456b7966a3e42c';
const API_KEY_ACCESS = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

// Estilo para el efecto glow en botones (tomado del ejemplo)
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
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState({
    Analista: '',
    Auxiliar: '',
    Equipo: '',
    Materia: '',
    ID_Granulo: '',
    Observaciones: '',
    Fecha_Asignacion: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchAndDistribute = async () => {
      setCargando(true);
      try {
        const resCursos = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_CURSOS}`, {
          headers: { 'X-Access-Key': API_KEY_ACCESS }
        });
        const dataCursos = await resCursos.json();
        let cursosData = Array.isArray(dataCursos.record) ? dataCursos.record : [];
        
        const resTareas = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
          headers: { 'X-Access-Key': API_KEY_ACCESS }
        });
        const dataTareas = await resTareas.json();
        setTareas(Array.isArray(dataTareas.record) ? dataTareas.record : []);
        
        const cursosSinAsignar = cursosData.filter(c => !c.asignado_a);
        if (cursosSinAsignar.length > 0) {
          const conteoEquipos = EQUIPOS.map(equipo => ({
            equipo,
            count: cursosData.filter(c => c.asignado_a === equipo).length
          })).sort((a, b) => a.count - b.count);

          let equipoIndex = 0;
          cursosSinAsignar.forEach(curso => {
            const equipo = conteoEquipos[equipoIndex % conteoEquipos.length].equipo;
            cursosData = cursosData.map(c => 
              c.ID_Programa === curso.ID_Programa && c['Nombre del Programa'] === curso['Nombre del Programa'] ? { ...c, asignado_a: equipo } : c
            );
            equipoIndex++;
          });
           // Guardar los cursos actualizados en JSONbin
          await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_CURSOS}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Access-Key': API_KEY_ACCESS,
              'X-Bin-Versioning': 'false' // Para evitar crear nuevas versiones si no es necesario
            },
            body: JSON.stringify(cursosData)
          });
        }
        
        setCursos(cursosData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchAndDistribute();
  }, []);

  const tareasDelEquipo = equipoSeleccionado 
    ? tareas.filter(t => t.Equipo === equipoSeleccionado)
    : [];

  // Crear un Set con los nombres de las materias que ya tienen tareas asignadas para el equipo seleccionado
  const nombresMateriasConTareasSet = equipoSeleccionado
    ? new Set(tareasDelEquipo.map(t => t.Materia))
    : new Set();

  // Filtrar cursos del equipo para excluir aquellos que ya tienen una tarea registrada
  const cursosDelEquipo = equipoSeleccionado 
    ? cursos.filter(c => {
        const esDelEquipo = c.asignado_a === equipoSeleccionado;
        const nombrePrograma = c && c['Nombre del Programa'];
        // Un curso se muestra si es del equipo y su nombre de programa no está en el set de materias con tareas
        const noTieneTareaAsignada = nombrePrograma ? !nombresMateriasConTareasSet.has(nombrePrograma) : true;
        return esDelEquipo && noTieneTareaAsignada;
      })
    : [];

  const generarIdSecuencial = () => {
    const tareasDelEquipoActual = equipoSeleccionado ? tareas.filter(t => t.Equipo === equipoSeleccionado) : [];
    const maxId = tareasDelEquipoActual.reduce((max, tarea) => {
      const id = parseInt(tarea.ID_Granulo) || 0;
      return id > max ? id : max;
    }, 0);
    return (maxId + 1).toString();
  };
  
  const handleSubmitTarea = async (e) => {
    e.preventDefault();
    try {
      const materiaActual = materiaSeleccionada || (cursosDelEquipo.length > 0 ? cursosDelEquipo[0] : null);
      
      if (!materiaActual) {
        alert('No hay materias disponibles para asignar tareas'); // Considerar un toast aquí
        return;
      }

      const tareaCompleta = {
        ...nuevaTarea,
        Equipo: equipoSeleccionado,
        Materia: materiaActual['Nombre del Programa'], // Asegúrate que este campo coincida con lo que usas para filtrar
        ID_Granulo: nuevaTarea.ID_Granulo || generarIdSecuencial(),
        Fecha_Asignacion: nuevaTarea.Fecha_Asignacion
      };
      
      const nuevasTareas = [...tareas, tareaCompleta];
      setTareas(nuevasTareas);
      
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': API_KEY_ACCESS,
          'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify(nuevasTareas)
      });
      
      setMostrarFormulario(false);
      setNuevaTarea({
        Analista: '', Auxiliar: '', Equipo: '', Materia: '', ID_Granulo: '', Observaciones: '',
        Fecha_Asignacion: new Date().toISOString().split('T')[0]
      });
      setMateriaSeleccionada(null); // Desseleccionar la materia después de asignar
    } catch (error) {
      console.error('Error al guardar la tarea:', error); // Considerar un toast de error
    }
  };

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

  if (!equipoSeleccionado) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">
            Gestión de Tareas
          </h1>
          
          <div className="mb-4">
            <label htmlFor="equipoSelect" className="block text-sm font-medium text-gray-300 mb-2">
              Selecciona tu equipo:
            </label>
            <div className="relative">
              <select
                id="equipoSelect"
                onChange={(e) => {
                  setEquipoSeleccionado(e.target.value);
                  // Resetear materia seleccionada y formulario al cambiar de equipo
                  setMateriaSeleccionada(null);
                  setMostrarFormulario(false);
                }}
                className="appearance-none w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-8"
              >
                <option value="">-- Selecciona un equipo --</option>
                {EQUIPOS.map(equipo => (
                  <option key={equipo} value={equipo}>{equipo}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <style>{buttonGlowStyle}</style>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Panel del Equipo:&nbsp;
              <span className="ml-2 bg-green-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {equipoSeleccionado}
              </span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {cursosDelEquipo.length} {cursosDelEquipo.length === 1 ? 'curso disponible' : 'cursos disponibles'} | {tareasDelEquipo.length} {tareasDelEquipo.length === 1 ? 'tarea registrada' : 'tareas registradas'}
            </p>
          </div>
          
          <div className="relative mt-3 sm:mt-0">
            <select
              value={equipoSeleccionado}
              onChange={(e) => {
                setEquipoSeleccionado(e.target.value);
                setMateriaSeleccionada(null);
                setMostrarFormulario(false);
              }}
              className="appearance-none p-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 pr-8"
            >
              {EQUIPOS.map(equipo => (
                <option key={equipo} value={equipo}>{equipo}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              ▼
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-0">Cursos Asignados (Disponibles para Tarea)</h2>
            <button 
              onClick={() => {
                if (cursosDelEquipo.length > 0) {
                    setMateriaSeleccionada(cursosDelEquipo[0]); // Preselecciona el primer curso disponible
                    setNuevaTarea(prev => ({ ...prev, ID_Granulo: generarIdSecuencial() }));
                    setMostrarFormulario(true);
                } else {
                    alert("No hay cursos disponibles para asignar una nueva tarea.");
                }
              }}
              className={`btn-glow bg-gray-800 text-white font-semibold px-4 py-2 rounded-xl transition border border-gray-700
                ${cursosDelEquipo.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}
              `}
              disabled={cursosDelEquipo.length === 0}
            >
              Nueva Tarea
            </button>
          </div>
          
          {cursosDelEquipo.length > 0 ? (
            <div className="overflow-x-auto max-h-[60vh] border border-gray-700 rounded-xl">
              <table className="min-w-full text-sm border-separate border-spacing-0">
                <thead className="bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Programa</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Escuela</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900">
                  {cursosDelEquipo.map((curso, index) => (
                    <tr key={index} className="hover:bg-gray-800 transition group">
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
                            setNuevaTarea(prev => ({ ...prev, ID_Granulo: generarIdSecuencial() }));
                            setMostrarFormulario(true);
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
            </div>
          ) : (
            <p className="text-gray-400">No hay cursos disponibles para asignar tareas a este equipo o todos ya tienen una tarea registrada.</p>
          )}
        </div>

        {mostrarFormulario && materiaSeleccionada && ( // Asegúrate que materiaSeleccionada exista para mostrar el formulario
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold"
                onClick={() => {
                  setMostrarFormulario(false);
                  setMateriaSeleccionada(null); // Limpiar materia seleccionada al cerrar
                }}
                aria-label="Cerrar"
                type="button"
              >
                ×
              </button>
              <h2 className="text-xl font-bold text-white mb-1">
                Asignar Tarea
              </h2>
              {materiaSeleccionada && <p className="text-sm text-green-400 mb-4">{materiaSeleccionada['Nombre del Programa']}</p>}
              
              <form onSubmit={handleSubmitTarea} className="max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Analista *</label>
                    <input
                      type="text"
                      value={nuevaTarea.Analista}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, Analista: e.target.value})}
                      className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Auxiliar *</label>
                    <input
                      type="text"
                      value={nuevaTarea.Auxiliar}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, Auxiliar: e.target.value})}
                      className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">ID Gránulo</label>
                    <input
                      type="text"
                      value={nuevaTarea.ID_Granulo}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, ID_Granulo: e.target.value})}
                      className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                      placeholder="Se generará automáticamente si se deja vacío"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Observaciones</label>
                    <textarea
                      value={nuevaTarea.Observaciones}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, Observaciones: e.target.value})}
                      className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Fecha de Asignación</label>
                    <input
                      type="date"
                      value={nuevaTarea.Fecha_Asignacion}
                      onChange={(e) => setNuevaTarea({...nuevaTarea, Fecha_Asignacion: e.target.value})}
                      className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setMateriaSeleccionada(null); // Limpiar materia seleccionada al cancelar
                    }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition border border-gray-600 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition border border-green-700 font-semibold"
                  >
                    Guardar Tarea
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Tareas Registradas</h2>
          
          {tareasDelEquipo.length > 0 ? (
            <div className="overflow-x-auto max-h-[60vh] border border-gray-700 rounded-xl">
              <table className="min-w-full text-sm border-separate border-spacing-0">
                <thead className="bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Materia</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Analista</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Auxiliar</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">ID Gránulo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900">
                  {tareasDelEquipo.map((tarea, index) => (
                    <tr key={index} className="hover:bg-gray-800 transition group">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-white border-b border-gray-800 group-last:border-b-0">
                        {tarea.Materia}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800 group-last:border-b-0">
                        {tarea.Analista}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800 group-last:border-b-0">
                        {tarea.Auxiliar}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800 group-last:border-b-0">
                        {tarea.ID_Granulo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-gray-800 group-last:border-b-0">
                        {tarea.Fecha_Asignacion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No hay tareas registradas para este equipo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
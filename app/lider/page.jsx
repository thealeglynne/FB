'use client';
import { useState, useEffect } from 'react';

const EQUIPOS = ['ALFA', 'GAMA', 'DELTA', 'SIGMA', 'LAMDA', 'OMEGA'];
const BIN_ID_CURSOS = '682f27e08960c979a59f5afe';
const BIN_ID_TAREAS = '682f89858a456b7966a3e42c';
const API_KEY_ACCESS = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

// Componente Toast para notificaciones
function Toast({ show, message, type = "info", onClose }) {
  if (!show) return null;

  let color = "bg-green-600";
  if (type === "error") color = "bg-red-700";
  if (type === "info") color = "bg-blue-700";
  if (type === "warn") color = "bg-yellow-600 text-black";

  return (
    <div
      className={`
        fixed top-4 right-4 z-[100] min-w-[220px] max-w-xs sm:min-w-[250px] sm:max-w-xs px-3 py-3 sm:px-5 sm:py-4 rounded-2xl shadow-lg flex items-center gap-2 sm:gap-3 text-white animate-fade-in
        ${color}
      `}
      style={{ animation: "fadeIn .3s" }}
    >
      <span className="font-semibold text-xs sm:text-base">{message}</span>
      <button
        className="ml-auto text-white hover:text-black/80 transition text-xl"
        onClick={onClose}
        aria-label="Cerrar alerta"
      >
        ×
      </button>
    </div>
  );
}

// Animación para el Toast
const toastFadeIn = `
@keyframes fadeIn { from { opacity: 0; transform: translateY(-16px);} to { opacity: 1; transform: none; } }
.animate-fade-in { animation: fadeIn 0.3s; }
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
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 2500);
  };

  // Obtener y distribuir cursos automáticamente
  useEffect(() => {
    const fetchAndDistribute = async () => {
      try {
        // Obtener cursos desde JSONbin
        const resCursos = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_CURSOS}`, {
          headers: { 'X-Access-Key': API_KEY_ACCESS }
        });
        const dataCursos = await resCursos.json();
        let cursosData = Array.isArray(dataCursos.record) ? dataCursos.record : [];
        
        // Obtener tareas existentes
        const resTareas = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
          headers: { 'X-Access-Key': API_KEY_ACCESS }
        });
        const dataTareas = await resTareas.json();
        setTareas(Array.isArray(dataTareas.record) ? dataTareas.record : []);
        
        // Distribuir automáticamente los cursos no asignados
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
              c === curso ? { ...c, asignado_a: equipo } : c
            );
            equipoIndex++;
          });
        }
        
        setCursos(cursosData);
        showToast('Datos cargados correctamente', 'info');
      } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar los datos', 'error');
      } finally {
        setCargando(false);
      }
    };

    fetchAndDistribute();
  }, []);

  // Obtener los cursos del equipo seleccionado
  const cursosDelEquipo = equipoSeleccionado 
    ? cursos.filter(c => c.asignado_a === equipoSeleccionado)
    : [];

  // Obtener las tareas del equipo seleccionado
  const tareasDelEquipo = equipoSeleccionado 
    ? tareas.filter(t => t.Equipo === equipoSeleccionado)
    : [];

  // Generar ID secuencial
  const generarIdSecuencial = () => {
    const maxId = tareasDelEquipo.reduce((max, tarea) => {
      const id = parseInt(tarea.ID_Granulo) || 0;
      return id > max ? id : max;
    }, 0);
    return (maxId + 1).toString();
  };

  // Manejar el envío de nueva tarea
  const handleSubmitTarea = async (e) => {
    e.preventDefault();
    try {
      const materiaActual = materiaSeleccionada || cursosDelEquipo[0];
      
      if (!materiaActual) {
        showToast('No hay materias disponibles para asignar tareas', 'error');
        return;
      }

      const tareaCompleta = {
        ...nuevaTarea,
        Equipo: equipoSeleccionado,
        Materia: materiaActual['Nombre del Programa'],
        ID_Granulo: nuevaTarea.ID_Granulo || generarIdSecuencial(),
        Fecha_Asignacion: nuevaTarea.Fecha_Asignacion
      };
      
      const nuevasTareas = [...tareas, tareaCompleta];
      setTareas(nuevasTareas);
      
      // Actualizar el JSONbin
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': API_KEY_ACCESS
        },
        body: JSON.stringify(nuevasTareas)
      });
      
      showToast('Tarea guardada correctamente', 'success');
      setMostrarFormulario(false);
      setNuevaTarea({
        Analista: '',
        Auxiliar: '',
        Equipo: '',
        Materia: '',
        ID_Granulo: '',
        Observaciones: '',
        Fecha_Asignacion: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      showToast('Error al guardar la tarea', 'error');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Cargando y distribuyendo materias automáticamente...</p>
        </div>
      </div>
    );
  }

  // Vista inicial (selección de equipo)
  if (!equipoSeleccionado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <style>{toastFadeIn}</style>
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
        
        <div className="bg-gray-900 p-8 rounded-2xl shadow-md max-w-md w-full border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Sistema de Gestión de Tareas por Equipo
          </h1>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Selecciona tu equipo:
            </label>
            <div className="relative">
              <select
                onChange={(e) => setEquipoSeleccionado(e.target.value)}
                className="w-full p-3 border border-gray-700 rounded-md bg-gray-800 text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
              >
                <option value="">-- Selecciona un equipo --</option>
                {EQUIPOS.map(equipo => (
                  <option key={equipo} value={equipo}>{equipo}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista cuando se ha seleccionado un equipo
  return (
    <div className="min-h-screen bg-black p-4 sm:p-8 text-white">
      <style>{toastFadeIn}</style>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header con selector de equipo */}
        <div className="bg-gray-900 rounded-2xl shadow-md p-4 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Panel del equipo: 
              <span className="ml-2 bg-blue-900 text-blue-100 px-3 py-1 rounded-full text-sm sm:text-base">
                {equipoSeleccionado}
              </span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {cursosDelEquipo.length} cursos asignados | {tareasDelEquipo.length} tareas registradas
            </p>
          </div>
          
          <div className="relative mt-2 sm:mt-0">
            <select
              value={equipoSeleccionado}
              onChange={(e) => setEquipoSeleccionado(e.target.value)}
              className="p-2 border border-gray-700 rounded-md bg-gray-800 text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
            >
              {EQUIPOS.map(equipo => (
                <option key={equipo} value={equipo}>{equipo}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Cursos asignados al equipo */}
        <div className="bg-gray-900 rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Cursos asignados</h2>
            <button 
              onClick={() => {
                setMateriaSeleccionada(cursosDelEquipo.length > 0 ? cursosDelEquipo[0] : null);
                setMostrarFormulario(true);
              }}
              className={`
                bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl transition border border-gray-700
                ${cursosDelEquipo.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}
              `}
              disabled={cursosDelEquipo.length === 0}
            >
              Nueva Tarea
            </button>
          </div>
          
          {cursosDelEquipo.length > 0 ? (
            <div className="overflow-x-auto border border-gray-800 rounded-2xl">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">Programa</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">Escuela</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {cursosDelEquipo.map((curso, index) => (
                    <tr key={index} className="hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-white">
                        {curso['Nombre del Programa']}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {curso['Escuela']}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setMateriaSeleccionada(curso);
                            setMostrarFormulario(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
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
            <p className="text-gray-400">No hay cursos asignados a este equipo.</p>
          )}
        </div>

        {/* Formulario para asignar nueva tarea */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  {materiaSeleccionada ? 
                    `Asignar Tarea: ${materiaSeleccionada['Nombre del Programa']}` : 
                    cursosDelEquipo.length > 0 ? 
                    `Asignar Tarea: ${cursosDelEquipo[0]['Nombre del Programa']}` : 
                    'Nueva Tarea'}
                </h2>
                <button 
                  onClick={() => setMostrarFormulario(false)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitTarea} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Analista *</label>
                  <input
                    type="text"
                    value={nuevaTarea.Analista}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, Analista: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Auxiliar *</label>
                  <input
                    type="text"
                    value={nuevaTarea.Auxiliar}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, Auxiliar: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">ID Granulo</label>
                  <input
                    type="text"
                    value={nuevaTarea.ID_Granulo || generarIdSecuencial()}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, ID_Granulo: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Observaciones</label>
                  <textarea
                    value={nuevaTarea.Observaciones}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, Observaciones: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de Asignación</label>
                  <input
                    type="date"
                    value={nuevaTarea.Fecha_Asignacion}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, Fecha_Asignacion: e.target.value})}
                    className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-2 border border-gray-700 rounded-md text-white hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Guardar Tarea
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tareas registradas por el equipo */}
        <div className="bg-gray-900 rounded-2xl shadow-md p-4 sm:p-6 border border-gray-800">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Tareas Registradas</h2>
          
          {tareasDelEquipo.length > 0 ? (
            <div className="overflow-x-auto border border-gray-800 rounded-2xl">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">Materia</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">Analista</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">Auxiliar</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">ID Granulo</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {tareasDelEquipo.map((tarea, index) => (
                    <tr key={index} className="hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-white">
                        {tarea.Materia}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {tarea.Analista}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {tarea.Auxiliar}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {tarea.ID_Granulo}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
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
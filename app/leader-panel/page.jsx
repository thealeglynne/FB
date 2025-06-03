'use client';
import { useState, useEffect, useRef } from 'react';
import ChartsPanel from './components/ChartsPane';
import NewUser from '../components/newUser/usuarioNuevo';
import GenerarContenido from '../components/generadoporia/CrearContenidoPopup'

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
const toastFadeIn = `
@keyframes fadeIn { from { opacity: 0; transform: translateY(-16px);} to { opacity: 1; transform: none; } }
.animate-fade-in { animation: fadeIn 0.3s; }
`;

const campos = [
  'Escuela',
  'Nombre del Programa',
  'Nivel de Estudios',
  'Trámite',
  'Modalidad',
  'Fecha de Radicación',
  'Fecha de Visita de padres',
  'Semestre',
  '# Asignaturas',
  'Entrega del plan de estudios a Fábrica de contenidos',
  'Entrega del plan de Virtualización',
  'Entrega Contenidos',
  '1ra Entrega Virtualización',
  'Estado 1ra entrega',
  'Revisión Check List',
  'Entrega Ajustes',
  'Ejecución Ajustes',
  'Ajustes Asesor',
  'Entrega Final Ajustes',
  'Estado Fabrica'
];
const initialForm = campos.reduce((acc, k) => ({ ...acc, [k]: '' }), {});

export default function LeaderPanel() {
  const [form, setForm] = useState({ ...initialForm });
  const [tareas, setTareas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const toastTimeout = useRef(null);

  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroEscuela, setFiltroEscuela] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Estado para mostrar el modal de generación
  const [showGenerar, setShowGenerar] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ show: false, message: '', type }), 2500);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormValid = (data) => {
    return (
      data['Escuela'].trim() !== '' &&
      data['Nombre del Programa'].trim() !== '' &&
      data['Semestre'].toString().trim() !== ''
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid(form)) {
      const errorAudio = new Audio('/eliminar.wav');
      errorAudio.play();
      showToast('Por favor, completa los campos requeridos.', 'error');
      return;
    }
    const successAudio = new Audio('/click.wav');
    successAudio.play();

    const res = await fetch('/api/tareas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    showToast(result.message, 'success');
    setForm({ ...initialForm });
    setShowForm(false);
    fetchTareas();
  };

  // Manejar eliminación de tarea
  const handleDelete = async (idxFiltrado) => {
    const tareaFiltrada = tareasFiltradas[idxFiltrado];
    const idxOriginal = tareas.findIndex(
      t => campos.every(campo => t[campo] === tareaFiltrada[campo])
    );
    if (idxOriginal === -1) {
      showToast("No se pudo encontrar la tarea en la base de datos.", "error");
      return;
    }
    try {
      const res = await fetch('/api/tareas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: idxOriginal }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Tarea eliminada correctamente", "success");
        fetchTareas();
      } else {
        showToast(result.message || "Error al eliminar la tarea", "error");
      }
    } catch (err) {
      showToast("Error al eliminar: " + err.message, "error");
    }
  };

  const fetchTareas = async () => {
    const res = await fetch('/api/tareas');
    const data = await res.json();
    setTareas(data);
  };

  useEffect(() => {
    fetchTareas();
    return () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); };
  }, []);

  const tareasFiltradas = tareas.filter(tarea => {
    const byEscuela = filtroEscuela ? tarea['Escuela'] === filtroEscuela : true;
    const byPrograma = filtroPrograma ? tarea['Nombre del Programa'].toLowerCase().includes(filtroPrograma.toLowerCase()) : true;
    const byFecha = filtroFecha ? tarea['Fecha de Radicación'] === filtroFecha : true;
    return byEscuela && byPrograma && byFecha;
  }).reverse();

  const escuelasUnicas = Array.from(new Set(tareas.map(t => t['Escuela'] || '').filter(Boolean)));

  return (
    <div className="px-2 py-4 sm:p-8 w-full space-y-8 sm:space-y-12 bg-black min-h-screen text-white">
      <style>{toastFadeIn}</style>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
     <NewUser />
      {/* Botones de acción */}
      {!showForm && (
        <div className="flex flex-col sm:flex-row justify-center my-4 gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="btn-glow bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 sm:px-6 py-2 rounded-xl transition border border-gray-700 w-[150px] sm:w-[200px] md:w-[250px] lg:w-[161px]"
          >
            Crear materia
          </button>
          <button
            onClick={() => setShowGenerar(true)}
            className="bg-blue-700 text-white px-6 py-2 rounded font-semibold"
          >
            Generar contenido de la materia
          </button>
          <style>{`
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
          `}</style>
        </div>
      )}

{showGenerar && (
  <GenerarContenido onClose={() => setShowGenerar(false)} />
)}


      {/* Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
          <div className="bg-gray-900 p-4 sm:p-8 rounded-2xl shadow-2xl w-full max-w-[98vw] sm:w-[85vw] max-w-3xl sm:max-w-[1600px] relative">
            <button
              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-2xl font-bold"
              onClick={() => setShowForm(false)}
              aria-label="Cerrar"
              type="button"
            >
              ×
            </button>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto"
            >
              {campos.map(field => (
                <div key={field} className="col-span-1">
                  <label htmlFor={field} className="block mb-1 font-medium text-gray-300 text-xs sm:text-sm">{field}</label>
                  <input
                    id={field}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="w-full border border-gray-700 p-2 rounded bg-black text-white text-xs sm:text-base"
                    placeholder={field}
                    type={field.toLowerCase().includes('fecha') ? "date" : "text"}
                  />
                </div>
              ))}
              <button
                type="submit"
                className="col-span-1 sm:col-span-2 lg:col-span-3 bg-green-700 text-white py-2 rounded hover:bg-green-800 transition-colors duration-200 border border-gray-700 font-semibold"
              >
                Registrar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 mt-2 items-center w-full">
        <div className="flex items-center gap-2 w-full sm:max-w-none max-w-[350px]">
          <label className="text-white text-xs sm:text-base">Escuela:</label>
          <div className="relative w-full">
            <select
              value={filtroEscuela}
              onChange={e => setFiltroEscuela(e.target.value)}
              className="appearance-none w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs sm:text-base pr-6"
            >
              <option value="">Todas</option>
              {escuelasUnicas.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              ▼
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:max-w-none max-w-[350px]">
          <label className="text-white text-xs sm:text-base">Programa:</label>
          <input
            type="text"
            value={filtroPrograma}
            onChange={e => setFiltroPrograma(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white placeholder-gray-400 text-xs sm:text-base w-full"
            placeholder="Filtrar por programa"
          />
        </div>
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => { setFiltroEscuela(''); setFiltroPrograma(''); setFiltroFecha(''); }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-xs sm:text-base w-300px"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Tabla Cronograma */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 mb-6 max-w-full max-h-[80vh] overflow-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">
          Cronograma registrado
        </h2>
        {tareasFiltradas.length === 0 ? (
          <p className="text-gray-400">No hay cronogramas registrados.</p>
        ) : (
          <table className="min-w-max w-full text-sm border-separate border-spacing-0">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                {campos.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900">
              {tareasFiltradas.map((tarea, idx) => (
                <tr key={idx} className="hover:bg-gray-800 transition group">
                  {campos.map((key) => (
                    <td
                      key={key}
                      className={`px-4 py-3 whitespace-nowrap ${
                        key === campos[0]
                          ? 'font-medium text-white border-b border-gray-800'
                          : 'text-gray-400 border-b border-gray-800'
                      }`}
                    >
                      {tarea[key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 border-b border-gray-800">
                    <button
                      onClick={() => handleDelete(idx)}
                      className="bg-red-700 hover:bg-red-900 text-white px-3 py-1 rounded transition-colors duration-150 font-semibold text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Gráficos dinámicos con Chart.js */}
      <ChartsPanel data={tareas} />
    </div>
  );
}

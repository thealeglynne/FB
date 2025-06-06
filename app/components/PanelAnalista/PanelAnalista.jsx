'use client';
import { useEffect, useState } from "react";

// Ajusta este nombre en producción con sesión/login del analista
const nombreAnalista = "DAISSY YURANI ARDILA PRIETO";

const BIN_ID_TAREAS = 'T683473998561e97a501bb4f1';
const API_KEY = '$2a$10$CWeZ66JKpedXMgIy/CDyYeEoH18x8tgxZDNBGDeHRSAusOVtHrwce';

const estadosActividad = ["Pendiente", "En progreso", "Terminado"];

export default function PanelAnalista() {
  const [tareas, setTareas] = useState([]);
  const [editando, setEditando] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // --- Cargar tareas solo del analista actual ---
  useEffect(() => {
    setCargando(true);
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}/latest`, {
      headers: { 'X-Access-Key': API_KEY }
    })
      .then(res => res.json())
      .then(res => {
        let data = Array.isArray(res.record) ? res.record : (res.record ? [res.record] : []);
        setTareas(data.filter(t => t.Analista === nombreAnalista));
      })
      .finally(() => setCargando(false));
  }, []);

  // --- Helpers para actualizar estado ---
  const handleEdit = (materiaIdx, granuloIdx, actIdx, campo, valor) => {
    setTareas(prev => {
      const nuevo = JSON.parse(JSON.stringify(prev));
      nuevo[materiaIdx].Gránulos[granuloIdx].Actividades[actIdx][campo] = valor;
      // Si cambia Estado a "En progreso" o "Terminado", gestiona fechas:
      if (campo === "Estado") {
        if (valor === "En progreso" && !nuevo[materiaIdx].Gránulos[granuloIdx].Actividades[actIdx].Fecha_Inicio) {
          nuevo[materiaIdx].Gránulos[granuloIdx].Actividades[actIdx].Fecha_Inicio = new Date().toISOString().slice(0,16);
        }
        if (valor === "Terminado" && !nuevo[materiaIdx].Gránulos[granuloIdx].Actividades[actIdx].Fecha_Fin) {
          nuevo[materiaIdx].Gránulos[granuloIdx].Actividades[actIdx].Fecha_Fin = new Date().toISOString().slice(0,16);
        }
      }
      return nuevo;
    });
    setEditando({ materiaIdx, granuloIdx, actIdx });
  };

  // --- Guardar cambios en Bin ---
  const guardarCambios = async () => {
    setGuardando(true);
    let todasTareas = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}/latest`, {
      headers: { 'X-Access-Key': API_KEY }
    }).then(r => r.json());
    let data = Array.isArray(todasTareas.record) ? todasTareas.record : (todasTareas.record ? [todasTareas.record] : []);
    // Actualiza SOLO las tareas del analista, deja el resto igual
    const otrasTareas = data.filter(t => t.Analista !== nombreAnalista);
    const nuevasTareas = [...otrasTareas, ...tareas];
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': API_KEY,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify(nuevasTareas)
    });
    setGuardando(false);
    setToast({ show: true, message: "¡Cambios guardados correctamente!", type: "success" });
    setTimeout(() => setToast({ show: false, message: "" }), 2500);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-950 to-blue-950 text-white py-6 px-2">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black mb-5 text-blue-400">Panel del Analista</h1>
        <div className="bg-blue-950/80 border border-blue-800 rounded-xl shadow-xl p-4 mb-5">
          <b className="text-lg text-blue-200">Analista: </b> <span>{nombreAnalista}</span>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-400 border-b-4 border-violet-500 mr-4" />
            <span className="text-blue-200 text-lg">Cargando tareas...</span>
          </div>
        ) : tareas.length === 0 ? (
          <div className="p-6 text-center text-lg text-yellow-400">
            No tienes materias asignadas actualmente.
          </div>
        ) : (
          tareas.map((mat, materiaIdx) => (
            <div key={materiaIdx} className="mb-10 bg-gradient-to-tr from-gray-900 to-gray-800/70 border border-blue-900 rounded-xl shadow-lg">
              <div className="p-4 border-b border-blue-900 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg sm:text-xl font-bold text-blue-200">{mat.Materia}</div>
                  <div className="text-xs text-blue-300">{mat.Escuela}</div>
                </div>
                <div className="mt-2 md:mt-0 text-xs text-gray-400">
                  <b>Fecha asignación:</b> {mat.Fecha_Asignacion || '-'}
                </div>
              </div>
              {/* Gránulos */}
              <div className="overflow-x-auto p-3">
                {mat.Gránulos.map((g, granuloIdx) => (
                  <div key={granuloIdx} className="mb-8">
                    <div className="font-semibold text-blue-400 mb-2">{g.Nombre_Granulo}</div>
                    <table className="w-full min-w-[800px] text-xs sm:text-sm border-separate border-spacing-0 shadow rounded-2xl overflow-hidden">
                      <thead className="bg-blue-900/80 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 text-blue-200">Actividad</th>
                          <th className="px-2 py-2 text-blue-200">Estado</th>
                          <th className="px-2 py-2 text-blue-200">Tiempo Ideal</th>
                          <th className="px-2 py-2 text-blue-200">Tiempo Real (min)</th>
                          <th className="px-2 py-2 text-blue-200">Fecha Inicio</th>
                          <th className="px-2 py-2 text-blue-200">Fecha Fin</th>
                          <th className="px-2 py-2 text-blue-200">Observaciones</th>
                          <th className="px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.Actividades.map((act, actIdx) => {
                          const isEditing = editando.materiaIdx === materiaIdx && editando.granuloIdx === granuloIdx && editando.actIdx === actIdx;
                          return (
                            <tr key={actIdx} className="bg-gray-950/90 border-b border-blue-900 hover:bg-blue-950/60 transition">
                              {/* Actividad */}
                              <td className="px-2 py-1 font-semibold text-blue-300">{act.Tipo}</td>
                              {/* Estado */}
                              <td className="px-2 py-1">
                                <select
                                  className={`rounded-lg px-1 py-1 text-xs bg-blue-900 border border-blue-700 text-blue-100 outline-none
                                    ${act.Estado === "Terminado" ? "bg-green-900 text-green-200" : act.Estado === "En progreso" ? "bg-yellow-900 text-yellow-200" : ""}
                                  `}
                                  value={act.Estado}
                                  onChange={e => handleEdit(materiaIdx, granuloIdx, actIdx, "Estado", e.target.value)}
                                >
                                  {estadosActividad.map(est => <option key={est} value={est}>{est}</option>)}
                                </select>
                              </td>
                              {/* Tiempo Ideal */}
                              <td className="px-2 py-1 text-cyan-300 text-center">{act.Tiempo_Ideal_Min}</td>
                              {/* Tiempo Real */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="1"
                                  className="w-16 rounded bg-gray-900 border border-blue-700 text-blue-100 px-1 py-1"
                                  value={act.Tiempo_Real_Min || ""}
                                  placeholder="min"
                                  onChange={e => handleEdit(materiaIdx, granuloIdx, actIdx, "Tiempo_Real_Min", e.target.value)}
                                />
                              </td>
                              {/* Fecha Inicio */}
                              <td className="px-2 py-1">
                                <input
                                  type="datetime-local"
                                  className="rounded bg-gray-900 border border-blue-700 text-blue-100 px-1 py-1"
                                  value={act.Fecha_Inicio || ""}
                                  onChange={e => handleEdit(materiaIdx, granuloIdx, actIdx, "Fecha_Inicio", e.target.value)}
                                />
                              </td>
                              {/* Fecha Fin */}
                              <td className="px-2 py-1">
                                <input
                                  type="datetime-local"
                                  className="rounded bg-gray-900 border border-blue-700 text-blue-100 px-1 py-1"
                                  value={act.Fecha_Fin || ""}
                                  onChange={e => handleEdit(materiaIdx, granuloIdx, actIdx, "Fecha_Fin", e.target.value)}
                                />
                              </td>
                              {/* Observaciones */}
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  className="w-28 rounded bg-gray-900 border border-blue-700 text-blue-100 px-1 py-1"
                                  value={act.Observaciones || ""}
                                  placeholder="Observaciones"
                                  onChange={e => handleEdit(materiaIdx, granuloIdx, actIdx, "Observaciones", e.target.value)}
                                />
                              </td>
                              {/* Guardar */}
                              <td className="px-2 py-1 text-center">
                                {isEditing && (
                                  <button
                                    className={`bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-1 rounded-xl shadow transition disabled:opacity-60`}
                                    disabled={guardando}
                                    onClick={guardarCambios}
                                    title="Guardar cambios"
                                  >
                                    {guardando ? "..." : "💾"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Toast de guardado */}
        {toast.show && (
          <div className={`fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl text-white font-semibold shadow-lg bg-green-700`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState, useRef } from "react";

// ---------------------
// Toast visual
// ---------------------
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

// -------- Configuración JSONBin ---------
const BIN_ID = "683473998561e97a501bb4f1";
const API_KEY = "$2a$10$AFjAT/OLBCOFkqO83WSIbO9w31.wq.9YRPvSPZoz4xizM66bT3t6S";
const headers = { "Content-Type": "application/json", "X-Master-Key": API_KEY };

// ----------- Actividades (tabla) ------------
const ActividadesTable = ({
  actividades,
  onIniciar,
  onTerminar,
  granuloIdx,
  tareaEditable,
}) => (
  <div className="overflow-x-auto rounded-lg">
    <table className="min-w-max w-full text-xs bg-gray-900 text-white rounded-lg border border-gray-800 mb-2">
      <thead className="bg-gray-800 sticky top-0 z-10">
        <tr>
          <th className="px-3 py-2 text-cyan-400">Tipo</th>
          <th className="px-3 py-2 text-cyan-400">Ideal (min)</th>
          <th className="px-3 py-2 text-cyan-400">Real (min)</th>
          <th className="px-3 py-2 text-cyan-400">Inicio</th>
          <th className="px-3 py-2 text-cyan-400">Fin</th>
          <th className="px-3 py-2 text-cyan-400">Estado</th>
          <th className="px-3 py-2 text-cyan-400">Acción</th>
        </tr>
      </thead>
      <tbody className="bg-gray-900">
        {actividades.map((a, idx) => (
          <tr key={idx} className="hover:bg-gray-800 transition">
            <td className="px-3 py-2 text-white">{a.Tipo}</td>
            <td className="px-3 py-2 text-yellow-300">{a.Tiempo_Ideal_Min}</td>
            <td className="px-3 py-2 text-yellow-300">{a.Tiempo_Real_Min !== undefined && a.Tiempo_Real_Min !== "" ? a.Tiempo_Real_Min : "-"}</td>
            <td className="px-3 py-2 text-cyan-200">{a.Fecha_Inicio || '-'}</td>
            <td className="px-3 py-2 text-cyan-200">{a.Fecha_Fin || '-'}</td>
            <td className={`px-3 py-2 font-bold text-center rounded-lg ${
              a.Estado === 'Terminado'
                ? 'bg-green-700 text-white'
                : a.Estado === 'En progreso'
                ? 'bg-yellow-600 text-black'
                : 'bg-gray-800 text-gray-200'
            }`}>
              {a.Estado || "Pendiente"}
            </td>
            <td className="px-3 py-2">
              {tareaEditable && (
                <div className="flex gap-2">
                  <button
                    disabled={a.Estado === "En progreso" || a.Estado === "Terminado"}
                    onClick={() => onIniciar(granuloIdx, idx)}
                    className={`px-2 py-1 rounded transition font-bold text-xs
                      ${a.Estado === "En progreso" || a.Estado === "Terminado"
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-cyan-700 hover:bg-cyan-900 text-white"
                      }`}
                  >
                    Iniciar
                  </button>
                  <button
                    disabled={a.Estado === "Pendiente" || a.Estado === "Terminado"}
                    onClick={() => onTerminar(granuloIdx, idx)}
                    className={`px-2 py-1 rounded transition font-bold text-xs
                      ${a.Estado === "Pendiente" || a.Estado === "Terminado"
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-green-700 hover:bg-green-900 text-white"
                      }`}
                  >
                    Terminar
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ----------- Gránulos (tabla) -------------
const GranulosTable = ({
  granulos,
  onIniciarActividad,
  onTerminarActividad,
  tareaEditable,
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-max w-full text-xs bg-blue-950 text-blue-100 rounded-lg border border-gray-700 mb-2">
      <thead className="bg-blue-900 sticky top-0 z-10">
        <tr>
          <th className="px-3 py-2 text-cyan-400">ID</th>
          <th className="px-3 py-2 text-cyan-400">Nombre</th>
          <th className="px-3 py-2 text-cyan-400">Actividades</th>
        </tr>
      </thead>
      <tbody>
        {granulos.map((g, idx) => (
          <tr key={idx} className="align-top hover:bg-blue-900 transition">
            <td className="px-3 py-2">{g.ID_Granulo}</td>
            <td className="px-3 py-2 font-bold text-cyan-200">{g.Nombre_Granulo}</td>
            <td className="px-3 py-2">
              <ActividadesTable
                actividades={g.Actividades || []}
                onIniciar={onIniciarActividad}
                onTerminar={onTerminarActividad}
                granuloIdx={idx}
                tareaEditable={tareaEditable}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ----------- Componente principal ------------
const JsonBinCRUD = ({ nombreAnalista }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const toastTimeout = useRef(null);

  // Toast helpers
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ show: false, message: '', type }), 2500);
  };

  // Cargar datos del bin
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
        { headers }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      setData(Array.isArray(json.record) ? json.record : []);
    } catch (err) {
      showToast("Error cargando datos: " + err.message, "error");
      console.error("ERROR EN FETCH:", err);
    }
    setLoading(false);
  };

  // Recarga manual
  const recargar = async () => {
    setRecargando(true);
    await fetchData();
    setRecargando(false);
  };

  // Filtrar solo las tareas del analista
  useEffect(() => {
    if (!nombreAnalista) {
      setFilteredData([]);
      return;
    }
    setFilteredData(
      data.filter(
        (row) =>
          row.Analista?.toLowerCase().trim() === nombreAnalista.toLowerCase().trim()
      )
    );
  }, [data, nombreAnalista]);

  useEffect(() => {
    fetchData();
    return () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); };
  }, []);

  // Iniciar actividad
  const handleIniciarActividad = async (granuloIdx, actIdx, tareaIdx) => {
    const originalIndex = data.findIndex((item) => item === filteredData[tareaIdx]);
    const updatedData = data.map((item, idx) => {
      if (idx !== originalIndex) return item;
      const newItem = { ...item };
      newItem.Gránulos = newItem.Gránulos.map((gran, gIdx) => {
        if (gIdx !== granuloIdx) return gran;
        return {
          ...gran,
          Actividades: gran.Actividades.map((act, aIdx) => {
            if (aIdx !== actIdx) return act;
            return {
              ...act,
              Estado: "En progreso",
              Fecha_Inicio: new Date().toISOString(),
            };
          }),
        };
      });
      return newItem;
    });
    await updateBin(updatedData);
  };

  // Terminar actividad (guarda tiempo real min)
  const handleTerminarActividad = async (granuloIdx, actIdx, tareaIdx) => {
    const originalIndex = data.findIndex((item) => item === filteredData[tareaIdx]);
    const updatedData = data.map((item, idx) => {
      if (idx !== originalIndex) return item;
      const newItem = { ...item };
      newItem.Gránulos = newItem.Gránulos.map((gran, gIdx) => {
        if (gIdx !== granuloIdx) return gran;
        return {
          ...gran,
          Actividades: gran.Actividades.map((act, aIdx) => {
            if (aIdx !== actIdx) return act;
            let tiempoReal = "";
            if (act.Fecha_Inicio) {
              const inicio = new Date(act.Fecha_Inicio);
              const fin = new Date();
              tiempoReal = Math.round((fin - inicio) / 60000); // en minutos
            }
            return {
              ...act,
              Estado: "Terminado",
              Fecha_Fin: new Date().toISOString(),
              Tiempo_Real_Min: tiempoReal,
            };
          }),
        };
      });
      return newItem;
    });
    await updateBin(updatedData);
  };

  // Actualizar bin
  const updateBin = async (newData) => {
    setLoading(true);
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(newData),
      });
      await fetchData();
      showToast("Datos actualizados correctamente", "success");
    } catch (err) {
      showToast("Error actualizando datos: " + err.message, "error");
      console.error("ERROR AL ACTUALIZAR:", err);
    }
    setLoading(false);
  };

  // ---- Renderizado principal ----
  return (
    <div className="max-w-6xl mx-auto mt-6">
      <style>{toastFadeIn}</style>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      <div className="rounded-2xl border border-blue-800 bg-gradient-to-tr from-gray-950 to-blue-950 shadow-lg p-6 space-y-2 sm:space-y-4">
        {/* BOTÓN DE ACTUALIZAR */}
        <div className="w-full flex items-center justify-end mb-2">
          <button
            className="bg-cyan-700 hover:bg-cyan-900 text-white font-bold py-2 px-4 rounded-xl transition"
            onClick={recargar}
            disabled={loading || recargando}
          >
            {recargando || loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <h1 className="text-2xl font-black mb-4 text-cyan-400">Tus tareas asignadas</h1>
        {/* -------- TABLA 1: Info General --------- */}
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-bold">
            No tienes tareas asignadas.
          </div>
        ) : (
          filteredData.map((row, i) => (
            <div key={i} className="mb-8">
              <div className="overflow-x-auto rounded-lg mb-2">
                <table className="min-w-max w-full bg-gray-900 text-blue-100 border border-gray-800 rounded-xl">
                  <thead className="bg-blue-950 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-cyan-400">Analista</th>
                      <th className="px-3 py-2 text-cyan-400">Equipo</th>
                      <th className="px-3 py-2 text-cyan-400">Materia</th>
                      <th className="px-3 py-2 text-cyan-400">Escuela</th>
                      <th className="px-3 py-2 text-cyan-400">Fecha Asignación</th>
                      <th className="px-3 py-2 text-cyan-400">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2">{row.Analista}</td>
                      <td className="px-3 py-2">{row.Equipo}</td>
                      <td className="px-3 py-2">{row.Materia}</td>
                      <td className="px-3 py-2">{row.Escuela}</td>
                      <td className="px-3 py-2">{row.Fecha_Asignacion}</td>
                      <td className="px-3 py-2">{row.Observaciones}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* -------- TABLA 2: Gránulos y actividades --------- */}
              <GranulosTable
                granulos={row.Gránulos}
                tareaEditable={true}
                onIniciarActividad={(gIdx, aIdx) => handleIniciarActividad(gIdx, aIdx, i)}
                onTerminarActividad={(gIdx, aIdx) => handleTerminarActividad(gIdx, aIdx, i)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JsonBinCRUD;

"use client";
import React, { useEffect, useState, useRef } from "react";

// Toast visual
function Toast({ show, message, type = "info", onClose }) {
  if (!show) return null;
  let color = "bg-green-600";
  if (type === "error") color = "bg-red-700";
  if (type === "info") color = "bg-gray-800";
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

const BIN_ID = "683473998561e97a501bb4f1";
const API_KEY = "$2a$10$AFjAT/OLBCOFkqO83WSIbO9w31.wq.9YRPvSPZoz4xizM66bT3t6S";
const headers = { "Content-Type": "application/json", "X-Master-Key": API_KEY };

const ActividadesTable = ({
  actividades,
  onIniciar,
  onTerminar,
  granuloIdx,
  tareaEditable,
}) => (
  // *** Cambia el contenedor de la tabla para tener scroll interno y altura máxima
  <div className="w-full max-h-[45vh] overflow-y-auto overflow-x-auto rounded-lg border border-gray-700 mb-2 bg-gray-900">
    <table className="w-full text-xs bg-gray-900 text-slate-200 rounded-lg">
      <thead className="bg-gray-800 sticky top-0 z-10">
        <tr>
          <th className="px-3 py-2 text-slate-200">Tipo</th>
          <th className="px-3 py-2 text-slate-200">Ideal (min)</th>
          <th className="px-3 py-2 text-slate-200">Real (min)</th>
          <th className="px-3 py-2 text-slate-200">Inicio</th>
          <th className="px-3 py-2 text-slate-200">Fin</th>
          <th className="px-3 py-2 text-slate-200">Estado</th>
          <th className="px-3 py-2 text-slate-200">Acción</th>
        </tr>
      </thead>
      <tbody className="bg-gray-900">
        {actividades.map((a, idx) => (
          <tr key={idx} className="hover:bg-gray-800 transition">
            <td className="px-3 py-2 text-slate-300">{a.Tipo}</td>
            <td className="px-3 py-2 text-slate-300">{a.Tiempo_Ideal_Min}</td>
            <td className="px-3 py-2 text-slate-300">{a.Tiempo_Real_Min !== undefined && a.Tiempo_Real_Min !== "" ? a.Tiempo_Real_Min : "-"}</td>
            <td className="px-3 py-2 text-gray-400">{a.Fecha_Inicio || '-'}</td>
            <td className="px-3 py-2 text-gray-400">{a.Fecha_Fin || '-'}</td>
            <td className={`px-3 py-2 font-bold text-center rounded-lg ${
              a.Estado === 'Terminado'
                ? 'bg-green-900 text-slate-200'
                : a.Estado === 'En progreso'
                ? 'bg-yellow-900 text-slate-200'
                : 'bg-gray-800 text-gray-400'
            }`}>
              {a.Estado || "Pendiente"}
            </td>
            <td className="px-3 py-2">
              {tareaEditable && (
                <div className="flex gap-2 justify-center">
                  <button
                    disabled={a.Estado === "En progreso" || a.Estado === "Terminado"}
                    onClick={() => onIniciar(granuloIdx, idx)}
                    className={`px-2 py-1 rounded transition font-bold text-xs
                      ${a.Estado === "En progreso" || a.Estado === "Terminado"
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 hover:bg-gray-800 text-slate-200"
                      }`}
                  >
                    Iniciar
                  </button>
                  <button
                    disabled={a.Estado === "Pendiente" || a.Estado === "Terminado"}
                    onClick={() => onTerminar(granuloIdx, idx)}
                    className={`px-2 py-1 rounded transition font-bold text-xs
                      ${a.Estado === "Pendiente" || a.Estado === "Terminado"
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-green-900 hover:bg-green-950 text-slate-200"
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

const GranulosTable = ({
  granulos,
  onIniciarActividad,
  onTerminarActividad,
  tareaEditable,
}) => (
  // También puedes ponerle scroll a la tabla de gránulos si tienes muchas
  <div className="w-full">
    <div className="w-full max-h-[30vh] overflow-y-auto overflow-x-auto rounded-lg border border-gray-700 mb-2 bg-gray-900">
      <table className="w-full text-xs bg-gray-900 text-slate-200 rounded-lg">
        <thead className="bg-gray-800 sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2 text-slate-200">ID</th>
            <th className="px-3 py-2 text-slate-200">Nombre</th>
            <th className="px-3 py-2 text-slate-200">Actividades</th>
          </tr>
        </thead>
        <tbody>
          {granulos.map((g, idx) => (
            <tr key={idx} className="align-top hover:bg-gray-800 transition">
              <td className="px-3 py-2">{g.ID_Granulo}</td>
              <td className="px-3 py-2 font-bold text-slate-300">{g.Nombre_Granulo}</td>
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
  </div>
);

const JsonBinCRUD = ({ nombreAnalista }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const toastTimeout = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ show: false, message: '', type }), 2500);
  };

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

  const recargar = async () => {
    setRecargando(true);
    await fetchData();
    setRecargando(false);
  };

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

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-start p-0 m-0">
      <style>{toastFadeIn}</style>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      <div className="w-full max-w-6xl flex-1 rounded-2xl border border-gray-700 bg-gray-900 shadow-lg p-2 sm:p-6 mt-6">
        <div className="w-full flex items-center justify-end mb-2">
          <button
            className="bg-gray-700 hover:bg-gray-800 text-slate-200 font-bold py-2 px-4 rounded-xl transition"
            onClick={recargar}
            disabled={loading || recargando}
          >
            {recargando || loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <h1 className="text-2xl font-black mb-4 text-slate-200 text-center">Tus tareas asignadas</h1>
        {/* Tabla principal con altura 80vh y scroll */}
        <div className="w-full max-h-[80vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-2">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-bold">
              No tienes tareas asignadas.
            </div>
          ) : (
            filteredData.map((row, i) => (
              <div key={i} className="mb-8 w-full">
                <div className="w-full overflow-x-auto rounded-lg mb-2">
                  <table className="w-full bg-gray-900 text-slate-200 border border-gray-700 rounded-xl">
                    <thead className="bg-gray-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-slate-200">Analista</th>
                        <th className="px-3 py-2 text-slate-200">Equipo</th>
                        <th className="px-3 py-2 text-slate-200">Materia</th>
                        <th className="px-3 py-2 text-slate-200">Escuela</th>
                        <th className="px-3 py-2 text-slate-200">Fecha Asignación</th>
                        <th className="px-3 py-2 text-slate-200">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2">{row.Analista}</td>
                        <td className="px-3 py-2">{row.Equipo}</td>
                        <td className="px-3 py-2">{row.Materia}</td>
                        <td className="px-3 py-2">{row.Escuela}</td>
                        <td className="px-3 py-2 text-gray-300">{row.Fecha_Asignacion}</td>
                        <td className="px-3 py-2 text-gray-400">{row.Observaciones}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
    </div>
  );
};

export default JsonBinCRUD;

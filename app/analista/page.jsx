"use client";
import { useEffect, useState, useRef } from "react";
import JsonBinCRUD from "./PanelAnalista";
import EstadoTareasPanel from '../analista/chartnalista';

// Toast visual, idéntico al del ejemplo
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

// --- PanelAnalista (igualado a la estética solicitada) ---
const BIN_ID_USUARIOS = '683358498960c979a5a0fa92';
const BIN_ID_TAREAS = '683473998561e97a501bb4f1';
const API_KEY = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

export default function PanelAnalista() {
  const [correoUsuario, setCorreoUsuario] = useState(null);
  const [nombreAnalista, setNombreAnalista] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tareasEquipo, setTareasEquipo] = useState([]);
  const [loadingTareas, setLoadingTareas] = useState(true);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const toastTimeout = useRef(null);
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ show: false, message: '', type }), 2500);
  };

  // Cargar usuario desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCorreoUsuario(localStorage.getItem("correo_usuario"));
    }
  }, []);

  // Busca SIEMPRE el nombre actualizado en el bin por correo (no username)
  useEffect(() => {
    if (!correoUsuario) {
      setCargando(false);
      setNombreAnalista(null);
      return;
    }
    setCargando(true);
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_USUARIOS}/latest`, {
      headers: { 'X-Access-Key': API_KEY }
    })
      .then(res => res.json())
      .then(res => {
        let usuarios = Array.isArray(res.record) ? res.record : (res.record ? [res.record] : []);
        let usuario = usuarios.find(
          u => u.correo === correoUsuario || u.username === correoUsuario
        );
        if (usuario?.nombreCompleto) {
          setNombreAnalista(usuario.nombreCompleto);
          if (typeof window !== "undefined") localStorage.setItem('nombre_usuario', usuario.nombreCompleto);
        } else {
          setNombreAnalista(null);
        }
      })
      .finally(() => setCargando(false));
  }, [correoUsuario]);

  // Carga tareas SOLO de este analista
  useEffect(() => {
    if (!nombreAnalista) return;
    setLoadingTareas(true);
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID_TAREAS}/latest`, {
      headers: { 'X-Access-Key': API_KEY }
    })
      .then(res => res.json())
      .then(res => {
        let tareas = Array.isArray(res.record) ? res.record : [];
        // Filtrar tareas SOLO de este analista
        const misTareas = tareas.filter(
          t => t.Analista?.toLowerCase().trim() === nombreAnalista.toLowerCase().trim()
        );
        setTareasEquipo(misTareas);
      })
      .finally(() => setLoadingTareas(false));
  }, [nombreAnalista]);

  return (
    <div className="px-2 py-4 sm:p-8 w-full space-y-8 sm:space-y-12 bg-black min-h-screen text-white">
      <style>{toastFadeIn}</style>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      {/* Tarjeta del analista */}
      <div className="w-full max-w-2xl mx-auto rounded-2xl bg-blue-950/80 border border-blue-800 shadow-xl p-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-black mb-5 text-blue-400">Panel del Analista</h1>
        {!correoUsuario && (
          <div className="p-6 text-lg text-red-400">
            No se detectó sesión de usuario. Por favor, inicia sesión.
          </div>
        )}
        {cargando ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-400 border-b-4 border-violet-500"></div>
            <span className="text-blue-200 text-lg">Cargando usuario...</span>
          </div>
        ) : !nombreAnalista ? (
          <div className="p-6 text-lg text-yellow-400">
            Usuario no encontrado en la base de usuarios.
          </div>
        ) : (
          <div>
            <div className="text-xl font-bold text-blue-200 mb-4">
              ¡Hola, {nombreAnalista}!
            </div>
            <div className="text-base text-blue-100 mb-6">Bienvenido(a) a tu panel.</div>
            {loadingTareas ? (
              <div className="text-blue-300">Cargando tus tareas...</div>
            ) : null}
          </div>
        )}
      </div>
      {/* CRUD de tareas del analista (Tarjeta oscura y tabla igualada) */}
      <div className="w-full max-w-5xl mx-auto">
        <JsonBinCRUD nombreAnalista={nombreAnalista} />
      </div>
      {/* Estado gráfico y tabla de tareas (misma caja, mismo look) */}
      <div className="w-full max-w-5xl mx-auto">
        <EstadoTareasPanel tareasEquipo={tareasEquipo} />
      </div>
    </div>
  );
}

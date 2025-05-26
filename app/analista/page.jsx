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
          t => t.Analista?.toLowerCase().trim() === nombreAnalista?.toLowerCase().trim()
        );
        setTareasEquipo(misTareas);
      })
      .finally(() => setLoadingTareas(false));
  }, [nombreAnalista]);

  return (
    <div className="w-full min-h-screen bg-black text-white">
      <style>{toastFadeIn}</style>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      {/* Bienvenida animada igual que MainG */}
      <main
        className="relative w-full min-h-[340px] flex flex-col items-center justify-center px-6 py-12 gap-8 text-white"
        style={{
          backgroundImage: "url('https://i.pinimg.com/originals/0a/0e/68/0a0e687ae35c4464fb52919de028cc39.gif')",
          backgroundSize: '100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/70 z-0"></div>
        <div className="relative z-10 w-full flex flex-col items-center text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold whitespace-pre-wrap w-full">
            <AnimatedTitle nombreAnalista={nombreAnalista} />
          </h2>
          <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap w-full">
            <AnimatedParagraph loadingTareas={loadingTareas} />
          </p>
        </div>
      </main>
      {/* CRUD de tareas del analista */}
      <div className="px-2 py-4 sm:p-8 w-full space-y-8 sm:space-y-12">
        <div className="w-full max-w-5xl mx-auto">
          <JsonBinCRUD nombreAnalista={nombreAnalista} />
        </div>
        <div className="w-full max-w-5xl mx-auto">
          <EstadoTareasPanel tareasEquipo={tareasEquipo} />
        </div>
      </div>
    </div>
  );
}

// ---- Animación tipo MainG (solo saludo y parrafo) ----
function AnimatedTitle({ nombreAnalista }) {
  const title = nombreAnalista
    ? `¡Hola, ${nombreAnalista}!`
    : "Bienvenido/a al panel de Analista";
  const [displayedTitle, setDisplayedTitle] = useState('');
  useEffect(() => {
    let titleIndex = 0;
    setDisplayedTitle('');
    const titleInterval = setInterval(() => {
      setDisplayedTitle(title.slice(0, titleIndex + 1));
      titleIndex++;
      if (titleIndex === title.length) clearInterval(titleInterval);
    }, 80);
    return () => clearInterval(titleInterval);
  }, [nombreAnalista]);
  return displayedTitle;
}

function AnimatedParagraph({ loadingTareas }) {
  const paragraph = `Bienvenido(a) a tu panel.`;
  const [displayedParagraph, setDisplayedParagraph] = useState('');
  useEffect(() => {
    let paraIndex = 0;
    setDisplayedParagraph('');
    const paraInterval = setInterval(() => {
      setDisplayedParagraph(paragraph.slice(0, paraIndex + 1));
      paraIndex++;
      if (paraIndex === paragraph.length) clearInterval(paraInterval);
    }, 30);
    return () => clearInterval(paraInterval);
  }, []);
  return (
    <>
      {displayedParagraph}
      {loadingTareas ? (
        <div className="text-blue-300 text-base mt-4">Cargando tus tareas...</div>
      ) : null}
    </>
  );
}

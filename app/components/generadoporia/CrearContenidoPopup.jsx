import { useState } from 'react';

export default function GenerarContenido({ onClose, nombreMateria }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [progreso, setProgreso] = useState('');
  const [jobId, setJobId] = useState(null);

  // DESCARGAR MULTIPLES .TXT SEGÚN LOS TEMAS DEL ENSAMBLADOR
  const descargarArchivosPorTema = (temas, nombreMateria) => {
    temas.forEach(({ tema, contenido }, i) => {
      let nombreBase = nombreMateria ? nombreMateria : "contenido";
      nombreBase = nombreBase.replace(/[^\w\d\-_]/g, "_");
      let nombreArchivo = `${nombreBase}__${tema.replace(/[^\w\d\-_]/g, "_") || "tema"+i}.txt`;

      const blob = new Blob([contenido], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  // POLLING: Revisar si el backend ya terminó el job y descargar múltiples archivos si aplica
  const pollEstado = async (jobId) => {
    try {
      const res = await fetch(`https://backfb-1.onrender.com/api/ensamblar/estado?jobId=${jobId}`);
      const data = await res.json();
      if (data.status === "done") {
        setLoading(false);
        setProgreso('¡Descarga completada!');
        setJobId(null);

        // SUPONEMOS QUE EL BACKEND DEVUELVE UN JSON así:
        // { status: "done", temas: [{tema: "...", contenido: "..."}, ...] }
        // Si devuelve un string, parsea:
        let temas = [];
        if (data.temas) {
          temas = data.temas;
        } else if (typeof data.ensamblado === "string") {
          try {
            const posible = JSON.parse(data.ensamblado);
            if (Array.isArray(posible)) temas = posible;
          } catch { /* Fallback a texto plano si no es JSON */ }
        }
        // Si no hay temas, cae back al txt normal (descarga uno solo)
        if (Array.isArray(temas) && temas.length > 0) {
          descargarArchivosPorTema(temas, nombreMateria);
        } else if (data.ensamblado) {
          // Legacy: descarga un solo archivo
          let nombre = nombreMateria || "contenido";
          nombre = nombre.replace(/[^\w\d\-_]/g, "_");
          const blob = new Blob([data.ensamblado], { type: "text/plain" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${nombre}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } else if (data.status === "error") {
        setLoading(false);
        setError(data.error || "Ocurrió un error en el servidor.");
        setJobId(null);
      } else {
        setProgreso("Generando contenido... (puede tardar varios minutos)");
        setTimeout(() => pollEstado(jobId), 2000);
      }
    } catch (err) {
      setLoading(false);
      setError("Error de red al consultar estado.");
      setJobId(null);
    }
  };

  const handleGenerar = async () => {
    setLoading(true);
    setError(null);
    setProgreso("");
    setJobId(null);
    try {
      const res = await fetch('https://backfb-1.onrender.com/api/ensamblar', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (!data.jobId) throw new Error(data.error || "No se recibió jobId");
      setProgreso("Solicitud enviada, esperando resultado...");
      setJobId(data.jobId);
      pollEstado(data.jobId);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="bg-black/80 fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-white">×</button>
        <h2 className="text-xl font-bold mb-4 text-white">Generar y descargar contenido de la materia</h2>
        <button
          onClick={handleGenerar}
          disabled={loading || !!jobId}
          className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-6 rounded font-bold mb-4"
        >
          {loading || jobId ? 'Generando...' : 'Generar y Descargar .txt'}
        </button>
        {progreso && <div className="text-blue-300 mb-2">{progreso}</div>}
        {error && (
          <div className="text-red-400 mb-2">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="text-gray-400 mt-4 text-xs">
          Los archivos se descargarán automáticamente cuando termine la generación.
        </div>
      </div>
    </div>
  );
}

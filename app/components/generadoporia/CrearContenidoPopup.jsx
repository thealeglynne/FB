import { useState } from 'react';

export default function GenerarContenido({ onClose, nombreMateria }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Puede pasar el nombre de la materia como prop, o pedirlo al usuario antes de descargar

  const handleGenerar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ensamblar', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.ensamblado) throw new Error(data.error || "Sin datos ensamblados");

      // Descarga automática como txt
      let nombre = nombreMateria || "contenido";
      // Sanitizar para nombre de archivo
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
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-black/80 fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-white">×</button>
        <h2 className="text-xl font-bold mb-4 text-white">Generar y descargar contenido de la materia</h2>
        <button
          onClick={handleGenerar}
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-6 rounded font-bold mb-4"
        >
          {loading ? 'Generando...' : 'Generar y Descargar .txt'}
        </button>
        {error && (
          <div className="text-red-400 mb-2">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="text-gray-400 mt-4 text-xs">
          El archivo se descargará automáticamente cuando termine la generación.
        </div>
      </div>
    </div>
  );
}

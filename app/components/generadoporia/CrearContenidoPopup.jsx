import { useState } from 'react';

export default function GenerarContenido({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState("");
  const [error, setError] = useState(null);

  const handleGenerar = async () => {
    setLoading(true);
    setError(null);
    setReporte("");
    try {
      const res = await fetch('/api/orquestar', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error desconocido');
      setReporte(data.output);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-black/80 fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-white">×</button>
        <h2 className="text-xl font-bold mb-4 text-white">Generar contenido de la materia</h2>
        <button
          onClick={handleGenerar}
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-6 rounded font-bold mb-4"
        >
          {loading ? 'Generando...' : 'Ejecutar Orquestador'}
        </button>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        {reporte && (
          <pre className="bg-gray-800 text-white text-sm max-h-[60vh] overflow-auto p-4 rounded">{reporte}</pre>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { Line, PolarArea, Bubble, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Paleta solo AZUL-CYAN
const cyberColors = [
  "#088F8D", "#163A39", "#C3E4EC", "#196463"
];
function getCyberColor(idx, alpha = 1) {
  const hex = cyberColors[idx % cyberColors.length];
  if (alpha === 1) return hex;
  const rgb = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  return `rgba(${rgb.join(',')},${alpha})`;
}

export default function GraphicsLider({ cursos, tareas }) {
  const [groupIndex, setGroupIndex] = useState(0);

  const materias = useMemo(() => {
    if (!Array.isArray(cursos)) return [];
    return [...new Set(cursos.map(c => c['Nombre del Programa']))];
  }, [cursos]);

  const tareasPorMateria = useMemo(() => {
    if (!Array.isArray(tareas) || !Array.isArray(cursos)) return [];
    const map = new Map();
    materias.forEach(materia => map.set(materia, { asignadas: 0, noAsignadas: 0 }));

    tareas.forEach(tarea => {
      const m = tarea.Materia;
      if (!map.has(m)) map.set(m, { asignadas: 0, noAsignadas: 0 });
      if (tarea.Analista || tarea.Auxiliar || tarea.Practicante) {
        map.get(m).asignadas++;
      } else {
        map.get(m).noAsignadas++;
      }
    });

    return Array.from(map.entries()).map(([materia, val]) => ({ materia, ...val }));
  }, [tareas, materias, cursos]);

  const fechaHoy = new Date();
  const diasIntervalo = 30;
  const formatDateShort = date => date.toISOString().slice(0, 10);

  const asignacionesPorFecha = useMemo(() => {
    if (!Array.isArray(tareas)) return { labels: [], data: [] };
    const map = new Map();

    for (let i = diasIntervalo - 1; i >= 0; i--) {
      const fecha = new Date(fechaHoy);
      fecha.setDate(fecha.getDate() - i);
      map.set(formatDateShort(fecha), 0);
    }

    tareas.forEach(tarea => {
      const fechaAsign = new Date(tarea.Fecha_Asignacion);
      if (isNaN(fechaAsign)) return;
      const fechaStr = formatDateShort(fechaAsign);
      if (map.has(fechaStr)) {
        map.set(fechaStr, map.get(fechaStr) + 1);
      }
    });

    return { labels: Array.from(map.keys()), data: Array.from(map.values()) };
  }, [tareas, fechaHoy]);

  const barData = {
    labels: tareasPorMateria.map(t => t.materia),
    datasets: [
      {
        label: "Tareas Asignadas",
        data: tareasPorMateria.map(t => t.asignadas),
        backgroundColor: getCyberColor(0, 0.77),
        borderColor: getCyberColor(0, 1),
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: "Tareas No Asignadas",
        data: tareasPorMateria.map(t => t.noAsignadas),
        backgroundColor: getCyberColor(1, 0.63),
        borderColor: getCyberColor(1, 1),
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  const lineData = {
    labels: asignacionesPorFecha.labels,
    datasets: [{
      label: "Asignaciones por Día",
      data: asignacionesPorFecha.data,
      borderColor: getCyberColor(0),
      backgroundColor: getCyberColor(2, 0.26),
      fill: true,
      tension: 0.36,
      pointRadius: 2,
      pointHoverRadius: 5
    }]
  };

  const escuelas = useMemo(() => {
    if (!Array.isArray(cursos)) return [];
    return [...new Set(cursos.map(c => c['Escuela'] || "Sin Escuela"))];
  }, [cursos]);

  const polarData = {
    labels: escuelas,
    datasets: [{
      label: "Cursos por Escuela",
      data: escuelas.map(esc => cursos.filter(c => (c['Escuela'] || "Sin Escuela") === esc).length),
      backgroundColor: escuelas.map((_, i) => getCyberColor(i, 0.27)),
      borderColor: escuelas.map((_, i) => getCyberColor(i, 0.95)),
      borderWidth: 2,
    }]
  };

  const chartGroups = [
    {
      label: "Asignación de Tareas",
      charts: ["barAsignacion", "lineAsignacionFecha"]
    },
    {
      label: "Distribución Académica",
      charts: ["polarEscuelas", "bubbleCursos"]
    }
  ];

  const bubbleData = useMemo(() => {
    if (!Array.isArray(cursos) || !Array.isArray(tareas)) return { datasets: [] };
    return {
      datasets: cursos.map((curso, i) => {
        const mat = curso['Nombre del Programa'];
        const tareasMateria = tareas.filter(t => t.Materia === mat).length;
        return {
          label: mat,
          data: [{ x: i + 1, y: tareasMateria, r: Math.min(tareasMateria * 1.5 + 4, 20) }],
          backgroundColor: getCyberColor(i, 0.8),
          borderColor: getCyberColor(i, 1),
          borderWidth: 2
        };
      })
    };
  }, [cursos, tareas]);

  // Nuevo: estilos de panel y botones para el panel "trading"
  const cardStyle = "bg-[#0e151a] border-2 border-[#088F8D] rounded-md shadow-[0_0_38px_6px_#088F8D55] p-4 sm:p-7 mb-8 h-[56vh] min-h-[340px] overflow-y-auto hover:border-[#32e4e2] transition-all";
  const titleStyle = "text-[#C3E4EC] text-lg font-extrabold tracking-wide mb-3 drop-shadow-md";
  const containerStyle = "grid grid-cols-1 md:grid-cols-2 gap-8";

  // Tabs agresivos, menos rounded y con glow azul
  const tabActive = "bg-[#0e151a] border-[#088F8D] text-[#C3E4EC] font-bold shadow-[0_0_18px_#088F8D55] border-2 rounded-md";
  const tabInactive = "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-900 border-2 rounded-md font-bold";

  return (
    <div className="pt-4 pb-2">
      <div className="flex gap-3 mb-5">
        {chartGroups.map((group, idx) => (
          <button
            key={group.label}
            onClick={() => setGroupIndex(idx)}
            className={`px-4 py-1.5 text-sm transition-all duration-200 ${groupIndex === idx ? tabActive : tabInactive}`}
            style={{ boxShadow: groupIndex === idx ? "0 0 16px #088F8D77" : undefined }}
          >
            {group.label}
          </button>
        ))}
      </div>

      <div className={containerStyle}>
        {chartGroups[groupIndex].charts.map(chartName => {
          switch (chartName) {
            case "barAsignacion":
              return (
                <div key={chartName} className={cardStyle}>
                  <div className={titleStyle}>Tareas Asignadas vs No Asignadas por Materia</div>
                  <Bar data={barData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: '#C3E4EC', font: { size: 13 } } },
                      tooltip: { backgroundColor: '#088F8D', bodyFont: { size: 13 } },
                    },
                    scales: {
                      x: { 
                        ticks: { color: '#C3E4EC', maxRotation: 60, minRotation: 30, font: { size: 11 } }, 
                        stacked: true,
                        grid: { color: '#163A39' }
                      },
                      y: { 
                        stacked: true, 
                        ticks: { color: '#C3E4EC', beginAtZero: true, font: { size: 11 } }, 
                        grid: { color: '#163A39' }
                      }
                    }
                  }} height={null} width={null} />
                </div>
              );
            case "lineAsignacionFecha":
              return (
                <div key={chartName} className={cardStyle}>
                  <div className={titleStyle}>Asignaciones Recientes por Fecha (últimos 30 días)</div>
                  <Line data={lineData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: '#C3E4EC', font: { size: 13 } } },
                      tooltip: { backgroundColor: '#088F8D', bodyFont: { size: 13 } },
                    },
                    scales: {
                      x: { 
                        ticks: { color: '#C3E4EC', maxRotation: 60, minRotation: 30, font: { size: 11 } }, 
                        grid: { color: '#163A39' }
                      },
                      y: { 
                        ticks: { color: '#C3E4EC', beginAtZero: true, stepSize: 1, font: { size: 11 } }, 
                        grid: { color: '#163A39' }
                      }
                    }
                  }} height={null} width={null} />
                </div>
              );
            case "polarEscuelas":
              return (
                <div key={chartName} className={cardStyle}>
                  <div className={titleStyle}>Distribución de Cursos por Escuela</div>
                  <PolarArea data={polarData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom", labels: { color: "#C3E4EC", font: { size: 13 } } },
                      tooltip: { backgroundColor: "#088F8D", bodyFont: { size: 13 } }
                    },
                    animation: { duration: 900 }
                  }} height={null} width={null} />
                </div>
              );
            case "bubbleCursos":
              return (
                <div key={chartName} className={cardStyle}>
                  <div className={titleStyle}>Número de tareas por curso (Burbuja)</div>
                  <Bubble data={bubbleData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        backgroundColor: "#196463",
                        bodyFont: { size: 13 },
                        callbacks: {
                          label: ctx => {
                            const d = ctx.raw;
                            return `Curso: ${ctx.dataset.label}, Tareas: ${d.y}`;
                          }
                        }
                      },
                      legend: { display: false }
                    },
                    scales: {
                      x: { 
                        title: { display: true, text: "Curso (ID)", color: "#C3E4EC", font: { size: 13 } }, 
                        grid: { color: "#163A39" }, 
                        ticks: { color: "#C3E4EC", font: { size: 11 } } 
                      },
                      y: { 
                        title: { display: true, text: "Cantidad Tareas", color: "#C3E4EC", font: { size: 13 } }, 
                        grid: { color: "#163A39" }, 
                        ticks: { color: "#C3E4EC", beginAtZero: true, font: { size: 11 } } 
                      }
                    }
                  }} height={null} width={null} />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

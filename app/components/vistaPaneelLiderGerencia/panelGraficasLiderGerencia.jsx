'use client';

import { useState, useMemo } from 'react';
import { Line, PolarArea, Bubble, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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
        backgroundColor: getCyberColor(0, 0.7),
      },
      {
        label: "Tareas No Asignadas",
        data: tareasPorMateria.map(t => t.noAsignadas),
        backgroundColor: getCyberColor(1, 0.7),
      }
    ]
  };

  const lineData = {
    labels: asignacionesPorFecha.labels,
    datasets: [{
      label: "Asignaciones por Día",
      data: asignacionesPorFecha.data,
      borderColor: getCyberColor(0),
      backgroundColor: getCyberColor(0, 0.3),
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 4
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
      backgroundColor: escuelas.map((_, i) => getCyberColor(i, 0.35)),
      borderColor: escuelas.map((_, i) => getCyberColor(i, 1)),
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
          backgroundColor: getCyberColor(i),
          borderColor: getCyberColor(i, 1),
          borderWidth: 1
        };
      })
    };
  }, [cursos, tareas]);

  const cardStyle = "bg-gray-900 border border-gray-700 rounded-2xl shadow-lg p-2 sm:p-4 mb-4";
  const titleStyle = "text-white text-base sm:text-md font-bold mb-2";
  const containerStyle = "grid grid-cols-1 md:grid-cols-2 gap-4";

  const tabActive = "bg-[#088F8D] border-[#088F8D] text-[#C3E4EC] shadow-md text-sm";
  const tabInactive = "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 text-sm";

  return (
    <div className="pt-4 pb-2">
      <div className="flex gap-2 mb-4">
        {chartGroups.map((group, idx) => (
          <button
            key={group.label}
            onClick={() => setGroupIndex(idx)}
            className={`px-3 py-1 rounded-xl font-semibold border transition-all duration-200 shadow-sm
              ${groupIndex === idx ? tabActive : tabInactive}`}
            style={{ boxShadow: groupIndex === idx ? "0 0 8px #088F8D66" : undefined }}
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
                <div key={chartName} className={cardStyle} style={{ maxHeight: 280, maxWidth: '100%' }}>
                  <div className={titleStyle}>Tareas Asignadas vs No Asignadas por Materia</div>
                  <Bar data={barData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: 'white', font: { size: 11 } } },
                      tooltip: { backgroundColor: '#088F8D', bodyFont: { size: 12 } },
                    },
                    scales: {
                      x: { ticks: { color: 'white', maxRotation: 60, minRotation: 30, font: { size: 10 } }, stacked: true },
                      y: { stacked: true, ticks: { color: 'white', beginAtZero: true, font: { size: 10 } } }
                    }
                  }} />
                </div>
              );
            case "lineAsignacionFecha":
              return (
                <div key={chartName} className={cardStyle} style={{ maxHeight: 280, maxWidth: '100%' }}>
                  <div className={titleStyle}>Asignaciones Recientes por Fecha (últimos 30 días)</div>
                  <Line data={lineData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: 'white', font: { size: 11 } } },
                      tooltip: { backgroundColor: '#088F8D', bodyFont: { size: 12 } },
                    },
                    scales: {
                      x: { ticks: { color: 'white', maxRotation: 60, minRotation: 30, font: { size: 10 } }, grid: { color: '#333' } },
                      y: { ticks: { color: 'white', beginAtZero: true, stepSize: 1, font: { size: 10 } }, grid: { color: '#333' } }
                    }
                  }} />
                </div>
              );
            case "polarEscuelas":
              return (
                <div key={chartName} className={cardStyle} style={{ maxHeight: 280, maxWidth: '100%' }}>
                  <div className={titleStyle}>Distribución de Cursos por Escuela</div>
                  <PolarArea data={polarData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom", labels: { color: "#C3E4EC", font: { size: 10 } } },
                      tooltip: { backgroundColor: "#088F8D", bodyFont: { size: 12 } }
                    },
                    animation: { duration: 900 }
                  }} />
                </div>
              );
            case "bubbleCursos":
              return (
                <div key={chartName} className={cardStyle} style={{ maxHeight: 280, maxWidth: '100%' }}>
                  <div className={titleStyle}>Número de tareas por curso (Burbuja)</div>
                  <Bubble data={bubbleData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        backgroundColor: "#196463",
                        bodyFont: { size: 12 },
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
                      x: { title: { display: true, text: "Curso (ID)", color: "#C3E4EC", font: { size: 11 } }, grid: { color: "#232d2e" }, ticks: { color: "#C3E4EC", font: { size: 10 } } },
                      y: { title: { display: true, text: "Cantidad Tareas", color: "#C3E4EC", font: { size: 11 } }, grid: { color: "#232d2e" }, ticks: { color: "#C3E4EC", beginAtZero: true, font: { size: 10 } } }
                    }
                  }} />
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

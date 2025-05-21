'use client';

import { useState } from "react";
import {
  Line,
  PolarArea,
  Bubble,
  Radar,
  Bar
} from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Colores corporativos/siverpunk
const cyberColors = [
  "#088F8D", // verde azulado brillante
  "#163A39", // verde pino oscuro
  "#C3E4EC", // celeste suave
  "#196463", // verde azulado oscuro
];

function getCyberColor(idx, alpha = 1) {
  const hex = cyberColors[idx % cyberColors.length];
  if (alpha === 1) return hex;
  const rgb = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  return `rgba(${rgb.join(',')},${alpha})`;
}

const chartGroups = [
  {
    label: "Carga y cronograma",
    charts: ["lineAsignaturas", "comboTemporal"]
  },
  {
    label: "Modalidades y estados",
    charts: ["polarModalidad", "radarEstado"]
  },
  {
    label: "Comparaciones avanzadas",
    charts: ["bubbleAsignaturas", "floatingBarSemestre"]
  }
];

export default function ChartsPanel({ data }) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [interpolation, setInterpolation] = useState("monotone");

  // --------- NUEVA Gráfica de línea (Line Styling) ---------
  // Promedio de asignaturas por semestre (puedes cambiarlo por "por escuela" si prefieres)
  const semestres = Array.from(new Set(data.map(d => Number(d["Semestre"])).filter(Boolean))).sort((a, b) => a - b);
  const avgAsignaturasPorSemestre = semestres.map(s => {
    const filtered = data.filter(d => Number(d["Semestre"]) === s);
    if (!filtered.length) return 0;
    return (
      filtered.reduce((sum, d) => sum + Number(d["# Asignaturas"] || 0), 0) /
      filtered.length
    );
  });

  const lineAsignaturasData = {
    labels: semestres.map(s => `Semestre ${s}`),
    datasets: [
      {
        label: "Promedio de Asignaturas",
        data: avgAsignaturasPorSemestre,
        borderColor: getCyberColor(0, 0.95),
        backgroundColor: getCyberColor(2, 0.13),
        pointBackgroundColor: getCyberColor(2, 1),
        pointBorderColor: getCyberColor(0, 1),
        pointRadius: 6,
        pointHoverRadius: 9,
        borderWidth: 4,
        fill: true,
        tension: 0.45,
        cubicInterpolationMode: interpolation,
      }
    ]
  };

  // ----------- Gráficas existentes -------------
  const escuelas = [...new Set(data.map(d => d["Escuela"] || "Sin Escuela"))];

  // Polar Area: Modalidad por cantidad de programas
  const modalidades = [...new Set(data.map(d => d["Modalidad"] || "Sin Modalidad"))];
  const polarData = {
    labels: modalidades,
    datasets: [{
      label: "Programas por Modalidad",
      data: modalidades.map(m =>
        data.filter(d => (d["Modalidad"] || "Sin Modalidad") === m).length
      ),
      backgroundColor: modalidades.map((_, i) => getCyberColor(i, 0.35)),
      borderColor: modalidades.map((_, i) => getCyberColor(i, 1)),
      borderWidth: 2
    }]
  };

  // Combo Chart: Fechas vs # Asignaturas (Time Scale)
  const fechas = [
    ...new Set(
      data.flatMap(d => [
        d["Fecha de Radicación"],
        d["1ra Entrega Virtualización"],
        d["Entrega Ajustes"],
        d["Entrega Final Ajustes"]
      ]).filter(Boolean)
    )
  ].sort();

  const entregasPorFecha = fechas.map(fecha =>
    data.filter(d => Object.values(d).includes(fecha)).length
  );
  const avgAsignaturasPorFecha = fechas.map(fecha => {
    const filtered = data.filter(d => Object.values(d).includes(fecha));
    if (filtered.length === 0) return 0;
    return (
      filtered.reduce((sum, d) => sum + Number(d["# Asignaturas"] || 0), 0) /
      filtered.length
    );
  });

  const comboTemporalData = {
    labels: fechas,
    datasets: [
      {
        type: "bar",
        label: "Entregas registradas",
        data: entregasPorFecha,
        backgroundColor: getCyberColor(0, 0.6),
        borderColor: getCyberColor(0, 1),
        borderRadius: 12,
        order: 2,
        borderWidth: 2,
      },
      {
        type: "line",
        label: "Promedio # Asignaturas",
        data: avgAsignaturasPorFecha,
        borderColor: getCyberColor(2, 1),
        backgroundColor: getCyberColor(2, 0.18),
        borderWidth: 3,
        fill: false,
        tension: interpolation === "monotone" ? 0.5 : 0,
        cubicInterpolationMode: interpolation,
        pointBackgroundColor: getCyberColor(2, 1),
        order: 1,
        yAxisID: "asignaturas",
      }
    ]
  };

  // Radar Chart: Distribución de estados por modalidad
  const estados = [...new Set(data.map(d => d["Estado Fabrica"] || "Desconocido"))];
  const radarEstadoData = {
    labels: estados,
    datasets: modalidades.map((modalidad, i) => ({
      label: modalidad,
      backgroundColor: getCyberColor(i, 0.15),
      borderColor: getCyberColor(i, 1),
      borderWidth: 2,
      pointBackgroundColor: getCyberColor(i, 0.8),
      data: estados.map(e =>
        data.filter(d =>
          (d["Modalidad"] || "Sin Modalidad") === modalidad &&
          (d["Estado Fabrica"] || "Desconocido") === e
        ).length
      )
    }))
  };

  // Bubble Chart: Relación # Asignaturas vs Semestre vs Estado
  const bubbleAsignaturasData = {
    datasets: data.map((d, i) => ({
      label: d["Nombre del Programa"] || `Programa ${i + 1}`,
      data: [{
        x: Number(d["# Asignaturas"]) || 0,
        y: Number(d["Semestre"]) || 0,
        r: Math.max(6, (d["Estado Fabrica"] && d["Estado Fabrica"].length) || 8)
      }],
      backgroundColor: getCyberColor(i, 0.7),
      borderColor: getCyberColor(i, 1),
      borderWidth: 2
    }))
  };

  // Floating Bars: Carga académica por rango de semestres
  const floatingBarData = {
    labels: semestres.map(s => `Semestre ${s}`),
    datasets: [
      {
        label: "Carga Académica (Rango Asig.)",
        data: semestres.map(s => {
          const grupo = data.filter(d => Number(d["Semestre"]) === s);
          if (!grupo.length) return [0, 0];
          const asigs = grupo.map(d => Number(d["# Asignaturas"]) || 0);
          return [Math.min(...asigs), Math.max(...asigs)];
        }),
        backgroundColor: getCyberColor(3, 0.25),
        borderColor: getCyberColor(3, 1),
        borderWidth: 2
      }
    ]
  };

  // Bar Chart Estado
  const programasPorEstado = estados.map(
    estado => data.filter(d => (d["Estado Fabrica"] || "Desconocido") === estado).length
  );
  const barEstadoData = {
    labels: estados,
    datasets: [{
      label: "Programas",
      backgroundColor: estados.map((_, i) => getCyberColor(i, 0.6)),
      borderColor: estados.map((_, i) => getCyberColor(i, 1)),
      data: programasPorEstado,
      borderRadius: 12,
      borderWidth: 2
    }]
  };

  // --- Estilos (solo charts/menu tabs), coherente y sobrio ---
  const cardStyle = "bg-gray-900 border border-gray-700 rounded-2xl shadow-lg p-4 sm:p-6 mb-6 transition-all hover:shadow-2xl";
  const titleStyle = "text-white text-base sm:text-lg font-bold mb-3";
  const containerStyle = "grid grid-cols-1 md:grid-cols-2 gap-6";
  const tabActive = "bg-[#088F8D] border-[#088F8D] text-[#C3E4EC] shadow-md";
  const tabInactive = "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700";

  function handleToggleInterpolation() {
    setInterpolation(interpolation === "monotone" ? "linear" : "monotone");
  }

  return (
    <div className="pt-6 pb-2">
      {/* Menú tipo tabs */}
      <div className="flex gap-2 mb-6">
        {chartGroups.map((group, idx) => (
          <button
            key={group.label}
            onClick={() => setGroupIndex(idx)}
            className={`px-4 sm:px-6 py-2 rounded-xl font-semibold border text-base
              transition-all duration-200 shadow-sm
              ${groupIndex === idx ? tabActive : tabInactive}
            `}
            style={{
              boxShadow: groupIndex === idx
                ? "0 0 10px #088F8D66"
                : undefined
            }}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div className={containerStyle}>
        {/* --- NUEVA: Line Styling --- */}
        {chartGroups[groupIndex].charts[0] === "lineAsignaturas" && (
          <div className={cardStyle}>
            <div className={titleStyle}>Tendencia: Promedio de Asignaturas por Semestre</div>
            <Line
              data={lineAsignaturasData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    labels: { color: "#C3E4EC", font: { size: 15 } }
                  },
                  tooltip: { backgroundColor: "#088F8D" }
                },
                animation: { duration: 1200 },
                scales: {
                  x: {
                    grid: { color: "#232d2e" },
                    ticks: { color: "#C3E4EC", font: { size: 13 } }
                  },
                  y: {
                    grid: { color: "#232d2e" },
                    beginAtZero: true,
                    ticks: { color: "#C3E4EC", font: { size: 13 } }
                  }
                }
              }}
            />
          </div>
        )}

        {/* Combo Temporal con Interpolation Toggle */}
        {chartGroups[groupIndex].charts[1] === "comboTemporal" && (
          <div className={cardStyle}>
            <div className={titleStyle + " flex items-center gap-4"}>
              Cronograma: Entregas vs. Promedio de Asignaturas
              <button
                className="ml-auto px-3 py-1 rounded-md font-semibold border border-[#088F8D] bg-[#088F8D] text-[#C3E4EC] hover:bg-[#196463] hover:border-[#196463] transition"
                onClick={handleToggleInterpolation}
                style={{ boxShadow: "0 0 6px #088F8D" }}
              >
                Interpolación: {interpolation === "monotone" ? "Suavizada" : "Lineal"}
              </button>
            </div>
            <Bar
              data={comboTemporalData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom", labels: { color: "#C3E4EC", font: { size: 13 } } }
                },
                animation: { duration: 1200 },
                scales: {
                  x: {
                    grid: { color: "#232d2e" },
                    ticks: { color: "#C3E4EC", font: { size: 12 } }
                  },
                  y: {
                    grid: { color: "#232d2e" },
                    beginAtZero: true,
                    title: { display: true, text: "Entregas", color: "#C3E4EC" },
                    ticks: { color: "#C3E4EC", font: { size: 12 } }
                  },
                  asignaturas: {
                    position: "right",
                    grid: { drawOnChartArea: false, color: "#C3E4EC" },
                    ticks: { color: "#088F8D", font: { size: 12 } },
                    title: { display: true, text: "Prom. Asignaturas", color: "#088F8D" }
                  }
                }
              }}
            />
          </div>
        )}

        {/* Polar Modalidad */}
        {chartGroups[groupIndex].charts[0] === "polarModalidad" && (
          <div className={cardStyle}>
            <div className={titleStyle}>Distribución de Modalidades</div>
            <PolarArea
              data={polarData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                    labels: { color: "#C3E4EC", font: { size: 13 } }
                  },
                  tooltip: { enabled: true, backgroundColor: "#088F8D" }
                },
                animation: { duration: 1300 }
              }}
            />
          </div>
        )}

        {/* Radar Estado */}
        {chartGroups[groupIndex].charts[1] === "radarEstado" && (
          <div className={cardStyle}>
            <div className={titleStyle}>Estados por Modalidad</div>
            <Radar
              data={radarEstadoData}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom", labels: { color: "#C3E4EC" } } },
                scales: {
                  r: {
                    angleLines: { color: "#232d2e" },
                    pointLabels: { color: "#C3E4EC", font: { size: 14 } },
                    ticks: { color: "#088F8D", stepSize: 1, backdropColor: "transparent" }
                  }
                },
                animation: { duration: 1300 }
              }}
            />
          </div>
        )}

        {/* Bubble Chart */}
        {chartGroups[groupIndex].charts[0] === "bubbleAsignaturas" && (
          <div className={cardStyle}>
            <div className={titleStyle}>Asignaturas vs. Semestre (por Programa)</div>
            <Bubble
              data={bubbleAsignaturasData}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    backgroundColor: "#196463",
                    callbacks: {
                      label: ctx => {
                        const d = ctx.raw;
                        return `Asignaturas: ${d.x}, Semestre: ${d.y}, Rango: ${d.r}`;
                      }
                    }
                  },
                  legend: { display: false }
                },
                scales: {
                  x: {
                    title: { display: true, text: "# Asignaturas", color: "#C3E4EC" },
                    grid: { color: "#232d2e" },
                    ticks: { color: "#C3E4EC", stepSize: 1, font: { size: 12 } },
                    min: 0
                  },
                  y: {
                    title: { display: true, text: "Semestre", color: "#C3E4EC" },
                    grid: { color: "#232d2e" },
                    ticks: { color: "#C3E4EC", stepSize: 1, font: { size: 12 } },
                    min: 0
                  }
                },
                animation: { duration: 1300 }
              }}
            />
          </div>
        )}

        {/* Floating Bars */}
        {chartGroups[groupIndex].charts[1] === "floatingBarSemestre" && (
          <div className={cardStyle}>
            <div className={titleStyle}>Carga Académica por Semestre (Rangos)</div>
            <Bar
              data={floatingBarData}
              options={{
                indexAxis: 'x',
                elements: {
                  bar: {
                    borderRadius: 10
                  }
                },
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#088F8D",
                    callbacks: {
                      label: ctx => {
                        const [min, max] = ctx.raw;
                        return `Min: ${min} - Max: ${max}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { color: "#232d2e" },
                    ticks: { color: "#C3E4EC", font: { size: 12 } }
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: "#232d2e" },
                    ticks: { color: "#C3E4EC", font: { size: 12 }, stepSize: 1 }
                  }
                },
                animation: { duration: 1200 }
              }}
            />
          </div>
        )}

        {/* Bar Chart Estado */}
        {chartGroups[groupIndex].charts[1] === "barEstado" && (
          <div className={cardStyle}>
            <div className={titleStyle}>Estado de Entregas por Programa</div>
            <Bar
              data={barEstadoData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: "index", intersect: false, backgroundColor: "#196463" },
                },
                animation: { duration: 1200 },
                scales: {
                  x: { grid: { color: "#232d2e" }, ticks: { color: "#C3E4EC" } },
                  y: { grid: { color: "#232d2e" }, ticks: { color: "#C3E4EC" } }
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

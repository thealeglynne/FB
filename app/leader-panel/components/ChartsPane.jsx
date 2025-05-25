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

const cyberColors = [
  "#6A0DAD", // morado intenso (nuevo)
  "#163A39", // verde pino oscuro (original)
  "#C3E4EC", // celeste suave (original)
  "#196463", // verde azulado oscuro (original)
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
  // Promedio de asignaturas por semestre
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
        borderRadius: 6,
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
      borderRadius: 6,
      borderWidth: 2
    }]
  };

  // --- Estilos de botones ---
  const tabActive = "btn-glow border-2 text-sm font-semibold rounded-md shadow-md";
  const tabInactive = "btn-glow border-2 text-sm font-semibold rounded-md shadow-md bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800";

  const btnSizeStyles = "px-2 py-1 max-w-[130px]";

  function handleToggleInterpolation() {
    setInterpolation(interpolation === "monotone" ? "linear" : "monotone");
  }

  return (
    <>
      <style>{`
        .btn-glow {
          position: relative;
          overflow: hidden;
          border-width: 2px;
          box-shadow: 0 0 10px #6A0DAD44;
          transition: background-color 0.22s, border-color 0.22s, box-shadow 0.22s;
        }
        .btn-glow::after {
          content: "";
          position: absolute;
          left: -75%;
          top: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.12) 55%, transparent 60%);
          transform: skewX(-20deg);
          transition: left 0.6s;
          pointer-events: none;
          z-index: 1;
        }
        .btn-glow:hover::after {
          left: 120%;
        }
        .btn-glow > * {
          position: relative;
          z-index: 2;
        }
      `}</style>

      <div className="pt-6 pb-2">
        {/* Menú tipo tabs */}
        <div className="flex gap-2 mb-6">
          {chartGroups.map((group, idx) => (
            <button
              key={group.label}
              onClick={() => setGroupIndex(idx)}
              className={`${tabActive} ${btnSizeStyles} ${
                groupIndex === idx
                  ? "bg-[#101017] border-[#6A0DAD] text-[#C3E4EC]"
                  : tabInactive
              }`}
              style={{
                boxShadow: groupIndex === idx
                  ? "0 0 18px #6A0DAD77"
                  : undefined
              }}
            >
              {group.label}
            </button>
          ))}
        </div>

        {/* --- Gráficos según grupo seleccionado --- */}

        {/* --- NUEVA: Line Styling --- */}
        {chartGroups[groupIndex].charts[0] === "lineAsignaturas" && (
          <div className="bg-[#101017] border-2 border-[#232d2e] rounded-md shadow-2xl p-4 sm:p-7 mb-10 h-[56vh] min-h-[390px] overflow-y-auto transition-all hover:border-[#6A0DAD] hover:shadow-[0_0_40px_#6A0DAD77]">
            <div className="text-white text-base sm:text-lg font-bold mb-3">Tendencia: Promedio de Asignaturas por Semestre</div>
            <Line
              data={lineAsignaturasData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    labels: { color: "#C3E4EC", font: { size: 15 } }
                  },
                  tooltip: { backgroundColor: "#6A0DAD" }
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
              height={null}
              width={null}
            />
          </div>
        )}

        {/* Combo Temporal con botón interpolación */}
        {chartGroups[groupIndex].charts[1] === "comboTemporal" && (
          <div className="bg-[#101017] border-2 border-[#232d2e] rounded-md shadow-2xl p-4 sm:p-7 mb-10 h-[56vh] min-h-[390px] overflow-y-auto transition-all hover:border-[#6A0DAD] hover:shadow-[0_0_40px_#6A0DAD77]">
            <div className="text-white text-base sm:text-lg font-bold mb-3 flex items-center gap-4">
              Cronograma: Entregas vs. Promedio de Asignaturas
              <button
                onClick={handleToggleInterpolation}
                className={`btn-glow ${btnSizeStyles} bg-[#6A0DAD] border-[#6A0DAD] text-[#C3E4EC] rounded-md font-semibold transition`}
                style={{ boxShadow: "0 0 11px #6A0DAD99" }}
              >
                Interpolación: {interpolation === "monotone" ? "Suavizada" : "Lineal"}
              </button>
            </div>
            <Bar
              data={comboTemporalData}
              options={{
                maintainAspectRatio: false,
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
              height={null}
              width={null}
            />
          </div>
        )}

        {/* Polar Modalidad */}
        {chartGroups[groupIndex].charts[0] === "polarModalidad" && (
          <div className="bg-[#101017] border-2 border-[#232d2e] rounded-md shadow-2xl p-4 sm:p-7 mb-10 h-[56vh] min-h-[390px] overflow-y-auto transition-all hover:border-[#6A0DAD] hover:shadow-[0_0_40px_#6A0DAD77]">
            <div className="text-white text-base sm:text-lg font-bold mb-3">Distribución de Modalidades</div>
            <PolarArea
              data={polarData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                    labels: { color: "#C3E4EC", font: { size: 13 } }
                  },
                  tooltip: { enabled: true, backgroundColor: "#6A0DAD" }
                },
                animation: { duration: 1300 }
              }}
            />
          </div>
        )}

        {/* Radar Estado */}
        {chartGroups[groupIndex].charts[1] === "radarEstado" && (
          <div className="bg-[#101017] border-2 border-[#232d2e] rounded-md shadow-2xl p-4 sm:p-7 mb-10 h-[56vh] min-h-[390px] overflow-y-auto transition-all hover:border-[#6A0DAD] hover:shadow-[0_0_40px_#6A0DAD77]">
            <div className="text-white text-base sm:text-lg font-bold mb-3">Estados por Modalidad</div>
            <Radar
              data={radarEstadoData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: { legend: { position: "bottom", labels: { color: "#C3E4EC" } } },
                scales: {
                  r: {
                    angleLines: { color: "#232d2e" },
                    pointLabels: { color: "#C3E4EC", font: { size: 14 } },
                    ticks: { color: "#6A0DAD", stepSize: 1, backdropColor: "transparent" }
                  }
                },
                animation: { duration: 1300 }
              }}
            />
          </div>
        )}

        {/* Bubble Chart */}
        {chartGroups[groupIndex].charts[0] === "bubbleAsignaturas" && (
          <div className="bg-[#101017] border-2 border-[#232d2e] rounded-md shadow-2xl p-4 sm:p-7 mb-10 h-[56vh] min-h-[390px] overflow-y-auto transition-all hover:border-[#6A0DAD] hover:shadow-[0_0_40px_#6A0DAD77]">
            <div className="text-white text-base sm:text-lg font-bold mb-3">Asignaturas vs. Semestre (por Programa)</div>
            <Bubble
              data={bubbleAsignaturasData}
              options={{
                maintainAspectRatio: false,
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
          <div className="bg-[#101017] border-2 border-[#232d2e] rounded-md shadow-2xl p-4 sm:p-7 mb-10 h-[56vh] min-h-[390px] overflow-y-auto transition-all hover:border-[#6A0DAD] hover:shadow-[0_0_40px_#6A0DAD77]">
            <div className="text-white text-base sm:text-lg font-bold mb-3">Carga Académica por Semestre (Rangos)</div>
            <Bar
              data={floatingBarData}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'x',
                elements: {
                  bar: {
                    borderRadius: 6
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
          <div className="bg-[#101017] border-2 border-[#232d2e] rounded-md shadow-2xl p-4 sm:p-7 mb-10 h-[56vh] min-h-[390px] overflow-y-auto transition-all hover:border-[#6A0DAD] hover:shadow-[0_0_40px_#6A0DAD77]">
            <div className="text-white text-base sm:text-lg font-bold mb-3">Estado de Entregas por Programa</div>
            <Bar
              data={barEstadoData}
              options={{
                maintainAspectRatio: false,
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
    </>
  );
}

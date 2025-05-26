'use client';

import {
  Bar, Line, Doughnut,
} from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const colors = {
  background: "#151826",
  surface: "#20223a",
  border: "#23263b",
  text: "#e4e9f7",
  accent: "#22d3ee",
  accent2: "#fde047",
  green: "#1dc186",
  red: "#ed4245",
  yellow: "#ffe066",
  shadow: "rgba(36, 51, 99, 0.10)",
};

function formatNumber(n) {
  return n.toLocaleString('es-CO', { maximumFractionDigits: 1 });
}

export default function AnalyticsPanel({ tareasEquipo = [], analistasEquipo = [] }) {
  // --- DATOS PARA DASHBOARD ---
  const totalMaterias = tareasEquipo.length;
  const estados = ["Pendiente", "En progreso", "Terminado"];
  const actividadesPorEstado = estados.map(estado =>
    tareasEquipo.reduce((acc, t) =>
      acc + t.Gránulos.reduce((sum, g) =>
        sum + g.Actividades.filter(a => a.Estado === estado).length, 0), 0)
  );
  const totalActividades = actividadesPorEstado.reduce((a, b) => a + b, 0);
  const progresoPorc = totalActividades
    ? Math.round((actividadesPorEstado[2] / totalActividades) * 100)
    : 0;

  const barData = {
    labels: analistasEquipo.map(a => a.nombreCompleto),
    datasets: [
      {
        label: "Materias",
        data: analistasEquipo.map(a =>
          tareasEquipo.filter(t => t.Analista === a.nombreCompleto).length
        ),
        backgroundColor: colors.accent,
        borderRadius: 8,
        borderWidth: 0,
        barPercentage: 0.60,
        categoryPercentage: 0.68,
      }
    ]
  };

  const GRANULOS = tareasEquipo[0]?.Gránulos?.map(g => g.Nombre_Granulo) || [];
  const lineData = {
    labels: GRANULOS,
    datasets: [{
      label: "% Avance (terminadas)",
      data: GRANULOS.map((nombre, i) => {
        let total = 0, terminadas = 0;
        tareasEquipo.forEach(t =>
          t.Gránulos.forEach((g, idx) => {
            if (g.Nombre_Granulo === nombre || idx === i) {
              total += g.Actividades.length;
              terminadas += g.Actividades.filter(a => a.Estado === "Terminado").length;
            }
          })
        );
        return total ? Math.round((terminadas / total) * 100) : 0;
      }),
      borderColor: colors.accent,
      backgroundColor: "rgba(34,211,238,0.14)",
      pointBackgroundColor: colors.surface,
      pointBorderColor: colors.accent2,
      borderWidth: 2.7,
      fill: true,
      tension: 0.39,
      pointRadius: 5,
      pointHoverRadius: 8,
    }]
  };

  const doughnutData = {
    labels: estados,
    datasets: [{
      data: actividadesPorEstado,
      backgroundColor: [colors.accent, colors.yellow, colors.green],
      borderColor: colors.background,
      borderWidth: 3,
      hoverOffset: 7,
    }]
  };

  return (
    <div
      className="w-full px-1 py-1 sm:p-2"
      style={{
        background: colors.background,
        height: '50vh',
        minHeight: '340px',
        maxHeight: '51vh',
        overflow: 'hidden',
      }}
    >
      <div
        className="w-full max-w-7xl mx-auto flex flex-col gap-1"
        style={{height: '100%', maxHeight: '100%'}}
      >
        {/* CARDS: 3 en una fila */}
        <div className="grid grid-cols-3 gap-2 mb-1"
          style={{
            height: '23%', // Cards ocupan 23% de altura total
            minHeight: '65px',
            maxHeight: '90px',
          }}
        >
          <div className="bg-[rgba(32,34,58,0.94)] border border-[#23263b] rounded-xl shadow p-2 flex flex-col justify-center items-start min-w-0">
            <div className="text-xs text-[#a8abb7] uppercase">Materias</div>
            <div className="text-lg font-bold text-accent" style={{ color: colors.accent }}>{formatNumber(totalMaterias)}</div>
          </div>
          <div className="bg-[rgba(32,34,58,0.94)] border border-[#23263b] rounded-xl shadow p-2 flex flex-col justify-center items-start min-w-0">
            <div className="text-xs text-[#a8abb7] uppercase">Actividades</div>
            <span className="text-lg font-bold" style={{ color: colors.green }}>
              {formatNumber(actividadesPorEstado[2])}
              <span className="text-xs text-[#6dffb0] font-semibold ml-1">/ {formatNumber(totalActividades)}</span>
            </span>
          </div>
          <div className="bg-[rgba(32,34,58,0.94)] border border-[#23263b] rounded-xl shadow p-2 flex flex-col justify-center items-start min-w-0">
            <div className="text-xs text-[#a8abb7] uppercase">Progreso</div>
            <div className="flex items-center gap-2">
              <svg width="28" height="28" style={{ display: "block" }}>
                <circle cx="14" cy="14" r="10" stroke={colors.surface} strokeWidth="5" fill="none" />
                <circle
                  cx="14" cy="14" r="10"
                  stroke={colors.green}
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${progresoPorc * 0.63} 63`}
                  strokeLinecap="round"
                  transform="rotate(-90 14 14)"
                />
              </svg>
              <span className="text-sm font-bold text-[#1dc186]">{progresoPorc}%</span>
            </div>
          </div>
        </div>

        {/* GRAFICAS: 3 en una fila, compactas */}
        <div
          className="grid grid-cols-3 gap-2 items-end"
          style={{
            height: '77%',
            minHeight: 0,
            alignItems: 'stretch',
          }}
        >
          {/* Barra */}
          <div className="bg-[rgba(32,34,58,0.98)] border border-[#23263b] rounded-xl shadow px-2 py-2 flex flex-col"
            style={{ height: "100%", minHeight: 0, justifyContent: 'center' }}
          >
            <div className="mb-0.5 text-xs font-semibold text-[#e4e9f7]">Materias por Analista</div>
            <Bar
              data={barData}
              options={{
                plugins: { legend: { display: false }, tooltip: { backgroundColor: colors.surface } },
                animation: { duration: 800 },
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: { color: colors.border },
                    ticks: { color: colors.text, font: { size: 10 } }
                  },
                  y: {
                    grid: { color: colors.border },
                    beginAtZero: true,
                    ticks: { color: colors.accent, font: { size: 10 }, stepSize: 1 }
                  }
                }
              }}
              height={105}
              width={null}
              style={{ minHeight: 0, maxHeight: 140 }}
            />
          </div>
          {/* Doughnut */}
          <div className="bg-[rgba(32,34,58,0.98)] border border-[#23263b] rounded-xl shadow px-2 py-2 flex flex-col"
            style={{ height: "100%", minHeight: 0, justifyContent: 'center' }}
          >
            <div className="mb-0.5 text-xs font-semibold text-[#e4e9f7]">Estado Actividades</div>
            <Doughnut
              data={doughnutData}
              options={{
                plugins: {
                  legend: { display: true, position: "bottom", labels: { color: "#e4e9f7", font: { size: 10 } } },
                  tooltip: { enabled: true, backgroundColor: colors.accent2 }
                },
                cutout: "72%",
                animation: { duration: 950 }
              }}
              height={105}
              width={null}
              style={{ minHeight: 0, maxHeight: 140 }}
            />
          </div>
          {/* Línea */}
          <div className="bg-[rgba(32,34,58,0.98)] border border-[#23263b] rounded-xl shadow px-2 py-2 flex flex-col"
            style={{ height: "100%", minHeight: 0, justifyContent: 'center' }}
          >
            <div className="mb-0.5 text-xs font-semibold text-[#e4e9f7]">Progreso por Gránulo</div>
            <Line
              data={lineData}
              options={{
                plugins: { legend: { display: false }, tooltip: { backgroundColor: colors.accent } },
                animation: { duration: 900 },
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: { color: colors.border },
                    ticks: { color: colors.text, font: { size: 10 } }
                  },
                  y: {
                    grid: { color: colors.border },
                    min: 0, max: 100,
                    ticks: { color: colors.green, font: { size: 10 }, stepSize: 25 }
                  }
                }
              }}
              height={105}
              width={null}
              style={{ minHeight: 0, maxHeight: 140 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

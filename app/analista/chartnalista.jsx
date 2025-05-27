'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useMemo } from "react";
Chart.register(...registerables);

// Paleta CYBER
const colors = {
  pendiente: "#6A0DAD",   // morado intenso
  progreso:  "#196463",   // verde azulado oscuro
  terminado: "#C3E4EC",   // celeste suave
  texto:     "#C3E4EC"
};

function contarEstados(actividades) {
  let cuenta = { Pendiente: 0, "En progreso": 0, Terminado: 0 };
  actividades.forEach(a => {
    if (cuenta[a.Estado] !== undefined) cuenta[a.Estado]++;
    else cuenta[a.Estado] = 1;
  });
  return cuenta;
}

export default function EstadoTareasPanel({ tareasEquipo = [] }) {
  // Materias/actividades globales
  const resumenGlobal = useMemo(() => {
    let total = 0, estados = { Pendiente: 0, "En progreso": 0, Terminado: 0 };
    tareasEquipo.forEach(tarea => {
      tarea.Gránulos.forEach(g => {
        g.Actividades.forEach(a => {
          if (estados[a.Estado] !== undefined) estados[a.Estado]++;
          total++;
        });
      });
    });
    return { total, ...estados };
  }, [tareasEquipo]);

  // Datos por tarea
  const datosPorTarea = tareasEquipo.map((tarea) => {
    let cuenta = { Pendiente: 0, "En progreso": 0, Terminado: 0 };
    tarea.Gránulos.forEach(g =>
      g.Actividades.forEach(a => {
        if (cuenta[a.Estado] !== undefined) cuenta[a.Estado]++;
        else cuenta[a.Estado] = 1;
      })
    );
    return {
      materia: tarea.Materia,
      analista: tarea.Analista,
      escuela: tarea.Escuela,
      estados: cuenta,
      total: Object.values(cuenta).reduce((a, b) => a + b, 0)
    };
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* RESUMEN GLOBAL */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1a2133] border border-[#23263b] rounded-xl shadow p-4 flex flex-col items-center">
          <div className="text-xs text-[#a8abb7] uppercase">Total Actividades</div>
          <div className="text-2xl font-bold" style={{ color: colors.texto }}>{resumenGlobal.total}</div>
        </div>
        <div className="bg-[#1a2133] border border-[#23263b] rounded-xl shadow p-4 flex flex-col items-center">
          <div className="text-xs text-[#a8abb7] uppercase">En progreso</div>
          <div className="text-2xl font-bold" style={{ color: colors.progreso }}>{resumenGlobal["En progreso"]}</div>
        </div>
        <div className="bg-[#1a2133] border border-[#23263b] rounded-xl shadow p-4 flex flex-col items-center">
          <div className="text-xs text-[#a8abb7] uppercase">Terminadas</div>
          <div className="text-2xl font-bold" style={{ color: colors.terminado }}>{resumenGlobal.Terminado}</div>
        </div>
      </div>

      {/* GRAFICO DE ESTADOS GLOBALES */}
      <div className="bg-[#23263b] rounded-xl mb-6 p-4 flex flex-col sm:flex-row items-center justify-around">
        <div className="w-full sm:w-1/3 mb-4 sm:mb-0 flex flex-col items-center">
          <div className="mb-2 font-bold text-[#e4e9f7]">Estados de todas las actividades</div>
          <Doughnut
            data={{
              labels: ["Pendiente", "En progreso", "Terminado"],
              datasets: [{
                data: [
                  resumenGlobal.Pendiente,
                  resumenGlobal["En progreso"],
                  resumenGlobal.Terminado,
                ],
                backgroundColor: [colors.pendiente, colors.progreso, colors.terminado],
                borderColor: "#1a2133",
                borderWidth: 2,
              }]
            }}
            options={{
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "#e4e9f7", font: { size: 12 } }
                }
              }
            }}
            width={110}
            height={110}
          />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#20223a] rounded-xl p-3">
            <div className="font-bold text-base" style={{ color: colors.pendiente, marginBottom: 4 }}>Pendiente</div>
            <div className="text-3xl font-bold">{resumenGlobal.Pendiente}</div>
          </div>
          <div className="bg-[#20223a] rounded-xl p-3">
            <div className="font-bold text-base" style={{ color: colors.progreso, marginBottom: 4 }}>En progreso</div>
            <div className="text-3xl font-bold">{resumenGlobal["En progreso"]}</div>
          </div>
          <div className="bg-[#20223a] rounded-xl p-3">
            <div className="font-bold text-base" style={{ color: colors.terminado, marginBottom: 4 }}>Terminado</div>
            <div className="text-3xl font-bold">{resumenGlobal.Terminado}</div>
          </div>
        </div>
      </div>

      {/* TABLA DE ESTADOS POR TAREA */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#181c2a] rounded-xl text-xs">
          <thead>
            <tr className="bg-[#23263b] text-[#e4e9f7]">
              <th className="px-3 py-2">Materia</th>
              <th className="px-3 py-2">Analista</th>
              <th className="px-3 py-2">Escuela</th>
              <th className="px-3 py-2">Total Act.</th>
              <th className="px-3 py-2">Pendiente</th>
              <th className="px-3 py-2">En progreso</th>
              <th className="px-3 py-2">Terminadas</th>
              <th className="px-3 py-2">Estados</th>
            </tr>
          </thead>
          <tbody>
            {datosPorTarea.map((t, idx) => (
              <tr key={idx} className="border-b border-[#23263b] hover:bg-[#23263b]/70 transition">
                <td className="px-3 py-2">{t.materia}</td>
                <td className="px-3 py-2">{t.analista}</td>
                <td className="px-3 py-2">{t.escuela}</td>
                <td className="px-3 py-2 font-bold">{t.total}</td>
                <td className="px-3 py-2 font-bold" style={{ color: colors.pendiente }}>{t.estados.Pendiente}</td>
                <td className="px-3 py-2 font-bold" style={{ color: colors.progreso }}>{t.estados["En progreso"]}</td>
                <td className="px-3 py-2 font-bold" style={{ color: colors.terminado }}>{t.estados.Terminado}</td>
                <td className="px-3 py-2">
                  <Doughnut
                    data={{
                      labels: ["Pendiente", "En progreso", "Terminado"],
                      datasets: [{
                        data: [
                          t.estados.Pendiente,
                          t.estados["En progreso"],
                          t.estados.Terminado,
                        ],
                        backgroundColor: [colors.pendiente, colors.progreso, colors.terminado],
                        borderColor: "#23263b",
                        borderWidth: 2,
                      }]
                    }}
                    options={{
                      plugins: {
                        legend: { display: false }
                      },
                      cutout: "65%",
                    }}
                    width={44}
                    height={44}
                  />
                </td>
              </tr>
            ))}
            {datosPorTarea.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">No hay tareas para mostrar</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

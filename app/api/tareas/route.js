import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'tareas.json');

function readData() {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const allowedFields = [
  'Escuela',
  'Nombre del Programa',
  'Nivel de Estudios',
  'Trámite',
  'Modalidad',
  'Fecha de Radicación',
  'Fecha de Visita de padres',
  'Semestre',
  '# Asignaturas',
  'Entrega del plan de estudios a Fábrica de contenidos',
  'Entrega del plan de Virtualización',
  'Entrega Contenidos',
  '1ra Entrega Virtualización',
  'Estado 1ra entrega',
  'Revisión Check List',
  'Entrega Ajustes',
  'Ejecución Ajustes',
  'Ajustes Asesor',
  'Entrega Final Ajustes',
  'Estado Fabrica'
];

export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

export async function POST(req) {
  const newEntry = await req.json();
  const data = readData();

  const filteredEntry = {};
  for (const field of allowedFields) {
    filteredEntry[field] = newEntry[field] || '';
  }

  data.push(filteredEntry);
  writeData(data);

  return NextResponse.json({ success: true, message: 'Registro agregado correctamente' });
}

export async function DELETE(req) {
  const { index } = await req.json();
  const data = readData();

  if (typeof index !== 'number' || index < 0 || index >= data.length) {
    return NextResponse.json({ success: false, message: 'Índice inválido.' }, { status: 400 });
  }

  data.splice(index, 1);
  writeData(data);

  return NextResponse.json({ success: true, message: 'Registro eliminado correctamente' });
}

export async function PUT(req) {
  const { index, updatedData } = await req.json();
  const data = readData();

  if (typeof index !== 'number' || index < 0 || index >= data.length) {
    return NextResponse.json({ success: false, message: 'Índice inválido.' }, { status: 400 });
  }

  for (const field of allowedFields) {
    data[index][field] = updatedData[field] || '';
  }

  writeData(data);

  return NextResponse.json({ success: true, message: 'Registro editado correctamente' });
}

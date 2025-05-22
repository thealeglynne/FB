import { NextResponse } from 'next/server';

const BIN_ID = '682f27e08960c979a59f5afe';
const API_KEY_MASTER = '$2a$10$AFjAT/OLBCOFkqO83WSIbO9w31.wq.9YRPvSPZoz4xizM66bT3t6S'; // X-Master-Key
const API_KEY_ACCESS = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e'; // X-Access-Key

const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const allowedFields = [
  "Escuela", "Nombre del Programa", "Nivel de Estudios", "Trámite", "Modalidad",
  "Fecha de Radicación", "Fecha de Visita de padres", "Semestre", "# Asignaturas",
  "Entrega del plan de estudios a Fábrica de contenidos", "Entrega del plan de Virtualización",
  "Entrega Contenidos", "1ra Entrega Virtualización", "Estado 1ra entrega", "Revisión Check List",
  "Entrega Ajustes", "Ejecución Ajustes", "Ajustes Asesor", "Entrega Final Ajustes", "Estado Fabrica"
];

async function fetchData() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        'X-Access-Key': API_KEY_ACCESS,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Error al obtener datos: ${res.status}`);
    const json = await res.json();
    return Array.isArray(json.record) ? json.record : [];
  } catch {
    return [];
  }
}

async function updateData(newData) {
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY_MASTER
      },
      body: JSON.stringify(newData)
    });
    if (!res.ok) throw new Error(`Error al actualizar datos: ${res.status}`);
    return await res.json();
  } catch {
    throw new Error('Error actualizando los datos');
  }
}

export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error al obtener los datos' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const newEntry = await req.json();
    const data = await fetchData();

    const filteredEntry = {};
    allowedFields.forEach(field => {
      filteredEntry[field] = newEntry[field] || '';
    });

    data.push(filteredEntry);
    await updateData(data);

    return NextResponse.json({
      success: true,
      message: 'Registro agregado correctamente'
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error al agregar el registro' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { index } = await req.json();
    const data = await fetchData();

    if (typeof index !== 'number' || index < 0 || index >= data.length) {
      return NextResponse.json(
        { success: false, message: 'Índice inválido' },
        { status: 400 }
      );
    }

    data.splice(index, 1);
    await updateData(data);

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado correctamente'
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error al eliminar el registro' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { index, updatedData } = await req.json();
    const data = await fetchData();

    if (typeof index !== 'number' || index < 0 || index >= data.length) {
      return NextResponse.json(
        { success: false, message: 'Índice inválido' },
        { status: 400 }
      );
    }

    allowedFields.forEach(field => {
      if (updatedData.hasOwnProperty(field)) {
        data[index][field] = updatedData[field] || '';
      }
    });

    await updateData(data);

    return NextResponse.json({
      success: true,
      message: 'Registro actualizado correctamente'
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error al actualizar el registro' },
      { status: 500 }
    );
  }
}

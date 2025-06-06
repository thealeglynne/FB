import { NextResponse } from 'next/server';

const BIN_ID = '682f27e08960c979a59f5afe'; // <-- Este es el BIN correcto
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const API_KEY_MASTER = '$2a$10$CWeZ66JKpedXMgIy/CDyYeEoH18x8tgxZDNBGDeHRSAusOVtHrwce';
const API_KEY_ACCESS = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

const allowedFields = [
  "Escuela", "Nombre del Programa", "Nivel de Estudios", "Trámite", "Modalidad",
  "Fecha de Radicación", "Fecha de Visita de padres", "Semestre", "# Asignaturas",
  "Entrega del plan de estudios a Fábrica de contenidos", "Entrega del plan de Virtualización",
  "Entrega Contenidos", "1ra Entrega Virtualización", "Estado 1ra entrega", "Revisión Check List",
  "Entrega Ajustes", "Ejecución Ajustes", "Ajustes Asesor", "Entrega Final Ajustes", "Estado Fabrica"
];

async function fetchData() {
  try {
    const res = await fetch(`${API_URL}/latest`, {
      headers: {
        'X-Access-Key': API_KEY_ACCESS,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Error al obtener datos: ${res.status}`);
    const json = await res.json();
    return Array.isArray(json.record) ? json.record : [];
  } catch (err) {
    console.error('Error fetchData:', err);
    return [];
  }
}

async function updateData(newData) {
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY_MASTER,
      'X-Bin-Versioning': 'false'
    },
    body: JSON.stringify(newData)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error actualizando datos: ${res.status} - ${txt}`);
  }
  return await res.json();
}

export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Error al obtener los datos', error: err.message },
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
  } catch (err) {
    console.error('POST error:', err);
    return NextResponse.json(
      { success: false, message: 'Error al agregar el registro', error: err.message },
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
  } catch (err) {
    console.error('DELETE error:', err);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar el registro', error: err.message },
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
  } catch (err) {
    console.error('PUT error:', err);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar el registro', error: err.message },
      { status: 500 }
    );
  }
}

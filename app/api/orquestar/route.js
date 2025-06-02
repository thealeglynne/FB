import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(req) {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'ensamblador.py');
    exec(`python3 "${scriptPath}"`, { cwd: path.dirname(scriptPath) }, (error, stdout, stderr) => {
      if (error) {
        return resolve(NextResponse.json({ success: false, error: stderr || error.message }, { status: 500 }));
      }
      let contenido = "";
      try {
        const reportePath = path.join(path.dirname(scriptPath), 'ReporteFinal.txt');
        contenido = fs.readFileSync(reportePath, 'utf8');
      } catch (e) {
        return resolve(NextResponse.json({ success: false, error: 'No se pudo leer el reporte generado.' }, { status: 500 }));
      }
      return resolve(NextResponse.json({ success: true, output: contenido }, { status: 200 }));
    });
  });
}

export function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
}

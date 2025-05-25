import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Gerente hardcodeada
const USERS = [
  { username: 'gerente', password: '1234', role: 'gerencia' },
];

// Configuración JSONbin
const BIN_ID = '683358498960c979a5a0fa92';
const API_KEY = '$2a$10$TO5Moe9xid2H7DhOnwMqUuPkxgX0SZPQiQQ9f2BNiB5AFojjArd9e';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    console.log('Credenciales recibidas:', username, password);

    if (!process.env.JWT_SECRET) {
      console.error('Falta la variable de entorno JWT_SECRET');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Primero, valida la gerente localmente
    const gerente = USERS.find(u => u.username === username && u.password === password);
    if (gerente) {
      const token = jwt.sign(
        { username: gerente.username, role: gerente.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const response = NextResponse.json({ message: 'Inicio de sesión exitoso', role: gerente.role });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      });
      return response;
    }

    // Si no es gerente, busca en JSONbin (usuarios dinámicos)
    let usuariosJsonBin = [];
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        headers: { 'X-Access-Key': API_KEY }
      });
      const data = await res.json();
      usuariosJsonBin = Array.isArray(data.record) ? data.record : [];
    } catch (error) {
      console.error('Error accediendo a JSONbin:', error);
      return NextResponse.json({ error: 'No se pudo validar el usuario externo.' }, { status: 500 });
    }

    // Busca al usuario por username y password
    const user = usuariosJsonBin.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      console.warn('Credenciales inválidas');
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Crea el token (incluye rol, equipo, nombre, correo, etc.)
    const tokenPayload = {
      username: user.username,
      role: user.rol,
      equipo: user.equipo,
      nombreCompleto: user.nombreCompleto,
      correo: user.correo
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      role: user.rol,
      equipo: user.equipo,
      nombreCompleto: user.nombreCompleto,
      correo: user.correo
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    return response;
  } catch (error) {
    console.error('Error en el login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

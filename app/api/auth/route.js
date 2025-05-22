import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const USERS = [
  { username: 'gerente', password: '1234', role: 'gerencia' },
  { username: 'juan', password: '1234', role: 'lider' },
  { username: 'ana', password: '1234', role: 'analista' },
  { username: 'pedro', password: '1234', role: 'auxiliar' },
  { username: 'laura', password: '1234', role: 'practicante' },
];

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    console.log('Credenciales recibidas:', username, password);

    // Verifica si la variable de entorno existe
    if (!process.env.JWT_SECRET) {
      console.error('Falta la variable de entorno JWT_SECRET');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const user = USERS.find(u => u.username === username && u.password === password);
    if (!user) {
      console.warn('Credenciales inválidas');
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Crea el token
    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = NextResponse.json({ message: 'Inicio de sesión exitoso', role: user.role });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // usa https en producción
      sameSite: 'lax',
      path: '/',
      maxAge: 3600, // 1 hora
    });

    return response;
  } catch (error) {
    console.error('Error en el login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

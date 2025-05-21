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
  const { username, password } = await req.json();

  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  const response = NextResponse.json({ message: 'Login successful', role: user.role });
  response.cookies.set('token', token, { httpOnly: true });

  return response;
}

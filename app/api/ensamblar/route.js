// /app/api/ensamblar/route.js
export async function POST() {
  const backendRes = await fetch('https://backfb-1.onrender.com/api/ensamblar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await backendRes.json();
  return new Response(JSON.stringify(data), {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' }
  });
}

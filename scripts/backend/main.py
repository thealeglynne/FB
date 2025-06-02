from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import subprocess
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O ["http://localhost:3000"] si quieres solo Next.js local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/crear-contenido")
async def crear_contenido():
    """Ejecuta ensamblador.py y genera los archivos"""
    # Ajusta la ruta según tu estructura: ../ensamblador.py desde /backend
    scripts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    result = subprocess.run(
        ["python", "ensamblador.py"],
        capture_output=True,
        text=True,
        cwd=scripts_dir
    )
    pdf_path = os.path.join(scripts_dir, "ReporteFinal.pdf")
    if not os.path.exists(pdf_path):
        return JSONResponse(status_code=500, content={"error": "No se generó el PDF."})
    return {"message": "Contenido generado correctamente", "output": result.stdout}

@app.get("/descargar-pdf")
def descargar_pdf():
    scripts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    pdf_path = os.path.join(scripts_dir, "ReporteFinal.pdf")
    if not os.path.exists(pdf_path):
        return JSONResponse(status_code=404, content={"error": "PDF no encontrado"})
    return FileResponse(pdf_path, filename="ReporteFinal.pdf", media_type="application/pdf")

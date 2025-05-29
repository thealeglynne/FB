import subprocess
import json
import os

AGENTES = [
    ("introduccion", "AgenteIntroduccion.py"),
    ("temas", "AgenteTemas.py"),
    ("conceptos_clave", "Agente7conceptosClave.py"),
    ("ensayo", "AgenteEnsayo.py"),
    ("conclusiones", "AgenteConclusiones.py"),
]

contexto = {}

def run_agent(agente, contexto):
    # Escribe el contexto acumulado para que el agente lo lea
    with open("contexto_global.json", "w", encoding="utf-8") as f:
        json.dump(contexto, f, indent=2, ensure_ascii=False)

    # Ejecuta el agente
    result = subprocess.run(
        ["python", agente],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def main():
    for key, script in AGENTES:
        print(f"\n========== Ejecutando {script} ==========\n")
        output = run_agent(script, contexto)
        contexto[key] = output
        with open(f"output_{script.replace('.py','.txt')}", "w", encoding="utf-8") as f:
            f.write(output)
    # Guarda todo el contexto al final
    with open("outputs.json", "w", encoding="utf-8") as f:
        json.dump(contexto, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()

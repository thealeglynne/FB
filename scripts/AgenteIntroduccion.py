import os
import requests
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain

# ------------ CONFIGURACIÓN ------------ #
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "5f7dbe7e7ce70029c6cddd738417a3e4132d6e47")
JSON_BIN_ID = "682f27e08960c979a59f5afe"
JSON_BIN_API_KEY = "$2a$10$AFjAT/OLBCOFkqO83WSIbO9w31.wq.9YRPvSPZoz4xizM66bT3t6S"  # TU API KEY

# ---- PROMPT PARA BUSCAR TEMÁTICAS/CONTENIDOS DE LA MATERIA ----
query_prompt = PromptTemplate(
    input_variables=["nombre", "nivel", "modalidad", "semestre"],
    template=(
        "Eres un experto en generación de contenidos universitarios. "
        "Tu tarea es buscar información y tendencias de contenidos para la materia '{nombre}', "
        "nivel '{nivel}', modalidad '{modalidad}', semestre {semestre}. "
        "Genera una consulta de Google muy precisa y profesional para encontrar los contenidos más actuales y oficiales de la materia. "
        "Devuelve SOLO la consulta, sin explicaciones."
    )
)

# ---- PROMPT PARA REDACTAR INTRODUCCIÓN ----
introduccion_prompt = PromptTemplate(
    input_variables=["nombre", "nivel", "modalidad", "semestre", "context"],
    template=(
        "Actúa como un experto generador de contenidos universitarios. "
        "Tienes que escribir la introducción para la unidad principal de la materia '{nombre}', nivel '{nivel}', modalidad '{modalidad}', semestre {semestre}. "
        "Utiliza la siguiente información encontrada en internet para que la introducción sea relevante y profesional:\n{context}\n\n"
        "Redacta exactamente 3 párrafos claros, académicos y motivadores donde expliques: "
        "1) qué se va a ver en la unidad, "
        "2) su importancia, "
        "3) cómo se conecta con el desarrollo del estudiante.\n"
        "Al final, escribe los objetivos de aprendizaje en una lista clara y concreta (empieza con 'Objetivos de aprendizaje:')."
         "Todo el contenido debe ir en español"
    )
)

llm = ChatGroq(
    model_name="llama3-70b-8192",
    api_key=GROQ_API_KEY,
    temperature=0.32,
    max_tokens=950
)

query_chain = LLMChain(llm=llm, prompt=query_prompt)
introduccion_chain = LLMChain(llm=llm, prompt=introduccion_prompt)

def fetch_last_materia():
    url = f"https://api.jsonbin.io/v3/b/{JSON_BIN_ID}/latest"
    headers = {
        "X-Master-Key": JSON_BIN_API_KEY,
        "Content-Type": "application/json"
    }
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        print(f"Error {res.status_code} al acceder al bin: {res.text}")
        raise Exception("No se pudo acceder al JSON Bin, revisa tu API KEY y permisos.")
    record = res.json().get("record")
    if isinstance(record, list):
        if not record:
            return None
        return record[-1]
    return record

def search_web_serper(query):
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    data = {"q": query}
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        print("Error en búsqueda SERPER:", response.status_code, response.text)
        return {"error": "No se pudo realizar la búsqueda"}

def get_best_snippets(serper_response, limit=6):
    if "organic" not in serper_response:
        return ""
    snippets = [r.get("snippet", "") for r in serper_response["organic"] if "snippet" in r]
    return "\n".join(snippets[:limit])

def generar_introduccion_llm_con_serpe():
    materia = fetch_last_materia()
    if not materia:
        print("No se encontró ninguna materia en el bin.")
        return

    nombre = materia.get("Nombre del Programa", "")
    nivel = materia.get("Nivel de Estudios", "")
    modalidad = materia.get("Modalidad", "")
    semestre = materia.get("Semestre", "")

    print(f"\n📚 Generando INTRODUCCIÓN de unidad para:\n"
          f"Materia: {nombre}\nNivel: {nivel}\nModalidad: {modalidad}\nSemestre: {semestre}\n")

    # Paso 1: El LLM crea la consulta ideal para buscar tendencias/contenidos
    search_query = query_chain.run(
        nombre=nombre,
        nivel=nivel,
        modalidad=modalidad,
        semestre=semestre
    )
    print(f"\n🔎 Consulta de búsqueda generada por el LLM:\n{search_query}")

    # Paso 2: Hacemos la búsqueda en Serper
    serper_data = search_web_serper(search_query)
    if "error" in serper_data:
        print("Error en búsqueda Serper:", serper_data["error"])
        return

    context = get_best_snippets(serper_data)
    if not context:
        print("No se encontraron snippets relevantes.")
        return

    # Paso 3: El LLM genera la introducción usando el contexto web real
    introduccion = introduccion_chain.run(
        nombre=nombre,
        nivel=nivel,
        modalidad=modalidad,
        semestre=semestre,
        context=context
    )

    print("\n=== INTRODUCCIÓN GENERADA POR LA IA ===\n")
    print(introduccion)

if __name__ == "__main__":
    try:
        generar_introduccion_llm_con_serpe()
    except Exception as e:
        print("\n🚨 ERROR en la ejecución:", str(e))
        print("Tips: Revisa tu API Key, tu bin, y tus permisos de JsonBin.io. "
              "Haz un curl/test simple antes de ejecutar este script si el problema persiste.\n")

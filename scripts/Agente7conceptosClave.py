import os
import requests
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain

# ------------ CONFIGURACIÓN ------------ #
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "5f7dbe7e7ce70029c6cddd738417a3e4132d6e47")
JSON_BIN_ID = "682f27e08960c979a59f5afe"
JSON_BIN_API_KEY = "$2a$10$AFjAT/OLBCOFkqO83WSIbO9w31.wq.9YRPvSPZoz4xizM66bT3t6S"

# ---- LEE EL CONTEXTO GLOBAL GENERADO POR OTROS AGENTES ----
def leer_contexto_global():
    if os.path.exists("contexto_global.json"):
        with open("contexto_global.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

# ---- PROMPT MEJORADO: INCLUYE CONTEXTO DE OTROS AGENTES ----
conceptos_prompt = PromptTemplate(
    input_variables=["nombre", "nivel", "modalidad", "semestre", "context", "contexto_previos"],
    template=(
        "Eres un generador experto de contenidos universitarios. "
        "Tienes como referencia toda la información generada previamente por el equipo de agentes:\n"
        "{contexto_previos}\n\n"
        "Adicionalmente, usa la siguiente información actualizada encontrada en internet:\n{context}\n\n"
        "A partir de todo el contexto anterior, genera y desarrolla SIETE conceptos clave relacionados con la materia '{nombre}', "
        "nivel '{nivel}', modalidad '{modalidad}', semestre {semestre}. "
        "Cada concepto debe tener un título de máximo 3 palabras (sin subtítulo ni explicación extra), estar numerado y desarrollado "
        "en un párrafo académico, claro, extenso (más de 10 líneas), profundo y no repetitivo. "
        "Asegúrate de que los conceptos sean los más relevantes según el contexto actual, la materia y los temas previos. "
        "Redacta en español, con alto nivel académico y cohesión con el resto de la unidad."
    )
)

# ---- PROMPT PARA LA CONSULTA DE GOOGLE ----
query_prompt = PromptTemplate(
    input_variables=["nombre", "nivel", "modalidad", "semestre"],
    template=(
        "Eres un diseñador curricular universitario y un experto en búsquedas avanzadas. "
        "Tienes que buscar los conceptos clave más relevantes y actuales para la materia '{nombre}', que corresponde al nivel '{nivel}', modalidad '{modalidad}', en el semestre {semestre}. "
        "Genera una consulta de Google muy precisa y profesional para encontrar tendencias y conceptos clave universitarios u oficiales para esta asignatura. "
        "Devuelve SOLO la consulta para Google, nada más."
    )
)

llm = ChatGroq(
    model_name="llama3-70b-8192",
    api_key=GROQ_API_KEY,
    temperature=0.32,
    max_tokens=1800
)

query_chain = LLMChain(llm=llm, prompt=query_prompt)
conceptos_chain = LLMChain(llm=llm, prompt=conceptos_prompt)

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

def get_best_snippets(serper_response, limit=8):
    if "organic" not in serper_response:
        return ""
    snippets = [r.get("snippet", "") for r in serper_response["organic"] if "snippet" in r]
    return "\n".join(snippets[:limit])

def generar_conceptos_llm_con_serpe():
    # 1. Lee contexto de otros agentes (introducción, temas, ensayo, etc.)
    contexto_previos = leer_contexto_global()
    previos_texto = ""
    # Organiza el contexto anterior de forma clara
    for k, v in contexto_previos.items():
        previos_texto += f"\n--- {k.upper()} ---\n{v}\n"

    # 2. Obtiene los datos de la materia
    materia = fetch_last_materia()
    if not materia:
        print("No se encontró ninguna materia en el bin.")
        return

    nombre = materia.get("Nombre del Programa", "")
    nivel = materia.get("Nivel de Estudios", "")
    modalidad = materia.get("Modalidad", "")
    semestre = materia.get("Semestre", "")

    print(f"\n📚 Generando 7 conceptos clave para:\n"
          f"Materia: {nombre}\nNivel: {nivel}\nModalidad: {modalidad}\nSemestre: {semestre}\n")

    # 3. El LLM crea la consulta ideal para buscar conceptos clave/contenidos
    search_query = query_chain.run(
        nombre=nombre,
        nivel=nivel,
        modalidad=modalidad,
        semestre=semestre
    )
    print(f"\n🔎 Consulta de búsqueda generada por el LLM:\n{search_query}")

    # 4. Hacemos la búsqueda en Serper
    serper_data = search_web_serper(search_query)
    if "error" in serper_data:
        print("Error en búsqueda Serper:", serper_data["error"])
        return

    context = get_best_snippets(serper_data, limit=8)
    if not context:
        print("No se encontraron snippets relevantes.")
        return

    # 5. El LLM crea los 7 conceptos clave usando el contexto web + outputs previos
    conceptos = conceptos_chain.run(
        nombre=nombre,
        nivel=nivel,
        modalidad=modalidad,
        semestre=semestre,
        context=context,
        contexto_previos=previos_texto
    )

    print("\n=== SIETE CONCEPTOS CLAVE RECOMENDADOS POR LA IA (CON CONTEXTO RETROALIMENTADO) ===\n")
    print(conceptos)
    # También puedes guardar el output, si lo deseas:
    with open("output_Agente7conceptosClave.txt", "w", encoding="utf-8") as f:
        f.write(conceptos)

if __name__ == "__main__":
    try:
        generar_conceptos_llm_con_serpe()
    except Exception as e:
        print("\n🚨 ERROR en la ejecución:", str(e))
        print("Tips: Revisa tu API Key, tu bin, y tus permisos de JsonBin.io.\n")

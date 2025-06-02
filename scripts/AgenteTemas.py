# Encabezado común (copiar el bloque de arriba aquí)
import os
import requests
import json
import sys
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain

# API Keys and Configuration (valores por defecto si no están en ENV)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "5f7dbe7e7ce70029c6cddd738417a3e4132d6e47")
JSON_BIN_ID = os.getenv("JSON_BIN_ID", "682f27e08960c979a59f5afe")
JSON_BIN_API_KEY = os.getenv("JSON_BIN_API_KEY", "$2a$10$AFjAT/OLBCOFkqO83WSIbO9w31.wq.9YRPvSPZoz4xizM66bT3t6S") # Clave V2, usada con X-Master-Key según plantilla
CONTEXTO_GLOBAL_FILE = "contexto_global.json"

# LLM Configuration
llm = ChatGroq(
    model_name="llama3-70b-8192", 
    api_key=GROQ_API_KEY,
    temperature=0.4, # Creatividad moderada para desarrollo de temas
    max_tokens=3000  # Espacio para dos secciones completas
)

def leer_contexto_global():
    if os.path.exists(CONTEXTO_GLOBAL_FILE):
        with open(CONTEXTO_GLOBAL_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                print(f"Advertencia: {CONTEXTO_GLOBAL_FILE} contiene JSON inválido. Se devuelve contexto vacío.")
                return {}
    return {}

def fetch_course_data():
    url = f"https://api.jsonbin.io/v3/b/{JSON_BIN_ID}/latest"
    headers = {"X-Master-Key": JSON_BIN_API_KEY}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()
        
        record = data.get("record")
        if record is None: 
            if isinstance(data, dict) and "Nombre del Programa" in data:
                 record = data
            elif isinstance(data, list) and data: 
                 record = data[-1]
                 if not isinstance(record, dict):
                     print(f"Advertencia: El último elemento del JSON Bin no es un diccionario: {record}")
                     return None
            else:
                print(f"Error: La respuesta del JSON Bin no contiene la clave 'record' ni es el registro directamente. Respuesta: {data}")
                return None
        
        if isinstance(record, list): 
            return record[-1] if record else None
        elif isinstance(record, dict): 
            return record
        else:
            print(f"Error: El contenido de 'record' no es una lista ni un diccionario: {type(record)}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"Error: Timeout al intentar acceder a JSON Bin ({url}).")
    except requests.exceptions.RequestException as e:
        print(f"Error de red al acceder al JSON Bin: {e}")
    except json.JSONDecodeError:
        print(f"Error al decodificar JSON de la respuesta del bin: {res.text if 'res' in locals() else 'No response'}")
    except Exception as e:
        print(f"Error inesperado al obtener datos del curso: {e}")
    return None

def search_web_serper(query, limit_organic=3):
    url = "https://google.serper.dev/search"
    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
    data = {"q": query}
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print(f"Error: Timeout en la búsqueda web con Serper para query: {query}")
    except requests.exceptions.RequestException as e:
        print(f"Error de red en la búsqueda web con Serper: {e}")
    except json.JSONDecodeError:
        print(f"Error al decodificar JSON de la respuesta de Serper: {response.text if 'response' in locals() else 'No response'}")
    return {"error": "No se pudo realizar la búsqueda"}

def get_best_snippets(serper_response, limit=5):
    if not serper_response or "error" in serper_response or "organic" not in serper_response:
        return ""
    snippets = [r.get("snippet", "") for r in serper_response["organic"] if r.get("snippet")]
    return "\n".join(snippets[:limit])

# === PROMPTS DEL AGENTE ===

# Prompt para la Sección "Descubre el Poder de..."
discover_power_prompt_template = PromptTemplate(
    input_variables=["nombre_curso", "main_concept_discover", "context_web", "contexto_previos"],
    template=(
        "Redacta una sección institucional, clara y referencial para infografía, titulada '¡Descubre el Poder de {main_concept_discover}!'. "
        "Incluye antecedentes previos:\n{contexto_previos}\nY contexto web:\n{context_web}\n"
        "\n"
        "Estructura:\n"
        "- Párrafo introductorio que explique la relevancia y el impacto práctico de {main_concept_discover} en la formación y ejercicio profesional, con tono motivador.\n"
        "- Siete (7) secciones numeradas. Para cada una:\n"
        "   - Escribe 'Sección X:'\n"
        "   - Título breve, claro y sugerente (puede usarse en la gráfica).\n"
        "   - Texto de 3-5 frases, explicando el aspecto clave, incluye un ejemplo o aplicación, y, si corresponde, relaciónalo con otras competencias de la unidad.\n"
        "Cuida el lenguaje editorial y visualiza cómo será usada en infografía y video. No incluyas títulos extra ni marcas de formato, solo el texto."
    )
)


# Prompt para la Sección "La Magia de..." (Video Script Style)
magic_of_prompt_template = PromptTemplate(
    input_variables=["nombre_curso", "core_concept_magic", "context_web", "contexto_previos"],
    template=(
        "Actúa como guionista institucional para un video educativo animado corto, titulado 'La Magia de {core_concept_magic}' en el contexto de '{nombre_curso}'. "
        "Revisa antecedentes previos:\n{contexto_previos}\nY contexto web:\n{context_web}\n"
        "\n"
        "Sigue este formato:\n"
        "[Inicio del Video]\n"
        "[Introducción] - Presenta el reto/concepto y su importancia en máximo 3 líneas.\n"
        "[Desarrollo] - Explica {core_concept_magic} paso a paso, con ejemplos visuales y analogías sencillas, relacionando con la práctica profesional y otras competencias.\n"
        "[Cierre] - Recapitula en 2-3 frases, e incluye un desafío concreto o pregunta motivadora para el estudiante.\n"
        "Incluye sugerencias visuales para cada segmento, pensadas para ilustración o animación institucional. Mantén el tono formal y motivador."
    )
)



discover_power_chain = LLMChain(llm=llm, prompt=discover_power_prompt_template)
magic_of_chain = LLMChain(llm=llm, prompt=magic_of_prompt_template)

def main():
    print("--- Ejecutando AgenteTemas ---")
    contexto_global = leer_contexto_global()
    previos_texto = "\n".join([f"Contenido de '{k}':\n{v}\n" for k, v in contexto_global.items()])
    if not previos_texto:
        previos_texto = "No hay antecedentes de secciones previas."

    materia = fetch_course_data()
    if not materia:
        print("AgenteTemas: No se encontró información de la materia. Terminando.")
        sys.stdout.write("Error: No se pudo obtener la información del curso.")
        return

    nombre_curso = materia.get("Nombre del Programa", "Curso Desconocido")
    
    # Derivación simple de sub-temas (esto podría ser más sofisticado)
    main_concept_discover = f"los Fundamentos Clave de {nombre_curso}" 
    core_concept_magic = f"un Proceso Esencial en {nombre_curso}"

    # Generar Sección 1: "Descubre el Poder de..."
    print(f"AgenteTemas: Generando 'Descubre el Poder de {main_concept_discover}'...")
    search_query_discover = f"aspectos fundamentales y beneficios de {main_concept_discover} en {nombre_curso}"
    serper_data_discover = search_web_serper(search_query_discover, limit_organic=4)
    context_web_discover = get_best_snippets(serper_data_discover, limit=4)
    if not context_web_discover: context_web_discover = f"No se encontró información web adicional sobre {main_concept_discover}."
    
    discover_contenido = ""
    try:
        discover_contenido = discover_power_chain.run(
            nombre_curso=nombre_curso,
            main_concept_discover=main_concept_discover,
            context_web=context_web_discover,
            contexto_previos=previos_texto
        )
    except Exception as e:
        discover_contenido = f"Error al generar sección 'Descubre el Poder': {str(e)}"
        print(discover_contenido)

    # Generar Sección 2: "La Magia de..."
    print(f"AgenteTemas: Generando 'La Magia de {core_concept_magic}'...")
    search_query_magic = f"explicación simple y analogías de {core_concept_magic} aplicado a {nombre_curso}"
    serper_data_magic = search_web_serper(search_query_magic, limit_organic=3)
    context_web_magic = get_best_snippets(serper_data_magic, limit=3)
    if not context_web_magic: context_web_magic = f"No se encontró información web adicional sobre {core_concept_magic}."

    magic_contenido = ""
    try:
        magic_contenido = magic_of_chain.run(
            nombre_curso=nombre_curso,
            core_concept_magic=core_concept_magic,
            context_web=context_web_magic,
            contexto_previos=previos_texto + f"\n\nSección Previa (Descubre el Poder):\n{discover_contenido}" # Añadir contexto de la sección recién generada
        )
    except Exception as e:
        magic_contenido = f"Error al generar sección 'La Magia de': {str(e)}"
        print(magic_contenido)

    # Combinar y enviar salida
    # El ensamblador usará este separador para formatear correctamente.
    output_combinado = f"{discover_contenido}\n\n__________________________________________________\n\n{magic_contenido}"
    sys.stdout.write(output_combinado)
    print("\n--- AgenteTemas finalizado ---")

if __name__ == "__main__":
    main()
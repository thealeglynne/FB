import json
import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain

# === CONFIGURACIÓN === #
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

def leer_outputs():
    # Puedes también hacer un requests.get a tu bin si prefieres, aquí es local
    with open("outputs.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    context = "\n\n".join([
        f"INTRODUCCIÓN:\n{data.get('introduccion', '')}",
        f"CONCEPTOS CLAVE:\n{data.get('conceptos_clave', '')}",
        f"ENSAYO:\n{data.get('ensayo', '')}",
        f"TEMAS:\n{data.get('temas', '')}"
    ])
    return context

conclusiones_prompt = PromptTemplate(
    input_variables=["contexto"],
    template=(
        "Actúa como un experto en docencia universitaria y redacción académica. "
        "A continuación tienes el desarrollo completo de una unidad temática, con introducción, conceptos clave, ensayo y temáticas abordadas:\n\n"
        "{contexto}\n\n"
        "Con base en TODA la información anterior, redacta 4 conclusiones profundas y extensas (cada una de al menos 11 líneas), "
        "resumidas en párrafos separados. Cada conclusión debe analizar, sintetizar y reflexionar críticamente sobre los aportes, los retos y la relevancia de la unidad, "
        "los temas y los conceptos desarrollados, destacando cómo contribuyen a la formación profesional en el área correspondiente. "
        "No repitas la introducción ni el temario, enfócate en los aprendizajes, conexiones prácticas, desafíos, impacto actual y proyección futura. "
        "No escribas títulos ni números, solo los 4 párrafos seguidos."
         "Todo el contenido debe ir en español"
    )
)

llm = ChatGroq(
    model_name="llama3-70b-8192",
    api_key=GROQ_API_KEY,
    temperature=0.3,
    max_tokens=2200
)

conclusiones_chain = LLMChain(llm=llm, prompt=conclusiones_prompt)

def generar_conclusiones():
    contexto = leer_outputs()
    print("\n📝 Generando conclusiones integradoras para la unidad completa...\n")
    conclusiones = conclusiones_chain.run(contexto=contexto)
    print("\n=== CONCLUSIONES GENERADAS POR LA IA ===\n")
    print(conclusiones)
    with open("output_AgenteConclusiones.txt", "w", encoding="utf-8") as f:
        f.write(conclusiones)

if __name__ == "__main__":
    generar_conclusiones()

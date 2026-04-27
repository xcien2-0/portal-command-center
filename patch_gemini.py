import os

agent_path = os.path.expanduser("~/Desktop/Live status Xcien/backend/agents/director_general_v2.py")
with open(agent_path, "r") as f:
    content = f.read()

# Replace anthropic import
content = content.replace("import anthropic", "import google.generativeai as genai")

# Replace client initialization
content = content.replace(
    'self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))',
    'genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))'
)

# Replace system_blocks and message execution
old_execute = """        system_blocks = [
            {
                "type": "text",
                "text": (
                    "Eres el DIRECTOR GENERAL de XCIEN, empresa ISP que opera 5 operadoras: "
                    "XCIEN, Wispi, Luminet WAN, Huus y Sandur.\\n"
                    "Tienes a tu cargo: Operaciones de Campo, RRHH, NOC y Dispatch.\\n"
                    "Tu personalidad es profesional, ejecutiva y orientada a resultados. "
                    "Respondes siempre en español. Usas Markdown con bullets y secciones.\\n\\n"
                    "═══ MANUAL MAESTRO DE OPERACIONES ═══\\n"
                    f"{self.contexto_maestro[:6000]}\\n\\n"
                    "═══ INSTRUCCIONES ═══\\n"
                    "1. Analiza la instrucción con los datos REALES del bloque WFM.\\n"
                    "2. Si mencionan un técnico específico, usa sus datos reales.\\n"
                    "3. Si involucra campo, cita la regla del manual.\\n"
                    "4. Da una respuesta ejecutiva, clara y accionable.\\n"
                    "5. Sé conciso pero completo."
                ),
                "cache_control": {"type": "ephemeral"},   # ← CACHÉ AQUÍ
            },
            {
                "type": "text",
                "text": (
                    "═══ DATOS EN TIEMPO REAL (WFM) ═══\\n"
                    f"TÉCNICOS DE CAMPO:\\n{tecnicos_resumen or 'Sin datos WFM disponibles'}\\n\\n"
                    f"TICKETS ACTIVOS:\\n{tickets_resumen or 'Sin tickets activos'}\\n\\n"
                    f"MATRIZ DE HABILIDADES:\\n{skills_resumen}"
                ),
                # Sin cache_control — estos datos cambian frecuentemente
            },
        ]

        api_messages = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "assistant"
            api_messages.append({"role": role, "content": msg.get("content", "")})
        api_messages.append({"role": "user", "content": instruccion_usuario})
        
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=1024,
                system=system_blocks,
                messages=api_messages,
                extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
            )
            response_text = message.content[0].text

            # Log de uso de caché
            usage = message.usage
            cache_hit   = getattr(usage, 'cache_read_input_tokens', 0)
            cache_write = getattr(usage, 'cache_creation_input_tokens', 0)
            input_tokens = getattr(usage, 'input_tokens', 0)
            print(f"\\n💎 [Director General] | tokens_entrada={input_tokens} | cache_escrito={cache_write} | cache_leído={cache_hit}")
            print(response_text)
            return response_text"""

new_execute = """        system_instruction = (
            "Eres el DIRECTOR GENERAL de XCIEN, empresa ISP que opera 5 operadoras: "
            "XCIEN, Wispi, Luminet WAN, Huus y Sandur.\\n"
            "Tienes a tu cargo: Operaciones de Campo, RRHH, NOC y Dispatch.\\n"
            "Tu personalidad es profesional, ejecutiva y orientada a resultados. "
            "Respondes siempre en español. Usas Markdown con bullets y secciones.\\n\\n"
            "═══ MANUAL MAESTRO DE OPERACIONES ═══\\n"
            f"{self.contexto_maestro[:6000]}\\n\\n"
            "═══ DATOS EN TIEMPO REAL (WFM) ═══\\n"
            f"TÉCNICOS DE CAMPO:\\n{tecnicos_resumen or 'Sin datos WFM disponibles'}\\n\\n"
            f"TICKETS ACTIVOS:\\n{tickets_resumen or 'Sin tickets activos'}\\n\\n"
            f"MATRIZ DE HABILIDADES:\\n{skills_resumen}\\n\\n"
            "═══ INSTRUCCIONES ═══\\n"
            "1. Analiza la instrucción con los datos REALES del bloque WFM.\\n"
            "2. Si mencionan un técnico específico, usa sus datos reales.\\n"
            "3. Si involucra campo, cita la regla del manual.\\n"
            "4. Da una respuesta ejecutiva, clara y accionable.\\n"
            "5. Sé conciso pero completo."
        )

        try:
            model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)
            
            gemini_history = []
            for msg in history:
                role = "user" if msg.get("role") == "user" else "model"
                gemini_history.append({"role": role, "parts": [msg.get("content", "")]})
                
            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(instruccion_usuario)
            response_text = response.text

            print(f"\\n💎 [Director General - Gemini]")
            print(response_text)
            return response_text"""

content = content.replace(old_execute, new_execute)

with open(agent_path, "w") as f:
    f.write(content)
print("Updated director_general_v2.py to use Gemini")


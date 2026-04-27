import os
import re

backend_dir = os.path.expanduser("~/Desktop/Live status Xcien/backend")
frontend_dir = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/xcien2/sections")

# 1. Update servidor_academia.py
servidor_path = os.path.join(backend_dir, "servidor_academia.py")
with open(servidor_path, "r") as f:
    servidor_content = f.read()

# Update ChatRequest
if "history: list = []" not in servidor_content:
    servidor_content = servidor_content.replace(
        "class ChatRequest(BaseModel):\n    message: str",
        "class ChatRequest(BaseModel):\n    message: str\n    history: list = []"
    )

# Update director_chat endpoint
if "request.history" not in servidor_content:
    servidor_content = servidor_content.replace(
        "respuesta = dg_agent.ejecutar_orden(request.message)",
        "respuesta = dg_agent.ejecutar_orden(request.message, request.history)"
    )

with open(servidor_path, "w") as f:
    f.write(servidor_content)
print("Updated servidor_academia.py")

# 2. Update director_general_v2.py
agent_path = os.path.join(backend_dir, "agents", "director_general_v2.py")
with open(agent_path, "r") as f:
    agent_content = f.read()

if "history=None" not in agent_content:
    agent_content = agent_content.replace(
        "def ejecutar_orden(self, instruccion_usuario):",
        "def ejecutar_orden(self, instruccion_usuario, history=None):\n        if history is None:\n            history = []"
    )
    
    # Replace messages=[{"role": "user", "content": instruccion_usuario}]
    messages_replacement = """
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
"""
    
    agent_content = re.sub(
        r"        try:\s*message = self\.client\.messages\.create\(\s*model=\"claude-sonnet-4-5-20250929\",\s*max_tokens=1024,\s*system=system_blocks,\s*messages=\[\{\"role\": \"user\", \"content\": instruccion_usuario\}\],",
        messages_replacement.strip(),
        agent_content
    )
    
    with open(agent_path, "w") as f:
        f.write(agent_content)
    print("Updated director_general_v2.py")

# 3. Update DirectorChat.tsx
chat_path = os.path.join(frontend_dir, "DirectorChat.tsx")
with open(chat_path, "r") as f:
    chat_content = f.read()

if "historyToSend" not in chat_content:
    chat_content = chat_content.replace(
        "async function callDirectorAPI(message: string): Promise<string> {",
        "async function callDirectorAPI(message: string, history: {role: string, content: string}[]): Promise<string> {"
    )
    chat_content = chat_content.replace(
        "body: JSON.stringify({ message }),",
        "body: JSON.stringify({ message, history }),"
    )
    
    # Update sendMessage
    send_replacement = """
    const ts = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text, ts };

    // Compact history (last 4 msgs, ignore init)
    const historyToSend = messages
      .filter(m => m.id !== 'init')
      .slice(-4)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await callDirectorAPI(text, historyToSend);
"""
    chat_content = re.sub(
        r"    const ts = new Date\(\)\.toLocaleTimeString.*?try \{\s*const reply = await callDirectorAPI\(text\);",
        send_replacement.strip(),
        chat_content,
        flags=re.DOTALL
    )

    with open(chat_path, "w") as f:
        f.write(chat_content)
    print("Updated DirectorChat.tsx")


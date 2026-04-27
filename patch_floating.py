import os
import re

chat_path = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/xcien2/sections/FloatingChat.tsx")
with open(chat_path, "r") as f:
    content = f.read()

# Change component name
content = content.replace("export default function DirectorChat({ theme }: Props) {", "export default function FloatingChat({ theme }: Props) {")

# Add isOpen state
content = content.replace(
    "const [input, setInput] = useState('');",
    "const [input, setInput] = useState('');\n  const [isOpen, setIsOpen] = useState(false);"
)

# Modify the return statement to wrap the whole chat in a floating container
# We find the start of the return statement
return_start = content.find("return (")
# The chat content starts right after "return ("
chat_ui_original = content[return_start + 8 : content.rfind(");")]

# Replace the outer div with our floating layout
new_return = f"""return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {{isOpen && (
        <div style={{ width: 400, height: 650, background: '#0a0a0a', border: `1px solid ${{theme.border}}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: 16 }}>
          {chat_ui_original.strip()}
        </div>
      )}}
      <button 
        onClick={{() => setIsOpen(!isOpen)}} 
        style={{ 
          width: 64, height: 64, borderRadius: 32, background: theme.accent, 
          color: '#fff', border: 'none', cursor: 'pointer', 
          boxShadow: `0 0 20px ${{theme.accent}}60`, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: 28,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {{isOpen ? '✕' : '🤖'}}
      </button>
    </div>
  );"""

content = content[:return_start] + new_return + "\n}\n"

with open(chat_path, "w") as f:
    f.write(content)
print("Updated FloatingChat.tsx")

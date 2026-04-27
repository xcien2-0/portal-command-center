import os

path = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/xcien2/sections/FloatingChat.tsx")
with open(path, "r") as f:
    content = f.read()

content = content.replace(
    "<div style={ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }>",
    "<div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>"
)

content = content.replace(
    "<div style={ width: 400, height: 650, background: '#0a0a0a', border: `1px solid ${theme.border}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: 16 }>",
    "<div style={{ width: 400, height: 650, background: '#0a0a0a', border: `1px solid ${theme.border}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: 16 }}>"
)

content = content.replace(
    """<button 
        onClick={() => setIsOpen(!isOpen)} 
        style={ 
          width: 64, height: 64, borderRadius: 32, background: theme.accent, """,
    """<button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          width: 64, height: 64, borderRadius: 32, background: theme.accent, """
)

content = content.replace(
    """transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }
      >""",
    """transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >"""
)

with open(path, "w") as f:
    f.write(content)
print("Fixed curly braces in FloatingChat.tsx")

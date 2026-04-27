import os

app_path = os.path.expanduser("~/Desktop/Live status Xcien/src/App.tsx")
with open(app_path, "r") as f:
    content = f.read()

# We need to create a small component or just add a hook call in App.tsx?
# Wait! `getGlobalTheme` is not a hook, but `useViewMode` is.
# We can't use `useViewMode` inside `App` directly because `App` provides it!
# We can create a `HeaderActions` component in App.tsx or just modify the header.
# Let's create a small component in App.tsx
header_actions = """import { useViewMode } from "./contexts/ViewModeContext.tsx";

function HeaderActions() {
  const { mode, toggleMode } = useViewMode();
  return (
    <button
      onClick={toggleMode}
      className="ml-auto flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium border transition-colors"
      style={{
        backgroundColor: mode === 'holo' ? 'rgba(0,180,216,0.1)' : 'transparent',
        borderColor: mode === 'holo' ? 'rgba(0,180,216,0.4)' : 'rgba(255,255,255,0.1)',
        color: mode === 'holo' ? '#00B4D8' : '#94a3b8'
      }}
    >
      {mode === 'holo' ? '✨ Vista Holo Activa' : 'Vista Clásica'}
    </button>
  );
}
"""

content = content.replace('import { ViewModeProvider }', header_actions + '\nimport { ViewModeProvider }')

# Now inject <HeaderActions /> in the header
content = content.replace(
    '<header className="h-10 flex items-center border-b border-border bg-background px-2">\n                    <SidebarTrigger />\n                  </header>',
    '<header className="h-10 flex items-center border-b border-border bg-background px-2">\n                    <SidebarTrigger />\n                    <HeaderActions />\n                  </header>'
)

with open(app_path, "w") as f:
    f.write(content)
print("Updated App.tsx with HeaderActions")


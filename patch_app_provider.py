import os

app_path = os.path.expanduser("~/Desktop/Live status Xcien/src/App.tsx")
with open(app_path, "r") as f:
    content = f.read()

imports = """import { ViewModeProvider } from "./contexts/ViewModeContext.tsx";
import FloatingChat from "./pages/xcien2/sections/FloatingChat.tsx";
import { DEFAULT_THEME } from "./pages/xcien2/types.ts";
"""

content = content.replace('import Xcien2Page from "./pages/xcien2/index.tsx";\n', 'import Xcien2Page from "./pages/xcien2/index.tsx";\n' + imports)

# We need to extract the global theme safely, or we just pass DEFAULT_THEME. The user will be able to customize it if we read from localstorage.
# We will create a small wrapper component inside App.tsx to read the local storage theme, but since we just want FloatingChat to use the neon theme, we can just pass DEFAULT_THEME or dynamically parse it.

app_wrapper = """const getGlobalTheme = () => {
  try {
    const saved = localStorage.getItem('xcien2_theme');
    return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
};

const App = () => (
  <ViewModeProvider>
    <QueryClientProvider client={queryClient}>
"""

content = content.replace("const App = () => (\n  <QueryClientProvider client={queryClient}>\n", app_wrapper)

content = content.replace(
    "      </BrowserRouter>\n    </TooltipProvider>\n  </QueryClientProvider>\n);",
    "      </BrowserRouter>\n      <FloatingChat theme={getGlobalTheme()} />\n    </TooltipProvider>\n  </QueryClientProvider>\n  </ViewModeProvider>\n);"
)

with open(app_path, "w") as f:
    f.write(content)
print("Updated App.tsx with ViewModeProvider and global FloatingChat")

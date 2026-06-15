import os

path = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/Dispatch.tsx")
with open(path, "r") as f:
    content = f.read()

imports = """import { useViewMode } from "../contexts/ViewModeContext.tsx";
import WFMSection from "./xcien2/sections/WFMSection.tsx";
import { DEFAULT_THEME } from "./xcien2/types.ts";
"""
content = imports + content

content = content.replace(
    "export default function Dispatch() {",
    "export default function Dispatch() {\n  const { mode } = useViewMode();\n  const theme = DEFAULT_THEME;\n"
)

content = content.replace(
    "  return (",
    "  if (mode === 'holo') return (\n    <div className=\"flex-1 h-[calc(100vh-2.5rem)] bg-[#0a0a0a] overflow-y-auto relative p-6\">\n      <WFMSection theme={theme} />\n    </div>\n  );\n\n  return ("
)

with open(path, "w") as f:
    f.write(content)
print("Updated Dispatch.tsx")

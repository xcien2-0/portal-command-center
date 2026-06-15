import os

path = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/NOC.tsx")
with open(path, "r") as f:
    content = f.read()

# 1. Imports
imports = """import { useViewMode } from "../contexts/ViewModeContext.tsx";
import NocSection from "./xcien2/sections/NocSection.tsx";
import { DEFAULT_THEME } from "./xcien2/types.ts";
"""
content = imports + content

# 2. Inside NOC component
# Find the start of the NOC component
# `export default function NOC() {`
content = content.replace(
    "export default function NOC() {",
    "export default function NOC() {\n  const { mode } = useViewMode();\n  const theme = DEFAULT_THEME; // or get from local storage if we wanted to be perfectly synced\n"
)

# 3. Conditional render
# We wrap the existing return with `if (mode === 'holo') return <div className="h-full w-full bg-[#0a0a0a] text-white overflow-y-auto"><NocSection theme={theme} /></div>;`
content = content.replace(
    "  return (",
    "  if (mode === 'holo') return (\n    <div className=\"flex-1 h-[calc(100vh-2.5rem)] bg-[#0a0a0a] overflow-y-auto relative\">\n      <NocSection theme={theme} />\n    </div>\n  );\n\n  return ("
)

with open(path, "w") as f:
    f.write(content)
print("Updated NOC.tsx")

import os
import re

types_path = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/xcien2/types.ts")
with open(types_path, "r") as f:
    types_content = f.read()

types_content = re.sub(
    r"export type SectionId = [^;]+;",
    "export type SectionId = 'inicio' | 'noc' | 'academia' | 'wfm' | 'tokens' | 'transacciones' | 'etiquetas' | 'editor' | 'holo';",
    types_content
)
with open(types_path, "w") as f:
    f.write(types_content)
print("Fixed types.ts")

import os

index_path = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/xcien2/index.tsx")
with open(index_path, "r") as f:
    content = f.read()

# 1. Update Imports
content = content.replace(
    "import DirectorChat    from './sections/DirectorChat';",
    "import FloatingChat    from './sections/FloatingChat';"
)

# 2. Update NAV (Remove inicio)
content = content.replace("  { id: 'inicio',   label: 'Inicio',               icon: '🏠' },\n", "")

# 3. Update SECTION_TITLE (Remove inicio)
content = content.replace("  inicio:   'Director General',\n", "")

# 4. Default section state
content = content.replace("useState<SectionId>('inicio');", "useState<SectionId>('noc');")

# 5. Remove DirectorChat from the main switch
content = content.replace("      {section === 'inicio'   && <DirectorChat    theme={theme} />}\n", "")

# 6. Add FloatingChat globally
# Find the end of the <div style={{ flex: 1... container
# Wait, the best place is right before the last </div> of the component.
# Instead of complex finding, just find the `export default function Xcien2Page` and replace the last `</div>` with `<FloatingChat theme={theme} />\n    </div>`
last_div = content.rfind("    </div>\n  );\n}")
if last_div != -1:
    content = content[:last_div] + "      <FloatingChat theme={theme} />\n" + content[last_div:]

with open(index_path, "w") as f:
    f.write(content)

print("Updated index.tsx")

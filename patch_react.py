import os
import re

base_dir = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/xcien2")

# 1. Update types.ts
types_path = os.path.join(base_dir, "types.ts")
with open(types_path, "r") as f:
    types_content = f.read()

if "'holo'" not in types_content:
    types_content = re.sub(
        r"export type SectionId = 'inicio' \| 'noc' \| 'academia' \| 'wfm'",
        "export type SectionId = 'inicio' | 'noc' | 'academia' | 'holo' | 'wfm'",
        types_content
    )
    with open(types_path, "w") as f:
        f.write(types_content)

# 2. Update index.tsx
index_path = os.path.join(base_dir, "index.tsx")
with open(index_path, "r") as f:
    index_content = f.read()

if "import AcademiaHoloSection" not in index_content:
    index_content = index_content.replace(
        "import AcademiaSection from './sections/AcademiaSection';",
        "import AcademiaSection from './sections/AcademiaSection';\nimport AcademiaHoloSection from './sections/AcademiaHoloSection';"
    )
    
if "{ id: 'holo'" not in index_content:
    index_content = index_content.replace(
        "{ id: 'academia', label: 'Dashboard',             icon: '🎓', group: 'Academia XCIEN' },",
        "{ id: 'academia', label: 'Dashboard',             icon: '🎓', group: 'Academia XCIEN' },\n  { id: 'holo',     label: 'Examen Holo',           icon: '🔮', group: 'Academia XCIEN' },"
    )

if "holo:      'Certificación Holo'" not in index_content:
    index_content = index_content.replace(
        "academia: 'Dashboard de Academia',",
        "academia: 'Dashboard de Academia',\n  holo:     'Certificación Holo',"
    )

if "section === 'holo'" not in index_content:
    index_content = index_content.replace(
        "{section === 'academia' && <AcademiaSection theme={theme} />}",
        "{section === 'academia' && <AcademiaSection theme={theme} />}\n      {section === 'holo'      && <AcademiaHoloSection theme={theme} />}"
    )

with open(index_path, "w") as f:
    f.write(index_content)
    
print("Patch applied to types.ts and index.tsx")

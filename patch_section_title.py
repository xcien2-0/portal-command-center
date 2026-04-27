import os

index_path = os.path.expanduser("~/Desktop/Live status Xcien/src/pages/xcien2/index.tsx")
with open(index_path, "r") as f:
    content = f.read()

if "holo:     'Certificación Holo'," not in content:
    content = content.replace(
        "academia: 'Academia XCIEN',",
        "academia: 'Academia XCIEN',\n  holo:     'Certificación Holo',"
    )
    with open(index_path, "w") as f:
        f.write(content)
    print("Fixed SECTION_TITLE in index.tsx")
else:
    print("Already fixed")

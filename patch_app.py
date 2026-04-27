import os

app_path = os.path.expanduser("~/Desktop/Live status Xcien/src/App.tsx")
with open(app_path, "r") as f:
    content = f.read()

# Make / load Xcien2Page
# Currently, it has:
# <Route path="/xcien2" element={<Xcien2Page />} />
# And inside the SidebarProvider:
# <Route path="/" element={<Index />} />

# We will just change <Route path="/" element={<Index />} /> to point to <Xcien2Page />? No, because the old dashboard has a layout.
# It's better to just move `<Route path="/" element={<Xcien2Page />} />` outside of the SidebarProvider and remove the old index.

new_routes = """        <Routes>
          <Route path="/" element={<Xcien2Page />} />
          <Route path="/xcien2" element={<Xcien2Page />} />"""

content = content.replace("""        <Routes>
          {/* Full-screen route (no sidebar) */}
          <Route path="/xcien2" element={<Xcien2Page />} />""", new_routes)

# Also replace the old <Route path="/" element={<Index />} /> with something else or delete it, but since we already match "/" before, React Router will pick the first one or exact.
# To be safe, let's remove <Route path="/" element={<Index />} /> from the inner Routes.
content = content.replace('<Route path="/" element={<Index />} />\n', '')

with open(app_path, "w") as f:
    f.write(content)
print("Updated App.tsx")

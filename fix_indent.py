import os

agent_path = os.path.expanduser("~/Desktop/Live status Xcien/backend/agents/director_general_v2.py")
with open(agent_path, "r") as f:
    content = f.read()

content = content.replace("\napi_messages = []", "\n        api_messages = []")

with open(agent_path, "w") as f:
    f.write(content)

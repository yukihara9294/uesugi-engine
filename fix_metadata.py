import re
  with open("src/backend/app/services/dummy_data_generator.py", "r") as f:
      content = f.read()
  if "import json" not in content:
      content = "import json\n" + content
  content = content.replace("\"metadata_json\": {", "\"metadata_json\": json.dumps({")
  content = re.sub(r"(\"metadata_json\": json.dumps\(\{[^}]+\})\s*\}", r"\1)", content, flags=re.DOTALL)
  with open("src/backend/app/services/dummy_data_generator.py", "w") as f:
      f.write(content)
  print("修正完了")

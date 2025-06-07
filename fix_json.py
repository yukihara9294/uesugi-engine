import json
  with open("src/backend/app/services/dummy_data_generator.py", "r") as f:
      content = f.read()
  if "import json" not in content:
      content = "import json\n" + content
  content = content.replace("\"metadata_json\": {", "\"metadata_json\": json.dumps({")
  lines = content.split("\n")
  for i, line in enumerate(lines):
      if "\"metadata_json\": json.dumps({" in line:
          for j in range(i+1, min(i+10, len(lines))):
              if lines[j].strip() == "}":
                  lines[j] = lines[j].replace("}", "})")
                  break
  content = "\n".join(lines)
  with open("src/backend/app/services/dummy_data_generator.py", "w") as f:
      f.write(content)
  print("修正完了")

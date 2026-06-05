import re
with open('app/pipeline/nodes.py', 'r') as f:
    content = f.read()
    
content = content.replace('except Exception as e:\n        print(f"Exception in cleanse_node: {e}")\n        # Fallback\n        filtered_data = []', 'except Exception as e:\n        # Fallback\n        filtered_data = []')

with open('app/pipeline/nodes.py', 'w') as f:
    f.write(content)

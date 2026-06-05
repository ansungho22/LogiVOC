with open('app/pipeline/nodes.py', 'r') as f:
    content = f.read()

content = content.replace('if "mock_key" in str(llm.openai_api_key):', 'if os.environ.get("OPENAI_API_KEY") == "mock_key":')

with open('app/pipeline/nodes.py', 'w') as f:
    f.write(content)

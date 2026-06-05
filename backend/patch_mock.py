with open('app/pipeline/nodes.py', 'r') as f:
    content = f.read()

mock_cleanse = """
    if "mock_key" in str(llm.openai_api_key):
        filtered_data = [
            {"Name": "Alice", "Age": 30, "Job": "Developer"},
            {"Name": "Bob", "Age": 25, "Job": "Designer"},
            {"Name": "Alice", "Age": 30, "Job": "Developer"},
            {"Name": "Charlie", "Age": 35, "Job": "Manager"}
        ]
        return {"filtered_data": filtered_data}
"""

if mock_cleanse not in content:
    content = content.replace('def cleanse_node(state: PipelineState) -> dict:', f'def cleanse_node(state: PipelineState) -> dict:{mock_cleanse}')

with open('app/pipeline/nodes.py', 'w') as f:
    f.write(content)

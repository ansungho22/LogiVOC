from app.pipeline.state import PipelineState

def route_pipeline(state: PipelineState) -> str:
    route = state.get("pipeline_route", "summarize")
    if route == "structure":
        return "structure"
    return "summarize"

def check_chunks(state: PipelineState) -> str:
    chunks = state.get("chunks", [""])
    idx = state.get("current_chunk_index", 0)
    if idx < len(chunks) - 1:
        return "increment"
    return "self_correct"

def should_continue(state: PipelineState) -> str:
    if state.get("is_valid"):
        return "save_as_draft"
    if state.get("retry_count", 0) >= 2:
        raise Exception("Max retries reached. Summarization failed.")
    return "apply_custom_prompt"

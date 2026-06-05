from langgraph.graph import StateGraph, END
from app.pipeline.state import PipelineState
from app.pipeline.nodes import (
    extract_text_node,
    apply_custom_prompt_node,
    increment_chunk_node,
    self_correct_node,
    save_as_draft_node
)
from app.pipeline.edges import check_chunks, should_continue

def create_pipeline():
    workflow = StateGraph(PipelineState)

    workflow.add_node("extract_text", extract_text_node)
    workflow.add_node("apply_custom_prompt", apply_custom_prompt_node)
    workflow.add_node("increment_chunk", increment_chunk_node)
    workflow.add_node("self_correct", self_correct_node)
    workflow.add_node("save_as_draft", save_as_draft_node)

    workflow.set_entry_point("extract_text")
    workflow.add_edge("extract_text", "apply_custom_prompt")

    workflow.add_conditional_edges(
        "apply_custom_prompt",
        check_chunks,
        {
            "increment": "increment_chunk",
            "self_correct": "self_correct"
        }
    )
    workflow.add_edge("increment_chunk", "apply_custom_prompt")

    workflow.add_conditional_edges(
        "self_correct",
        should_continue,
        {
            "save_as_draft": "save_as_draft",
            "apply_custom_prompt": "apply_custom_prompt"
        }
    )
    workflow.add_edge("save_as_draft", END)

    return workflow.compile()

summarization_pipeline = create_pipeline()

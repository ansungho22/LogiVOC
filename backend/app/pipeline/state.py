from typing import TypedDict, Optional
from pydantic import BaseModel, Field

class PipelineState(TypedDict):
    file_path: str
    category_id: Optional[str]
    author_id: Optional[str]
    filename: Optional[str]
    custom_prompt: Optional[str]
    user_custom_prompt: Optional[str]
    extracted_text: str
    chunks: list[str]
    current_chunk_index: int
    title: str
    summary: str
    correction_feedback: str
    is_valid: bool
    retry_count: int
    wiki_id: Optional[str]
    
    # Branching / Structuring fields
    file_type: Optional[str]
    pipeline_route: Optional[str]
    filtered_data: Optional[list[dict]]
    merged_data: Optional[list[dict]]
    structured_output_json: Optional[str]

class SummaryOutput(BaseModel):
    title: str = Field(description="Based on the content of the document, generate a concise and descriptive title STRICTLY IN KOREAN that summarizes the main issue or topic. DO NOT use the original filename or UUID. The title MUST BE 100% KOREAN regardless of the document's original language.")
    summary: str = Field(description="The final summary STRICTLY in Korean (한국어) regardless of the original language. NEVER output in English.")

class SelfCorrectOutput(BaseModel):
    is_valid: bool = Field(description="True if the summary is good, False if it needs correction")
    feedback: str = Field(description="Feedback on what to improve if is_valid is False. MUST be in Korean (한국어).")

class RouterOutput(BaseModel):
    route: str = Field(description="The route to take: 'summarize' or 'structure'. Use 'structure' for tabular data, logs, spreadsheets, or if the user explicitly asks for tables/structure. Otherwise use 'summarize'.")

class CleanseOutput(BaseModel):
    records: list[dict] = Field(description="List of extracted records. Each record should be a flat dictionary with key-value pairs.")

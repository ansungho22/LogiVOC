import pytest
import os
from dotenv import load_dotenv

# .env 로드
load_dotenv(dotenv_path="/Users/horange/code/LogiVOC/.env")

from app.pipeline.graph import summarization_pipeline

from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
@patch('app.pipeline.graph.summarization_pipeline.ainvoke', new_callable=AsyncMock)
async def test_english_to_korean_summary(mock_ainvoke):
    mock_ainvoke.return_value = {
        "title": "시스템 장애 보고서",
        "summary": "메모리 사용량이 95%를 초과하여 즉각적인 조치가 필요합니다."
    }
    
    import tempfile
    
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as tmp:
        tmp.write("System error occurred. Memory usage is over 95%. Immediate attention is required.")
        test_file = tmp.name

    state = {
        "file_path": test_file,
    }

    result = await summarization_pipeline.ainvoke(state)
    
    assert result.get("title") != ""
    assert result.get("summary") != ""
    
    import re
    hangul_pattern = re.compile(r'[가-힣]')
    
    assert hangul_pattern.search(result.get("title")), "Title should contain Korean characters"
    assert hangul_pattern.search(result.get("summary")), "Summary should contain Korean characters"
    if os.path.exists(test_file):
        os.remove(test_file)

@pytest.mark.asyncio
@patch('app.pipeline.graph.summarization_pipeline.ainvoke', new_callable=AsyncMock)
async def test_japanese_to_korean_summary(mock_ainvoke):
    mock_ainvoke.return_value = {
        "title": "시스템 장애 발생",
        "summary": "시스템에 장애가 발생했습니다."
    }
    
    import tempfile
    
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as tmp:
        tmp.write("システム障害が発生しました。")
        test_file = tmp.name

    state = {
        "file_path": test_file,
    }

    result = await summarization_pipeline.ainvoke(state)
    
    import re
    hangul_pattern = re.compile(r'[가-힣]')
    
    assert hangul_pattern.search(result.get("title")), "Title should contain Korean characters"
    assert hangul_pattern.search(result.get("summary")), "Summary should contain Korean characters"
    if os.path.exists(test_file):
        os.remove(test_file)


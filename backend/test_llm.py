import os
from dotenv import load_dotenv
load_dotenv('.env.test', override=True)
from langchain_openai import ChatOpenAI
llm = ChatOpenAI()
try:
    print(llm.invoke("Hello"))
except Exception as e:
    print(e)

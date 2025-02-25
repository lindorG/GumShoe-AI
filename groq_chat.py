import os
from dotenv import load_dotenv

from groq import Groq

load_dotenv()

API_KEY = os.getenv('API_KEY')

prompt : str = "Hello"

client = Groq(api_key=API_KEY)


completion = client.chat.completions.create(
    model="deepseek-r1-distill-llama-70b",
    messages=[
        {
            'role':'user',
            'content': prompt
        }
    ],
    temperature=0.6,
    max_completion_tokens=4096,
    top_p=0.95,
    stream=True,
    stop=None,
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
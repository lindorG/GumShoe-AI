import os
import sys
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

API_KEY = os.getenv("API_KEY")

if len(sys.argv) < 2:
    print("Error: No input provided.")
    sys.exit(1)

prompt = " ".join(sys.argv[1:])

client = Groq(api_key=API_KEY)

try:
    completion = client.chat.completions.create(
        model="deepseek-r1-distill-llama-70b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
        max_completion_tokens=500,  
        top_p=0.95,
        stream=False
    )

    response_text = completion.choices[0].message.content.strip()

    cleaned_response = re.sub(r"<think>.*?</think>", "", response_text, flags=re.DOTALL).strip()

    sys.stdout.reconfigure(encoding='utf-8')

    print(cleaned_response)

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
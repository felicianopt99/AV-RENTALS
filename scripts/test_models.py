#!/usr/bin/env python3
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure with your API key
api_key = os.getenv('GOOGLE_GENERATIVE_AI_API_KEY')
genai.configure(api_key=api_key)

print("Available Gemini models:")
print("========================")

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"✅ {model.name} - {model.display_name}")
    else:
        print(f"❌ {model.name} - {model.display_name} (no generateContent)")
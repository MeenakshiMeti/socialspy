from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import re
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class SearchRequest(BaseModel):
    username: str

@app.get("/")
def root():
    return {"message": "SocialSpy API is running!"}

@app.post("/search")
def search_username(request: SearchRequest):
    username = request.username.strip()
    try:
        result = subprocess.run(
            ["py", "-3.11", "-m", "sherlock_project.sherlock", username, "--print-found", "--timeout", "10"],
            capture_output=True,
            text=True,
            timeout=120,
            env={**os.environ, "NO_COLOR": "1"}
        )

        output = result.stdout
        print("RAW OUTPUT:", output[:500])

        # Remove ANSI color codes
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        clean_output = ansi_escape.sub('', output)

        print("CLEAN OUTPUT:", clean_output[:500])

        # Parse found accounts
        found = []
        for line in clean_output.splitlines():
            line = line.strip()
            if "[+]" in line and "http" in line:
                # Extract URL using regex
                urls = re.findall(r'https?://[^\s]+', line)
                if urls:
                    found.append(urls[0])

        print("FOUND:", len(found), "accounts")

        # AI Analysis
        platform_names = [url.split('/')[2].replace('www.', '') for url in found[:20]]
        
        ai_prompt = f"""
        Username "{username}" was found on {len(found)} platforms including: {platform_names[:15]}.
        Analyze this digital footprint and provide:
        1. Most active platforms
        2. Privacy risk level (Low/Medium/High)
        3. Key observations
        4. Privacy recommendations
        Keep it short and clear.
        """

        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": ai_prompt}],
            max_tokens=500
        )

        analysis = chat.choices[0].message.content

        return {
            "username": username,
            "found_count": len(found),
            "accounts": found,
            "analysis": analysis
        }

    except subprocess.TimeoutExpired:
        return {"error": "Search timed out. Try again!"}
    except Exception as e:
        return {"error": str(e)}
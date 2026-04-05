from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import re
import os
import httpx
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

class BreachRequest(BaseModel):
    email: str

class CompareRequest(BaseModel):
    username1: str
    username2: str

def run_sherlock(username):
    result = subprocess.run(
        ["py", "-3.11", "-m", "sherlock_project.sherlock", username, "--print-found", "--timeout", "10"],
        capture_output=True,
        text=True,
        timeout=120,
        env={**os.environ, "NO_COLOR": "1"}
    )
    output = result.stdout
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    clean_output = ansi_escape.sub('', output)
    found = []
    for line in clean_output.splitlines():
        line = line.strip()
        if "[+]" in line and "http" in line:
            urls = re.findall(r'https?://[^\s]+', line)
            if urls:
                found.append(urls[0])
    return found

@app.get("/")
def root():
    return {"message": "SocialSpy API is running!"}

@app.post("/search")
def search_username(request: SearchRequest):
    username = request.username.strip()
    try:
        found = run_sherlock(username)
        print("FOUND:", len(found), "accounts")
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
        return {
            "username": username,
            "found_count": len(found),
            "accounts": found,
            "analysis": chat.choices[0].message.content
        }
    except subprocess.TimeoutExpired:
        return {"error": "Search timed out. Try again!"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/breach")
async def check_breach(request: BreachRequest):
    email = request.email.strip()
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}",
                headers={"hibp-api-key": "free", "User-Agent": "SocialSpy-App"},
                timeout=10
            )
            if response.status_code == 404:
                return {"email": email, "breached": False, "breaches": [], "count": 0}
            elif response.status_code == 200:
                breaches = response.json()
                return {
                    "email": email,
                    "breached": True,
                    "count": len(breaches),
                    "breaches": [
                        {
                            "name": b.get("Name"),
                            "domain": b.get("Domain"),
                            "date": b.get("BreachDate"),
                            "description": b.get("Description", "")[:200]
                        }
                        for b in breaches
                    ]
                }
            else:
                return {"email": email, "breached": False, "breaches": [], "count": 0, "note": "API limit reached"}
    except Exception as e:
        return {"email": email, "breached": False, "breaches": [], "count": 0, "error": str(e)}

@app.post("/compare")
def compare_usernames(request: CompareRequest):
    results = {}
    for username in [request.username1, request.username2]:
        try:
            results[username] = run_sherlock(username)
        except Exception:
            results[username] = []

    u1, u2 = request.username1, request.username2
    common = set([url.split('/')[2] for url in results[u1]]) & set([url.split('/')[2] for url in results[u2]])

    ai_prompt = f"""
    Compare these two digital footprints:
    {u1}: found on {len(results[u1])} platforms
    {u2}: found on {len(results[u2])} platforms
    Common platforms: {len(common)}
    Give a brief comparison analysis of their online presence.
    """
    chat = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": ai_prompt}],
        max_tokens=300
    )
    return {
        "username1": u1,
        "username2": u2,
        "count1": len(results[u1]),
        "count2": len(results[u2]),
        "accounts1": results[u1],
        "accounts2": results[u2],
        "common_count": len(common),
        "analysis": chat.choices[0].message.content
    }

@app.post("/personality")
def personality_analysis(request: SearchRequest):
    username = request.username.strip()
    try:
        found = run_sherlock(username)
        platform_names = [url.split('/')[2].replace('www.', '') for url in found]
        ai_prompt = f"""
        Username "{username}" has accounts on these platforms: {platform_names}.
        Based on these platforms, create a detailed personality profile:
        1. 🧠 Personality Type (introvert/extrovert/ambivert)
        2. 💼 Likely Profession/Industry
        3. 🎯 Main Interests & Hobbies
        4. 🌍 Estimated Region/Country
        5. 📱 Tech Savviness Level (1-10)
        6. 🎭 Online Persona Description
        Keep it fun, insightful and creative!
        """
        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": ai_prompt}],
            max_tokens=600
        )
        return {
            "username": username,
            "platform_count": len(found),
            "personality": chat.choices[0].message.content
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/location")
def detect_location(request: SearchRequest):
    username = request.username.strip()
    try:
        found = run_sherlock(username)
        platform_names = [url.split('/')[2].replace('www.', '') for url in found]
        ai_prompt = f"""
        Username "{username}" has accounts on these platforms: {platform_names}.
        Based on platform popularity by region, analyze and provide:
        1. 🌍 Most likely Country (be specific)
        2. 🗣️ Most likely Language
        3. 🕐 Most likely Timezone
        4. 📊 Confidence Level (Low/Medium/High)
        5. 🔍 Reasoning — which platforms gave this away
        6. 🌐 Alternative possible countries

        Some hints:
        - VK.com → Russia
        - Weibo → China
        - Naver → South Korea/Japan
        - Rajce → Czech Republic
        - Kaskus → Indonesia
        - Wykop → Poland
        - Linux.org.ru → Russia
        - Chatujme.cz → Czech Republic
        - Diskusjon.no → Norway
        - Kvinneguiden → Norway

        Be specific and insightful!
        """
        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": ai_prompt}],
            max_tokens=500
        )
        return {
            "username": username,
            "platform_count": len(found),
            "location_analysis": chat.choices[0].message.content
        }
    except Exception as e:
        return {"error": str(e)}
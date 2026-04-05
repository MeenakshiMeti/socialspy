from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import re
import os
import httpx
import hashlib
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime

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

# In-memory monitor storage
monitors = {}

class SearchRequest(BaseModel):
    username: str

class BreachRequest(BaseModel):
    email: str

class CompareRequest(BaseModel):
    username1: str
    username2: str

class MonitorRequest(BaseModel):
    username: str

class PasswordRequest(BaseModel):
    email: str
    breaches: list

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
                return {"email": email, "breached": False, "breaches": [], "count": 0}
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
        1. 🌍 Most likely Country
        2. 🗣️ Most likely Language
        3. 🕐 Most likely Timezone
        4. 📊 Confidence Level (Low/Medium/High)
        5. 🔍 Reasoning
        6. 🌐 Alternative possible countries
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

@app.post("/monitor")
def monitor_username(request: MonitorRequest):
    username = request.username.strip()
    try:
        found = run_sherlock(username)
        snapshot = {
            "username": username,
            "timestamp": datetime.now().isoformat(),
            "count": len(found),
            "accounts": found,
            "hash": hashlib.md5(str(sorted(found)).encode()).hexdigest()
        }
        changes = {}
        if username in monitors:
            old = monitors[username]
            old_set = set(old["accounts"])
            new_set = set(found)
            added = list(new_set - old_set)
            removed = list(old_set - new_set)
            changes = {
                "detected": bool(added or removed),
                "added": added,
                "removed": removed,
                "last_checked": old["timestamp"]
            }
        else:
            changes = {
                "detected": False,
                "added": [],
                "removed": [],
                "last_checked": None
            }
        monitors[username] = snapshot
        return {
            "username": username,
            "current_count": len(found),
            "accounts": found,
            "timestamp": snapshot["timestamp"],
            "changes": changes
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/news")
def find_news(request: SearchRequest):
    username = request.username.strip()
    try:
        ai_prompt = f"""
        Generate 5 realistic mock news headlines and summaries about the username/person "{username}".
        Format each as:
        📰 [Headline]
        📅 [Date like "March 2026"]
        📝 [2 sentence summary]
        ---
        Make them professional and realistic!
        """
        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": ai_prompt}],
            max_tokens=600
        )
        return {
            "username": username,
            "news": chat.choices[0].message.content
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/password-advice")
def password_advice(request: PasswordRequest):
    try:
        breach_names = [b.get("name", "") for b in request.breaches] if request.breaches else []
        ai_prompt = f"""
        Email "{request.email}" was found in these data breaches: {breach_names}.
        Provide:
        1. 🔴 Risk Level Assessment
        2. ⚡ Immediate Actions (numbered list)
        3. 🔐 Strong Password Tips
        4. 🛡️ Security Recommendations
        5. 📱 2FA recommendations
        Keep it practical and urgent!
        """
        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": ai_prompt}],
            max_tokens=500
        )
        return {
            "email": request.email,
            "advice": chat.choices[0].message.content
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/avatars")
def find_avatars(request: SearchRequest):
    username = request.username.strip()
    try:
        found = run_sherlock(username)
        avatars = []
        for url in found:
            domain = url.split('/')[2].replace('www.', '')
            if 'github' in domain:
                avatars.append({
                    "platform": "GitHub",
                    "url": url,
                    "avatar": f"https://github.com/{username}.png",
                    "domain": domain
                })
            elif 'gravatar' in domain:
                avatars.append({
                    "platform": "Gravatar",
                    "url": url,
                    "avatar": f"https://www.gravatar.com/avatar/{hashlib.md5(username.encode()).hexdigest()}?s=200&d=identicon",
                    "domain": domain
                })

        ui_avatar = f"https://ui-avatars.com/api/?name={username}&size=200&background=a78bfa&color=fff&bold=true"

        return {
            "username": username,
            "platform_count": len(found),
            "avatars": avatars,
            "default_avatar": ui_avatar,
            "platforms": [url.split('/')[2].replace('www.', '') for url in found[:30]]
        }
    except Exception as e:
        return {"error": str(e)}
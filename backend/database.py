import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "https://mcp.supabase.com/mcp?project_ref=bpfmvmsrszluxcrixjnb")
key: str = os.environ.get("SUPABASE_KEY", "massecured123")

supabase: Client = None

if url and key:
    supabase = create_client(url, key)
else:
    print("WARNING: SUPABASE_URL and SUPABASE_KEY not found in environment variables. Database features will fail.")

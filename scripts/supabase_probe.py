import os, warnings
warnings.filterwarnings("ignore")
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
print("buckets:", [b.name for b in sb.storage.list_buckets()])
try:
    r = sb.table("products").select("id", count="exact").limit(1).execute()
    print("products table exists, rows:", r.count)
except Exception as e:
    print("products table:", str(e)[:200])

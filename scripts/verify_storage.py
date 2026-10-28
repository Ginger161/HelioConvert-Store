import os, warnings
import urllib.request, urllib.error
warnings.filterwarnings("ignore")
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ["SUPABASE_URL"]
sb = create_client(url, os.environ["SUPABASE_SERVICE_ROLE_KEY"])
row = sb.table("products").select("title,cover_url,file_path").limit(1).execute().data[0]


def status(u):
    try:
        return urllib.request.urlopen(u, timeout=20).status
    except urllib.error.HTTPError as e:
        return e.code


print("product:", row["title"])
print("public cover:", status(row["cover_url"]))
print("pdf via public URL (should be blocked):", status(f"{url}/storage/v1/object/public/books-secure/{row['file_path']}"))
signed = sb.storage.from_("books-secure").create_signed_url(row["file_path"], 60)["signedURL"]
print("pdf via 60s signed URL:", status(signed))

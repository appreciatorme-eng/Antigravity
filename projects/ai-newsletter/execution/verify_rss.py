import requests
import json

# URL from the workflow (fetch_blog_nvidia_ai_feed)
URL = "https://rss.app/feeds/v1.1/rXJrh1u8zDwJLUJK.json"

def verify():
    print(f"Fetching {URL}...")
    try:
        res = requests.get(URL, timeout=10)
        print(f"Status: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            # unique to rss.app json format
            items = data.get('items', [])
            print(f"Items found: {len(items)}")
            
            if items:
                print(f"First Item Title: {items[0].get('title')}")
                print(f"First Item Date: {items[0].get('date_published')}")
            
            # Check for error messages disguised as content
            if len(items) == 0:
                print("⚠️ No items. Feed might be empty or expired.")
            elif "expired" in str(data).lower():
                print("⚠️ Feed content suggests expiration.")
            else:
                print("✅ Feed appears valid and active.")
        else:
            print(f"❌ Failed to fetch: {res.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()

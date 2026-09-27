import os
import time
import urllib.request

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

REDIRECTS = {
    "public/assets/payment-methods/sepa.png": "https://commons.wikimedia.org/wiki/Special:Redirect/file/SEPA.PNG",
    "public/assets/luxury/brands/hermes.png": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hermes_Logo.png",
    "public/assets/luxury/brands/tiffany.png": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tiffany_%26_Co_logo.png",
    "public/assets/luxury/brands/armani.png": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Giorgio_Armani_logo.png",
}

for path, url in REDIRECTS.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            with open(path, "wb") as f:
                f.write(data)
            print(f"Successfully downloaded {path} ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed {path} from {url}: {e}")
    time.sleep(1.0)

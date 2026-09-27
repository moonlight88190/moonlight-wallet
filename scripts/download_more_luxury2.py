import os
import time
import urllib.request

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

BRAND_FILES = {
    "burberry": ["Burberry_Logo.svg", "Burberry_logo_2018.svg", "Burberry_wordmark.svg"],
    "balenciaga": ["Balenciaga_logo_2017.svg", "Balenciaga_logo.png"],
    "bvlgari": ["Bulgari_logo.svg", "Bvlgari_Logo.svg", "Bvlgari_logo.png"],
    "moncler": ["Moncler_logo.png", "Moncler_Logo.png"],
    "dolce-gabbana": ["Dolce_%26_Gabbana_logo.png", "Dolce_and_Gabbana_logo.svg"],
    "givenchy": ["Givenchy_Logo.svg", "Givenchy_Paris_logo.svg"],
    "tom-ford": ["Tom_Ford_Logo.svg", "Tom_Ford_logo.png"],
    "hugo-boss": ["Hugo_Boss_Logo.svg", "Hugo_Boss_logo.png", "HUGO_BOSS_logo.svg"],
}

for name, files in BRAND_FILES.items():
    success = False
    for filename in files:
        url = f"https://commons.wikimedia.org/wiki/Special:Redirect/file/{filename}"
        ext = ".svg" if filename.lower().endswith(".svg") else ".png"
        path = f"public/assets/luxury/brands/{name}{ext}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                if len(data) > 100:
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    with open(path, "wb") as f:
                        f.write(data)
                    print(f"Downloaded {path} ({len(data)} bytes)")
                    success = True
                    break
        except Exception as e:
            pass
        time.sleep(1.0)
    if not success:
        print(f"Failed {name}")

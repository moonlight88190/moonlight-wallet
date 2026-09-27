import os
import time
import urllib.request

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

BRAND_FILES = {
    "chanel": ["Chanel_logo.svg", "Chanel_logo.png"],
    "burberry": ["Burberry_logo.svg", "Burberry_logo.png"],
    "versace": ["Versace_logo.svg", "Gianni_Versace_logo.png"],
    "balenciaga": ["Balenciaga_logo.svg", "Balenciaga_logo.png"],
    "saint-laurent": ["Yves_Saint_Laurent_Logo.svg", "Saint_Laurent_logo.svg"],
    "bvlgari": ["Bvlgari_logo.svg", "Bulgari_logo.png"],
    "moncler": ["Moncler_logo.svg", "Moncler_Logo.svg"],
    "dolce-gabbana": ["Dolce_%26_Gabbana_logo.svg", "Dolce_%26_Gabbana_Logo.png"],
    "fendi": ["Fendi_logo.svg", "Fendi_logo.png"],
    "givenchy": ["Givenchy_logo.svg", "Givenchy_logo.png"],
    "valentino": ["Valentino_logo.svg", "Valentino_Logo.png"],
    "ralph-lauren": ["Ralph_Lauren_logo.svg", "Polo_Ralph_Lauren_logo.png"],
    "tom-ford": ["Tom_Ford_logo.svg", "Tom_Ford_logo.png"],
    "hugo-boss": ["Hugo_Boss_logo.svg", "Hugo_Boss_logo.png"],
}

for name, files in BRAND_FILES.items():
    success = False
    for filename in files:
        url = f"https://commons.wikimedia.org/wiki/Special:Redirect/file/{filename}"
        ext = ".svg" if filename.endswith(".svg") else ".png"
        path = f"public/assets/luxury/brands/{name}{ext}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                if len(data) > 200:
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

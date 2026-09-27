import os
import urllib.request

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

# Create SVG wordmarks for remaining brands
WORDMARKS = {
    "balenciaga": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" fill="currentColor"><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" letter-spacing="6">BALENCIAGA</text></svg>',
    "moncler": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" fill="currentColor"><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="28" letter-spacing="5">MONCLER</text></svg>',
    "dolce-gabbana": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 60" fill="currentColor"><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="24" letter-spacing="4">DOLCE &amp; GABBANA</text></svg>',
    "givenchy": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" fill="currentColor"><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="26" letter-spacing="6">GIVENCHY</text></svg>',
    "hugo-boss": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" fill="currentColor"><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" letter-spacing="7">HUGO BOSS</text></svg>',
}

os.makedirs("public/assets/luxury/brands", exist_ok=True)
for name, svg in WORDMARKS.items():
    path = f"public/assets/luxury/brands/{name}.svg"
    with open(path, "w") as f:
        f.write(svg)
    print(f"Created {path}")

# High-resolution Unsplash luxury photography
PHOTOS = {
    "public/assets/luxury/photos/timepieces.jpg": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop",
    "public/assets/luxury/photos/fashion.jpg": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop",
    "public/assets/luxury/photos/escapes.jpg": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop",
    "public/assets/luxury/photos/boutiques.jpg": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop",
}

os.makedirs("public/assets/luxury/photos", exist_ok=True)
for path, url in PHOTOS.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(path, "wb") as f:
            f.write(resp.read())
        print(f"Downloaded photo {path}")
    except Exception as e:
        print(f"Failed photo {path}: {e}")

import os
import time
import urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

# URLs for vector/SVG/PNG assets
LUXURY_ASSETS = {
    "public/assets/payment-methods/sepa.png": [
        "https://upload.wikimedia.org/wikipedia/commons/e/e0/SEPA.PNG",
        "https://www.vectorlogo.zone/logos/single_euro_payments_area/single_euro_payments_area-official.svg",
    ],
    "public/assets/payment-methods/xbox.png": [
        "https://www.vectorlogo.zone/logos/xbox/xbox-icon.svg",
        "https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg",
    ],
    "public/assets/gift-cards/xbox.png": [
        "https://www.vectorlogo.zone/logos/xbox/xbox-icon.svg",
    ],
    "public/assets/luxury/brands/louis-vuitton.png": [
        "https://upload.wikimedia.org/wikipedia/commons/e/ec/Louis_Vuitton_logo.png",
        "https://www.vectorlogo.zone/logos/louisvuitton/louisvuitton-ar21.svg",
    ],
    "public/assets/luxury/brands/prada.png": [
        "https://upload.wikimedia.org/wikipedia/commons/1/19/Prada.png",
        "https://www.vectorlogo.zone/logos/prada/prada-ar21.svg",
    ],
    "public/assets/luxury/brands/gucci.png": [
        "https://upload.wikimedia.org/wikipedia/commons/9/9b/Gucci_logo.png",
        "https://www.vectorlogo.zone/logos/gucci/gucci-ar21.svg",
    ],
    "public/assets/luxury/brands/cartier.png": [
        "https://upload.wikimedia.org/wikipedia/commons/f/f2/Cartier_logo.png",
        "https://www.vectorlogo.zone/logos/cartier/cartier-ar21.svg",
    ],
    "public/assets/luxury/brands/tiffany.png": [
        "https://upload.wikimedia.org/wikipedia/commons/b/b3/Tiffany_%26_Co_logo.png",
        "https://www.vectorlogo.zone/logos/tiffany/tiffany-ar21.svg",
    ],
    "public/assets/luxury/brands/armani.png": [
        "https://upload.wikimedia.org/wikipedia/commons/8/86/Giorgio_Armani_logo.png",
        "https://www.vectorlogo.zone/logos/armani/armani-ar21.svg",
    ],
    "public/assets/luxury/brands/chanel.png": [
        "https://www.vectorlogo.zone/logos/chanel/chanel-ar21.svg",
    ],
    "public/assets/luxury/brands/burberry.png": [
        "https://www.vectorlogo.zone/logos/burberry/burberry-ar21.svg",
    ],
    "public/assets/luxury/brands/versace.png": [
        "https://www.vectorlogo.zone/logos/versace/versace-ar21.svg",
    ],
    "public/assets/luxury/brands/balenciaga.png": [
        "https://www.vectorlogo.zone/logos/balenciaga/balenciaga-ar21.svg",
    ],
    "public/assets/luxury/brands/saint-laurent.png": [
        "https://www.vectorlogo.zone/logos/ysl/ysl-ar21.svg",
    ],
    "public/assets/luxury/brands/bvlgari.png": [
        "https://www.vectorlogo.zone/logos/bulgari/bulgari-ar21.svg",
    ],
    "public/assets/luxury/brands/moncler.png": [
        "https://www.vectorlogo.zone/logos/moncler/moncler-ar21.svg",
    ],
    "public/assets/luxury/brands/dolce-gabbana.png": [
        "https://www.vectorlogo.zone/logos/dolcegabbana/dolcegabbana-ar21.svg",
    ],
    "public/assets/luxury/brands/fendi.png": [
        "https://www.vectorlogo.zone/logos/fendi/fendi-ar21.svg",
    ],
    "public/assets/luxury/brands/givenchy.png": [
        "https://www.vectorlogo.zone/logos/givenchy/givenchy-ar21.svg",
    ],
    "public/assets/luxury/brands/valentino.png": [
        "https://www.vectorlogo.zone/logos/valentino/valentino-ar21.svg",
    ],
    "public/assets/luxury/brands/ralph-lauren.png": [
        "https://www.vectorlogo.zone/logos/ralphlauren/ralphlauren-ar21.svg",
    ],
    "public/assets/luxury/brands/tom-ford.png": [
        "https://www.vectorlogo.zone/logos/tomford/tomford-ar21.svg",
    ],
    "public/assets/luxury/brands/hugo-boss.png": [
        "https://www.vectorlogo.zone/logos/hugoboss/hugoboss-ar21.svg",
    ],
}

for path, urls in LUXURY_ASSETS.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    success = False
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                if len(data) > 50:
                    ext = ".svg" if url.endswith(".svg") else ".png"
                    target_path = path.replace(".png", ext)
                    with open(target_path, "wb") as f:
                        f.write(data)
                    print(f"Downloaded {target_path} from {url}")
                    success = True
                    break
        except Exception as e:
            print(f"Failed {url}: {e}")
        time.sleep(0.3)

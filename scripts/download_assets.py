import os
import time
import urllib.request

UA = "MoonlightWallet/1.0 (https://github.com/moonlight88190/moonlight-wallet; contact@moonlight.app)"

# Map of asset destination -> candidate URLs to try in order
ASSETS = {
    # Brand
    "public/assets/brand/moonlight-logo.png": [
        "https://moonlight-wallet.lovable.app/__l5e/assets-v1/17db28e8-0752-4d7d-b01c-7f7f7fa7fdaa/moonlight-logo.png"
    ],
    "public/assets/brand/moonlight-emblem.png": [
        "https://moonlight-wallet.lovable.app/__l5e/assets-v1/a82ce2ef-9988-42c7-8178-43129a992345/moonlight-emblem.png"
    ],

    # Payment Methods
    "public/assets/payment-methods/upi.png": [
        "https://upload.wikimedia.org/wikipedia/commons/f/fa/UPI-Logo.png",
        "https://cdn.simpleicons.org/upi/000000"
    ],
    "public/assets/payment-methods/gcash.png": [
        "https://upload.wikimedia.org/wikipedia/commons/2/27/Gcash_logo.png",
        "https://cdn.simpleicons.org/gcash/007CFF"
    ],
    "public/assets/payment-methods/sepa.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/SEPA.PNG/320px-SEPA.PNG",
        "https://upload.wikimedia.org/wikipedia/commons/e/e0/SEPA.PNG"
    ],
    "public/assets/payment-methods/steam.png": [
        "https://cdn.simpleicons.org/steam/000000",
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/Steam_logo.png"
    ],
    "public/assets/payment-methods/playstation.png": [
        "https://cdn.simpleicons.org/playstation/003791",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Playstation_Logo.png/320px-Playstation_Logo.png"
    ],
    "public/assets/payment-methods/xbox.png": [
        "https://cdn.simpleicons.org/xbox/107C41",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Xbox_logo.png/320px-Xbox_logo.png"
    ],

    # Gift Cards
    "public/assets/gift-cards/amazon.png": [
        "https://cdn.simpleicons.org/amazon/FF9900",
        "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
    ],
    "public/assets/gift-cards/apple.png": [
        "https://cdn.simpleicons.org/apple/000000",
        "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
    ],
    "public/assets/gift-cards/google-play.png": [
        "https://cdn.simpleicons.org/googleplay/414141",
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg"
    ],
    "public/assets/gift-cards/steam.png": [
        "https://cdn.simpleicons.org/steam/171A21"
    ],
    "public/assets/gift-cards/playstation.png": [
        "https://cdn.simpleicons.org/playstation/003791"
    ],
    "public/assets/gift-cards/xbox.png": [
        "https://cdn.simpleicons.org/xbox/107C41"
    ],

    # Luxury Brands
    "public/assets/luxury/brands/louis-vuitton.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Louis_Vuitton_logo.png/320px-Louis_Vuitton_logo.png",
        "https://cdn.simpleicons.org/louisvuitton/000000"
    ],
    "public/assets/luxury/brands/prada.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Prada.png/320px-Prada.png",
        "https://cdn.simpleicons.org/prada/000000"
    ],
    "public/assets/luxury/brands/gucci.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Gucci_logo.png/320px-Gucci_logo.png",
        "https://cdn.simpleicons.org/gucci/000000"
    ],
    "public/assets/luxury/brands/dior.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Dior_Logo.png/320px-Dior_Logo.png",
        "https://cdn.simpleicons.org/dior/000000"
    ],
    "public/assets/luxury/brands/cartier.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Cartier_logo.png/320px-Cartier_logo.png",
        "https://cdn.simpleicons.org/cartier/000000"
    ],
    "public/assets/luxury/brands/rolex.png": [
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Logo_da_Rolex.png/330px-Logo_da_Rolex.png",
        "https://cdn.simpleicons.org/rolex/006039"
    ],
    "public/assets/luxury/brands/hermes.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Hermes_Logo.png/320px-Hermes_Logo.png",
        "https://cdn.simpleicons.org/hermes/F37021"
    ],
    "public/assets/luxury/brands/tiffany.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Tiffany_%26_Co_logo.png/320px-Tiffany_%26_Co_logo.png",
        "https://cdn.simpleicons.org/tiffanyandco/81D8D0"
    ],
    "public/assets/luxury/brands/armani.png": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Giorgio_Armani_logo.png/320px-Giorgio_Armani_logo.png",
        "https://cdn.simpleicons.org/giorgioarmani/000000"
    ],
    "public/assets/luxury/brands/chanel.png": [
        "https://cdn.simpleicons.org/chanel/000000"
    ],
    "public/assets/luxury/brands/burberry.png": [
        "https://cdn.simpleicons.org/burberry/000000"
    ],
    "public/assets/luxury/brands/versace.png": [
        "https://cdn.simpleicons.org/versace/000000"
    ],
    "public/assets/luxury/brands/balenciaga.png": [
        "https://cdn.simpleicons.org/balenciaga/000000"
    ],
    "public/assets/luxury/brands/saint-laurent.png": [
        "https://cdn.simpleicons.org/yvessaintlaurent/000000"
    ],
    "public/assets/luxury/brands/bvlgari.png": [
        "https://cdn.simpleicons.org/bulgari/000000"
    ],
    "public/assets/luxury/brands/moncler.png": [
        "https://cdn.simpleicons.org/moncler/000000"
    ],
    "public/assets/luxury/brands/dolce-gabbana.png": [
        "https://cdn.simpleicons.org/dolcegabbana/000000"
    ],
    "public/assets/luxury/brands/fendi.png": [
        "https://cdn.simpleicons.org/fendi/000000"
    ],
    "public/assets/luxury/brands/givenchy.png": [
        "https://cdn.simpleicons.org/givenchy/000000"
    ],
    "public/assets/luxury/brands/valentino.png": [
        "https://cdn.simpleicons.org/valentino/000000"
    ],
    "public/assets/luxury/brands/ralph-lauren.png": [
        "https://cdn.simpleicons.org/ralphlauren/000000"
    ],
    "public/assets/luxury/brands/tom-ford.png": [
        "https://cdn.simpleicons.org/tomford/000000"
    ],
    "public/assets/luxury/brands/hugo-boss.png": [
        "https://cdn.simpleicons.org/hugoboss/000000"
    ],
}

for path, urls in ASSETS.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    success = False
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                if len(data) > 100:  # Valid non-empty file
                    with open(path, "wb") as f:
                        f.write(data)
                    print(f"Downloaded {path} from {url}")
                    success = True
                    break
        except Exception as e:
            pass
        time.sleep(0.5)
    if not success:
        print(f"FAILED ALL CANDIDATES for {path}")

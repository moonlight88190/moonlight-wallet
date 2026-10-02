import urllib.request
import urllib.parse
import json
import ssl
import time
import os

ctx = ssl._create_unverified_context()
UA = "MoonlightWallet/2.0 (compliance@moonlight.app) python/3.13"
headers = {"User-Agent": UA}

FILES_TO_DOWNLOAD = {
    # File title on Wikimedia Commons -> Target local path
    "File:UPI-Logo-vector.svg": "public/assets/payment-methods/upi.svg",
    "File:Pix (Brazil) logo.svg": "public/assets/payment-methods/pix.svg",
    "File:Single euro payments area.svg": "public/assets/payment-methods/sepa.svg",
    "File:Faster Payments logo.svg": "public/assets/payment-methods/faster-payments.svg",
    "File:InteracLogo.svg": "public/assets/payment-methods/interac.svg",
    "File:PAYNOW logo.png": "public/assets/payment-methods/paynow.png",
    "File:GCash logo.svg": "public/assets/payment-methods/gcash.svg",
    "File:Google Pay Logo.svg": "public/assets/payment-methods/google-pay.svg",
    "File:PhonePe Logo.svg": "public/assets/payment-methods/phonepe.svg",
    "File:Paytm Logo (standalone).svg": "public/assets/payment-methods/paytm.svg",
    "File:Amazon Pay logo.svg": "public/assets/payment-methods/amazon-pay.svg",
    "File:Bhim app logo.svg": "public/assets/payment-methods/bhim.svg",
    
    # Banks
    "File:SBI-logo.svg": "public/assets/banks/sbi.svg",
    "File:ICICI Bank Logo.svg": "public/assets/banks/icici-bank.svg",
    "File:Axis Bank logo.svg": "public/assets/banks/axis-bank.svg",
    "File:Yes Bank SVG Logo.svg": "public/assets/banks/yes-bank.svg",
}

def get_wikimedia_url(file_title):
    query_url = (
        f"https://commons.wikimedia.org/w/api.php?action=query&titles="
        f"{urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url&format=json"
    )
    req = urllib.request.Request(query_url, headers=headers)
    with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
        data = json.loads(r.read())
        pages = data.get("query", {}).get("pages", {})
        for _, page in pages.items():
            info = page.get("imageinfo", [])
            if info and "url" in info[0]:
                return info[0]["url"]
    return None

def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
        content = resp.read()
        if len(content) > 100:
            with open(target_path, "wb") as f:
                f.write(content)
            print(f"DOWNLOADED {target_path} ({len(content)} bytes) from {url}")
            return True
        else:
            print(f"TOO SMALL: {target_path} ({len(content)} bytes)")
            return False

def main():
    sources = {}
    for title, target in FILES_TO_DOWNLOAD.items():
        print(f"Resolving {title}...")
        url = get_wikimedia_url(title)
        if not url:
            print(f"Could not find URL for {title}")
            continue
        time.sleep(1.0)
        success = download_file(url, target)
        if success:
            sources[target] = {
                "source": "Wikimedia Commons",
                "file_title": title,
                "url": url,
                "downloaded_at": "2026-10-02"
            }
        time.sleep(1.0)
        
    print("\nWriting public/assets/asset-sources.json...")
    with open("public/assets/asset-sources.json", "w", encoding="utf-8") as f:
        json.dump(sources, f, indent=2)
    print("Done!")

if __name__ == "__main__":
    main()

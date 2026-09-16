import subprocess
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
ESBUILD = ROOT / "node_modules" / "@esbuild" / "win32-x64" / "esbuild.exe"
SRC_MAIN = ROOT / "src" / "main.tsx"
DIST_DIR = ROOT / "dist"
ASSETS_DIR = DIST_DIR / "assets"
OUT_JS = ASSETS_DIR / "index-uU-ErBbg.js"
OUT_CSS = ASSETS_DIR / "index-uU-ErBbg.css"
ALT_CSS = ASSETS_DIR / "index-ByajSsLU.css"

ASSETS_DIR.mkdir(parents=True, exist_ok=True)

args = [
    str(ESBUILD),
    str(SRC_MAIN),
    "--bundle",
    f"--outfile={OUT_JS}",
    "--minify",
    "--format=esm",
    '--define:process.env.NODE_ENV="production"',
    "--loader:.tsx=tsx",
    "--loader:.ts=ts",
    "--loader:.css=css"
]

print("Running esbuild bundling...")
res = subprocess.run(args, capture_output=True, text=True)
if res.returncode != 0:
    print("Esbuild stdout:", res.stdout)
    print("Esbuild stderr:", res.stderr)
    sys.exit(1)

# Ensure legacy CSS link in index.html is also populated
if OUT_CSS.exists():
    shutil.copyfile(OUT_CSS, ALT_CSS)
    print(f"Synchronized CSS bundle: {OUT_CSS.name} -> {ALT_CSS.name}")

# Update dist/index.html — always point to new bundle filenames
import time
import re

index_html_path = DIST_DIR / "index.html"
ts = int(time.time())

if index_html_path.exists():
    html_content = index_html_path.read_text(encoding="utf-8")

    # Update JS bundle reference (any existing bundle name -> new one)
    html_content = re.sub(
        r'/assets/index-[^"]+\.js(\?v=\d+)?',
        f'/assets/index-uU-ErBbg.js?v={ts}',
        html_content
    )
    # Update CSS bundle reference
    html_content = re.sub(
        r'/assets/index-[^"]+\.css(\?v=\d+)?',
        f'/assets/index-ByajSsLU.css?v={ts}',
        html_content
    )

    index_html_path.write_text(html_content, encoding="utf-8")
    print(f"Updated dist/index.html with v3 bundle references and cache-buster timestamp: {ts}")
else:
    # Create a fresh index.html pointing to the v3 bundle
    fresh_html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/jarvis-icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JARVIS v3.0 // Mark-III Sovereign Protocol OS</title>
    <meta name="description" content="JARVIS v3.0 Mark-III Sovereign — Advanced Autonomous AI Command Center" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="/assets/index-uU-ErBbg.js?v={ts}"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-ByajSsLU.css?v={ts}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"""
    index_html_path.write_text(fresh_html, encoding="utf-8")
    print(f"Created fresh dist/index.html pointing to v3 bundle (ts={ts})")

print(f"SUCCESS! Built bundle saved to: {OUT_JS} ({OUT_JS.stat().st_size} bytes)")

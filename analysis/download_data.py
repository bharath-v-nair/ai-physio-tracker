"""Download the MultiPosture dataset (data.csv) from Zenodo into analysis/data/.

Dataset: Carneros-Prado et al. (2024), MultiPosture, Zenodo,
https://doi.org/10.5281/zenodo.14230872 (CC BY 4.0).

Usage (from the repo root or from analysis/):
    python analysis/download_data.py
"""
import hashlib
import sys
import urllib.request
from pathlib import Path

URL = "https://zenodo.org/api/records/14230872/files/data.csv/content"
EXPECTED_MD5 = "7efbc94d653acf32eefecec3ff26d6c6"
EXPECTED_SIZE = 9_327_935  # bytes

DATA_DIR = Path(__file__).resolve().parent / "data"
TARGET = DATA_DIR / "data.csv"


def md5sum(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if TARGET.exists() and md5sum(TARGET) == EXPECTED_MD5:
        print(f"Already downloaded and checksum OK: {TARGET}")
        return 0

    print(f"Downloading {URL}")
    tmp = TARGET.with_suffix(".part")
    urllib.request.urlretrieve(URL, tmp)

    size = tmp.stat().st_size
    checksum = md5sum(tmp)
    if checksum != EXPECTED_MD5:
        tmp.unlink()
        print(f"Checksum mismatch (got {checksum}, size {size}); file removed.")
        return 1

    tmp.replace(TARGET)
    print(f"Saved {TARGET} ({size:,} bytes, md5 {checksum})")
    return 0


if __name__ == "__main__":
    sys.exit(main())

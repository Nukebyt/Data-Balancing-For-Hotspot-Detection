"""
Preprocess the ICCAD-12 benchmark images into cached numpy arrays.

Each benchmark (iccad1..iccad5) has train/{train_hs,train_nhs} and
test/{test_hs,test_nhs} folders of grayscale PNG layout-clip images.
This script resizes every image to IMG_SIZE x IMG_SIZE (grayscale) and
caches the whole benchmark as a single .npz file so that later
experiments (many balancing strategies x 5 benchmarks) do not have to
re-decode ~165k PNG files from disk every run.
"""
import os
import glob
import numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
import time

RAW_ROOT = os.path.join("data", "extracted", "iccad-official")
CACHE_ROOT = os.path.join("data", "cache")
IMG_SIZE = 64
BENCHMARKS = ["iccad1", "iccad2", "iccad3", "iccad4", "iccad5"]


def _load_one(path):
    with Image.open(path) as im:
        im = im.convert("L").resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
        return np.asarray(im, dtype=np.uint8)


def _load_folder(folder):
    files = sorted(glob.glob(os.path.join(folder, "*")))
    if not files:
        return np.zeros((0, IMG_SIZE, IMG_SIZE), dtype=np.uint8), files
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as ex:
        arrs = list(ex.map(_load_one, files, chunksize=64))
    return np.stack(arrs, axis=0), files


def preprocess_benchmark(name):
    base = os.path.join(RAW_ROOT, name)
    out_path = os.path.join(CACHE_ROOT, f"{name}.npz")
    if os.path.exists(out_path):
        print(f"[skip] {name} already cached at {out_path}")
        return

    t0 = time.time()
    train_hs, _ = _load_folder(os.path.join(base, "train", "train_hs"))
    train_nhs, _ = _load_folder(os.path.join(base, "train", "train_nhs"))
    test_hs, _ = _load_folder(os.path.join(base, "test", "test_hs"))
    test_nhs, _ = _load_folder(os.path.join(base, "test", "test_nhs"))

    os.makedirs(CACHE_ROOT, exist_ok=True)
    np.savez_compressed(
        out_path,
        train_hs=train_hs,
        train_nhs=train_nhs,
        test_hs=test_hs,
        test_nhs=test_nhs,
    )
    dt = time.time() - t0
    print(
        f"[done] {name}: train_hs={len(train_hs)} train_nhs={len(train_nhs)} "
        f"test_hs={len(test_hs)} test_nhs={len(test_nhs)}  ({dt:.1f}s)"
    )


if __name__ == "__main__":
    os.makedirs(CACHE_ROOT, exist_ok=True)
    for b in BENCHMARKS:
        preprocess_benchmark(b)

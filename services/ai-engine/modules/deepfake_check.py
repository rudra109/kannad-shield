"""
Module 4 — Deepfake / Morphed Image Check
Combines two complementary signals:
  1. Error Level Analysis (ELA) — recompresses and diffs the image; high, uneven error
     around face/edit boundaries is a classic manipulation indicator.
  2. EXIF metadata — editing software (Photoshop, GIMP, FaceApp, DeepFaceLab) often
     leaves a signature in the Software tag.

Returns a risk score (0–100) + flag_for_review at ≥ 50.
IMPORTANT: This is a first-pass forensic signal, not a standalone deepfake verdict.
Every flagged image must be reviewed by a trained analyst before any action is taken.
"""

import io
import numpy as np
from PIL import Image, ImageChops

# exifread is a lightweight EXIF parser (no PIL dependency for this part)
try:
    import exifread
    _EXIFREAD_AVAILABLE = True
except ImportError:
    _EXIFREAD_AVAILABLE = False

# Editing tools that commonly appear in the EXIF Software tag of manipulated images
SUSPICIOUS_SOFTWARE_KEYWORDS = [
    "photoshop", "gimp", "faceapp", "deepfacelab", "facetune",
    "lightroom", "affinity", "snapseed", "retouch",
]

ELA_QUALITY = 90          # JPEG recompression quality for ELA
ELA_RISK_MULTIPLIER = 3   # scales the raw ELA mean into 0-100 range
METADATA_RISK_BONUS = 30  # added when a suspicious editing tool is detected


def error_level_analysis(image_bytes: bytes, quality: int = ELA_QUALITY) -> float:
    """
    Recompresses the image at a fixed JPEG quality and computes the pixel-level
    difference between the original and recompressed versions.
    Returns the mean absolute difference across all channels (0 → no manipulation signal).
    """
    orig = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    buf = io.BytesIO()
    orig.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")
    diff = ImageChops.difference(orig, recompressed)
    return float(np.array(diff).mean())


def check_metadata(image_bytes: bytes) -> dict:
    """
    Reads EXIF metadata and checks for known editing-software signatures.
    """
    if not _EXIFREAD_AVAILABLE:
        return {"has_exif": False, "software_tag": "", "suspicious_software": False}

    tags = exifread.process_file(io.BytesIO(image_bytes), details=False)
    software = str(tags.get("Image Software", ""))
    suspicious = any(kw in software.lower() for kw in SUSPICIOUS_SOFTWARE_KEYWORDS)
    return {
        "has_exif": len(tags) > 0,
        "software_tag": software,
        "suspicious_software": suspicious,
    }


def analyze_image(image_bytes: bytes) -> dict:
    """
    Runs both ELA and metadata checks and returns a combined risk score.
    """
    ela_score = error_level_analysis(image_bytes)
    meta = check_metadata(image_bytes)
    risk = min(100.0, ela_score * ELA_RISK_MULTIPLIER + (METADATA_RISK_BONUS if meta["suspicious_software"] else 0))

    return {
        "ela_score": round(ela_score, 2),
        "metadata": meta,
        "risk_score": round(risk, 1),
        "flag_for_review": risk >= 50,
        "note": "Signal for a human forensic analyst — not a standalone deepfake verdict.",
    }

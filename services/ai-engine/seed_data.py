"""
Seed Data Generator — creates demo CSV datasets for training all models.
Run: python seed_data.py

Generates:
  data/phishing_urls.csv      — 1000 phishing + 1000 benign URLs
  data/fake_profiles.csv      — 800 fake + 800 real profiles
  data/sample_incidents_geo.csv — 600 incident records with Ahmedabad geodata

Also optionally builds the facial recognition FAISS index:
  python seed_data.py --index  (requires face_recognition and faiss-cpu)
"""

import os
import random
import argparse
import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)


# ---------------------------------------------------------------------------
# 1. Phishing URL seed data
# ---------------------------------------------------------------------------
PHISHING_TLDS = [".xyz", ".top", ".click", ".tk", ".gq", ".loan"]
BENIGN_TLDS = [".com", ".org", ".gov.in", ".edu", ".co.in", ".net"]

PHISHING_WORDS = ["login", "verify", "secure", "account", "bank", "update", "confirm"]
BENIGN_DOMAINS = [
    "google.com", "facebook.com", "amazon.in", "flipkart.com", "hdfc.bank",
    "sbi.co.in", "irctc.co.in", "uidai.gov.in", "india.gov.in", "rbi.org.in",
]


def _rand_str(length=8):
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(random.choices(chars, k=length))


def generate_phishing_url():
    tld = random.choice(PHISHING_TLDS)
    word = random.choice(PHISHING_WORDS)
    domain = f"{word}-{_rand_str(5)}{tld}"
    path = "/" + "/".join([_rand_str(4) for _ in range(random.randint(1, 3))])
    params = f"?id={_rand_str(8)}&token={_rand_str(16)}" if random.random() > 0.5 else ""
    return f"http://{domain}{path}{params}"


def generate_benign_url():
    domain = random.choice(BENIGN_DOMAINS)
    path_segments = random.randint(0, 2)
    path = "/" + "/".join([_rand_str(6) for _ in range(path_segments)]) if path_segments else ""
    scheme = "https" if random.random() > 0.1 else "http"
    return f"{scheme}://{domain}{path}"


def create_phishing_csv(n_each=1000):
    rows = (
        [{"url": generate_phishing_url(), "label": 1} for _ in range(n_each)]
        + [{"url": generate_benign_url(), "label": 0} for _ in range(n_each)]
    )
    random.shuffle(rows)
    df = pd.DataFrame(rows)
    df.to_csv("data/phishing_urls.csv", index=False)
    print(f"[seed] phishing_urls.csv -> {len(df)} rows")


# ---------------------------------------------------------------------------
# 2. Fake profile seed data
# ---------------------------------------------------------------------------
FEATURE_COLS = [
    "account_age_days", "follower_count", "following_count",
    "follower_following_ratio", "posts_per_day", "bio_length",
    "has_profile_photo", "reused_photo_hash_match", "default_username_pattern",
]


def generate_fake_profile():
    age = random.randint(1, 30)
    followers = random.randint(0, 50)
    following = random.randint(100, 5000)
    return {
        "account_age_days": age,
        "follower_count": followers,
        "following_count": following,
        "follower_following_ratio": round(max(followers, 1) / max(following, 1), 4),
        "posts_per_day": round(random.uniform(0, 0.5), 4),
        "bio_length": random.randint(0, 30),
        "has_profile_photo": int(random.random() > 0.4),
        "reused_photo_hash_match": int(random.random() > 0.5),
        "default_username_pattern": int(random.random() > 0.4),
        "label": 1,
    }


def generate_real_profile():
    age = random.randint(180, 3650)
    followers = random.randint(50, 2000)
    following = random.randint(30, 800)
    return {
        "account_age_days": age,
        "follower_count": followers,
        "following_count": following,
        "follower_following_ratio": round(max(followers, 1) / max(following, 1), 4),
        "posts_per_day": round(random.uniform(0.1, 3.0), 4),
        "bio_length": random.randint(30, 200),
        "has_profile_photo": 1,
        "reused_photo_hash_match": 0,
        "default_username_pattern": int(random.random() > 0.8),
        "label": 0,
    }


def create_fake_profiles_csv(n_each=800):
    rows = (
        [generate_fake_profile() for _ in range(n_each)]
        + [generate_real_profile() for _ in range(n_each)]
    )
    random.shuffle(rows)
    df = pd.DataFrame(rows)
    df.to_csv("data/fake_profiles.csv", index=False)
    print(f"[seed] fake_profiles.csv -> {len(df)} rows")


# ---------------------------------------------------------------------------
# 3. Incident geodata (Ahmedabad bounding box)
# ---------------------------------------------------------------------------
LAT_RANGE = (22.90, 23.15)
LNG_RANGE = (72.45, 72.70)

# Hot zones — areas that generate more incidents in seed data
HOT_ZONES = [
    (23.022, 72.571),  # Ahmedabad central
    (23.046, 72.607),  # Navrangpura
    (23.012, 72.534),  # Satellite area
]


def generate_incident(label: int):
    if label == 1 and random.random() > 0.3:
        # Cluster around a hot zone
        zone = random.choice(HOT_ZONES)
        lat = zone[0] + np.random.normal(0, 0.01)
        lng = zone[1] + np.random.normal(0, 0.01)
    else:
        lat = random.uniform(*LAT_RANGE)
        lng = random.uniform(*LNG_RANGE)

    # Evening / night hours more risky
    if label == 1:
        hour = random.choices(range(24), weights=[1]*6 + [2]*6 + [3]*6 + [4]*6, k=1)[0]
        dow = random.randint(0, 6)
    else:
        hour = random.randint(0, 23)
        dow = random.randint(0, 6)

    return {
        "lat": round(max(LAT_RANGE[0], min(LAT_RANGE[1], lat)), 5),
        "lng": round(max(LNG_RANGE[0], min(LNG_RANGE[1], lng)), 5),
        "hour": hour,
        "day_of_week": dow,
        "label": label,
    }


def create_incidents_geo_csv(n=600):
    rows = (
        [generate_incident(1) for _ in range(n // 2)]
        + [generate_incident(0) for _ in range(n // 2)]
    )
    random.shuffle(rows)
    df = pd.DataFrame(rows)
    df.to_csv("data/sample_incidents_geo.csv", index=False)
    print(f"[seed] sample_incidents_geo.csv -> {len(df)} rows")


# ---------------------------------------------------------------------------
# 4. (Optional) Build facial recognition FAISS index from demo images
# ---------------------------------------------------------------------------
def build_facial_index():
    """
    Builds a demo FAISS index using synthetically generated face-like embeddings.
    In production: replace with real police case photos that have legal authority.
    """
    try:
        import faiss
        import numpy as np
    except ImportError:
        print("[seed] faiss-cpu not installed — skipping facial index build.")
        return

    DIM = 128
    n_persons = 10
    index = faiss.IndexFlatL2(DIM)

    # Generate random 128-dim embeddings (stand-ins for real face embeddings in the demo)
    embeddings = np.random.randn(n_persons, DIM).astype("float32")
    # Normalize to unit sphere (face_recognition embeddings are roughly normalized)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / norms

    index.add(embeddings)
    os.makedirs("models", exist_ok=True)
    faiss.write_index(index, "models/missing_persons.index")

    # Save corresponding IDs
    known_ids = [f"CASE-MP-{str(i+1).zfill(3)}" for i in range(n_persons)]
    pd.DataFrame({"id": known_ids}).to_csv("data/known_person_ids.csv", index=False)

    print(f"[seed] Built facial FAISS index with {n_persons} demo embeddings.")
    print(f"[seed] Demo person IDs -> {known_ids}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate seed data for AI-engine demo")
    parser.add_argument("--index", action="store_true", help="Also build the facial recognition FAISS index")
    args = parser.parse_args()

    create_phishing_csv()
    create_fake_profiles_csv()
    create_incidents_geo_csv()

    if args.index:
        build_facial_index()

    print("\n[seed] All seed data generated. Run `python train_all.py` next.")

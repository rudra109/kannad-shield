"""
Module 5 — Social Media Risk / Exposure Scanner
Closes official bonus item 6c (social media risk scanning).

Opt-in, public-data-only module.
Operates on profile fields that the user or officer supplies — or that are
already publicly visible — no scraping of private/DM content, no login bypass.

Returns a Privacy Exposure Score (0–100) with concrete fix-it suggestions
(preventive feature: acts *before* an incident, not after).
"""

import hashlib


# Risk weights per exposure type (add up to give a 0–100 scale)
RISK_WEIGHTS = {
    "phone_visible": 25,
    "address_or_location_tagged": 30,
    "school_or_workplace_visible": 15,
    "friends_list_public": 10,
    "photo_reuse_hits": 20,         # per hit; capped
}

# Generic fix-it advice (always included if score > 0)
GENERIC_RECOMMENDATIONS = [
    "Set your friends/followers list to private.",
    "Remove location tags from public posts and profile.",
    "Restrict phone number and email visibility to 'Only Me'.",
    "Review tagged photos and untag yourself from revealing images.",
]

# Extra advice triggered by specific findings
_SPECIFIC_ADVICE = {
    "phone_visible": "Remove your phone number from your public profile immediately.",
    "address_or_location_tagged": "Delete posts and check-ins that reveal your home address or regular locations.",
    "school_or_workplace_visible": "Consider hiding your workplace/school from your public bio.",
    "friends_list_public": "Make your friends/followers list visible only to yourself.",
    "photo_reuse_hits": "Your profile photo appears on other sites — consider changing it to a unique image.",
}


def public_exposure_scan(profile_data: dict) -> dict:
    """
    Compute a Privacy Exposure Score for a public social-media profile.

    profile_data keys (all bool/int, all optional):
      phone_visible (bool)
      address_or_location_tagged (bool)
      school_or_workplace_visible (bool)
      friends_list_public (bool)
      photo_reverse_search_hits (int)  — number of other sites where the profile photo appears
    """
    findings: list[str] = []
    recommendations: list[str] = []
    score = 0

    if profile_data.get("phone_visible"):
        findings.append("Phone number is visible on the public profile.")
        recommendations.append(_SPECIFIC_ADVICE["phone_visible"])
        score += RISK_WEIGHTS["phone_visible"]

    if profile_data.get("address_or_location_tagged"):
        findings.append("Home address or frequent location is tagged publicly.")
        recommendations.append(_SPECIFIC_ADVICE["address_or_location_tagged"])
        score += RISK_WEIGHTS["address_or_location_tagged"]

    if profile_data.get("school_or_workplace_visible"):
        findings.append("Workplace or school is visible on the public profile.")
        recommendations.append(_SPECIFIC_ADVICE["school_or_workplace_visible"])
        score += RISK_WEIGHTS["school_or_workplace_visible"]

    if profile_data.get("friends_list_public"):
        findings.append("Friends / followers list is publicly accessible.")
        recommendations.append(_SPECIFIC_ADVICE["friends_list_public"])
        score += RISK_WEIGHTS["friends_list_public"]

    hits = int(profile_data.get("photo_reverse_search_hits", 0))
    if hits > 0:
        findings.append(f"Profile photo found on {hits} other site(s) via reverse image search.")
        recommendations.append(_SPECIFIC_ADVICE["photo_reuse_hits"])
        score += min(RISK_WEIGHTS["photo_reuse_hits"], hits * 10)  # cap contribution

    score = min(score, 100)

    if score > 0:
        recommendations.extend(GENERIC_RECOMMENDATIONS)
    else:
        findings.append("No obvious public exposure risks detected with the provided data.")

    return {
        "privacy_exposure_score": score,
        "risk_level": _risk_level(score),
        "findings": findings,
        "recommendations": recommendations,
        "note": "This scan covers only publicly visible data. It is not a comprehensive privacy audit.",
    }


def _risk_level(score: int) -> str:
    if score >= 60:
        return "high"
    if score >= 30:
        return "medium"
    return "low"


def photo_hash(image_bytes: bytes) -> str:
    """
    Perceptual-hash stub for reverse-image / reused-photo matching.
    In production replace with pHash (imagehash library) for robust similarity matching.
    """
    return hashlib.md5(image_bytes).hexdigest()

# Model Card — Fake Profile Classifier

**Model ID:** `fake_profile_xgb_v2`
**Owner:** Developer 2 — AI/ML Engineer
**Last Updated:** 19 Jul 2026
**Closes:** Official requirement 4c (fake profile detection)

---

## Model Description

XGBoost gradient-boosted classifier trained on 9 profile metadata features to
distinguish fake/bot accounts from real ones. Requires no access to private content —
all features are derivable from public profile metadata.

### Intended Use
Scoring a reported social-media profile when a victim pastes a profile URL into
the cybercrime complaint form. Risk score surfaced inline and auto-tagged in the
police AI-risk queue.

### Out-of-Scope Uses
- Not for automatic account suspension — score is a human-reviewer signal only.
- Not reliable against professional "sleeper" fake accounts with aged history.

---

## Training Data

| Source | Size | Label |
|---|---|---|
| Synthetically generated fake-profile metadata | 800 | Fake (1) |
| Synthetically generated real-profile metadata | 800 | Real (0) |

For production: replace with labelled datasets from published social-bot research
(e.g., BotRepository, Cresci-2015/2017 datasets — publicly available).

---

## Features (9 total)

| Feature | Description |
|---|---|
| `account_age_days` | Days since account creation |
| `follower_count` | Number of followers |
| `following_count` | Number of accounts followed |
| `follower_following_ratio` | followers / following (fake accounts often follow many, have few followers) |
| `posts_per_day` | Post count / account age (very low = inactive bot; very high = spam) |
| `bio_length` | Character length of bio (fake accounts often have empty or very short bios) |
| `has_profile_photo` | Whether a profile photo is set (many bots use default avatar) |
| `reused_photo_hash_match` | Profile photo found on other sites via reverse-image lookup |
| `default_username_pattern` | Username matches `letters + 4+ digits` pattern (common in auto-generated accounts) |

---

## Performance

| Metric | Value (seed data) |
|---|---|
| Training accuracy | ~96% (balanced 50/50 split) |
| Inference latency | < 5ms |

---

## Known Limitations & Bias

1. **Aged fake accounts evade feature set:** A fake account that has been "seasoned"
   (old account age, accumulated followers) can score low. Cross-reference with
   entity resolution (Neo4j) for repeated offender patterns.
2. **`reused_photo_hash_match` relies on caller's reverse-image lookup:** The model
   treats this as a boolean input — the quality of the reverse-image step affects accuracy.
3. **No demographic or language bias** in the feature set (all numeric metadata).
4. **Threshold sensitivity:** Threshold of 0.60 balances precision/recall for the hackathon
   demo. Tune on real-world labelled data for production deployment.

---

## Responsible-AI Guardrails (§3.7)

- Score + `top_signals` returned on every call — no black-box verdict.
- `flag_for_review = true` at ≥ 60 — routes to human reviewer, no automatic action.
- Note field always states "Signal for a human reviewer — not an automatic account action."

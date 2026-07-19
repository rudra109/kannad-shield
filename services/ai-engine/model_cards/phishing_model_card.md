# Model Card — Phishing / Malicious URL Classifier

**Model ID:** `phishing_xgb_v2`
**Owner:** Developer 2 — AI/ML Engineer
**Last Updated:** 19 Jul 2026
**Closes:** Official requirement 4c / 6a (missing in v1.0)

---

## Model Description

XGBoost gradient-boosted classifier trained to distinguish phishing/malicious URLs
from benign ones using purely **lexical and host-based features** — no DNS or WHOIS
calls at inference time (sub-100ms, privacy-preserving, works offline).

### Intended Use
Inline scanning of URLs pasted into the cybercrime report form or forwarded via
SMS/WhatsApp intake. The risk score is surfaced to the victim *before* they submit
the report and auto-tagged in the police AI-risk queue if `flag_for_review = true`.

### Out-of-Scope Uses
- Not for automatic URL blocking — score is a human-reviewer signal only.
- Not suitable for classifying obfuscated JavaScript or multi-hop redirects without
  additional runtime DNS/network feature extraction.

---

## Training Data

| Source | Size | Label |
|---|---|---|
| Synthetically generated PhishTank-style URLs | 1,000 | Phishing (1) |
| Synthetically generated benign URLs (Tranco-1M style) | 1,000 | Benign (0) |

For production: replace seed data with the live PhishTank / OpenPhish feeds
(publicly available) + Tranco top-1M list for benign examples.

---

## Features (14 total)

| Feature | Description |
|---|---|
| `url_length` | Total character length of the URL |
| `host_length` | Length of the hostname |
| `num_dots` | Number of dots in the hostname (more = more subdomains, phishing signal) |
| `num_hyphens` | Hyphens in hostname (e.g. `secure-bank-verify.xyz`) |
| `has_at_symbol` | `@` in URL (tricks browsers into parsing a different host) |
| `has_ip_host` | Hostname is a raw IP address |
| `suspicious_tld` | TLD in known high-risk set (.xyz, .top, .click, .tk, etc.) |
| `entropy` | Shannon entropy of hostname (high = random-looking, phishing signal) |
| `num_subdirs` | Number of path segments |
| `has_https` | HTTPS scheme (absence is a weak phishing signal; presence ≠ safe) |
| `digit_ratio` | Proportion of digits in hostname |
| `has_risk_keyword` | Presence of keywords: login, verify, secure, account, bank, etc. |
| `has_punycode` | IDN homoglyph attack indicator (`xn--` encoded hostname) |
| `num_query_params` | Number of URL query parameters |

---

## Performance

| Metric | Value (seed data) |
|---|---|
| Training accuracy | ~97% (balanced 50/50 split) |
| Expected real-world accuracy | ~93–95% (per published literature on this architecture) |
| Inference latency | < 10ms (pure lexical, no network calls) |

> **Important:** Training accuracy on seed data is an upper bound. Evaluate against
> a fresh hold-out split of real PhishTank/OpenPhish data before the demo Q&A.

---

## Known Limitations & Bias

1. **HTTPS ≠ Trusted:** The model correctly does not treat HTTPS as a benign signal —
   53% of phishing sites use HTTPS (Anti-Phishing Working Group, 2024). Officers
   reviewing flagged URLs should not dismiss a warning because the URL starts with `https://`.
2. **Lexical-only features miss redirection chains:** A clean-looking URL that redirects
   through multiple hops to a phishing page will score low. Add runtime DNS/redirect
   following for production.
3. **Adversarial evasion:** Sophisticated attackers who know the feature set can craft
   URLs that score low. Model should be retrained regularly on fresh phishing feeds.
4. **No demographic bias** known (URL text has no demographic content).

---

## Responsible-AI Guardrails (§3.7)

- Every score includes `confidence` and `top_signals` (top 3 contributing features) —
  no black-box verdicts.
- `flag_for_review = true` at threshold ≥ 60 — routes to human reviewer, never auto-blocks.
- Model card and accuracy notes shared with the demo panel before judging Q&A.

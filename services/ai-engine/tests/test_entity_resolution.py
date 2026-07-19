"""
Tests — Entity Resolution (Repeat-Offender Graph)

Run: pytest tests/test_entity_resolution.py -v
Note: Neo4j not required — tests verify stub behavior when Neo4j is unavailable.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from modules.entity_resolution import (
    get_linked_cases,
    get_repeat_offender_summary,
    _NEO4J_AVAILABLE,
)


# ---------------------------------------------------------------------------
# Stub / fallback behavior tests (always run, no Neo4j required)
# ---------------------------------------------------------------------------

def test_get_linked_cases_returns_list():
    result = get_linked_cases("FAKE-INCIDENT-001")
    assert isinstance(result, list)


def test_get_linked_cases_stub_data():
    """When Neo4j is unavailable, stub data should still be returned for demo."""
    if _NEO4J_AVAILABLE:
        pytest.skip("Neo4j is available — stub test not applicable.")
    result = get_linked_cases("FAKE-INCIDENT-001")
    assert len(result) > 0
    assert "linked_incident" in result[0]
    assert "via" in result[0]
    assert "shared_value" in result[0]


def test_get_repeat_offender_summary_structure():
    summary = get_repeat_offender_summary("FAKE-INCIDENT-001")
    assert "incident_id" in summary
    assert "is_repeat_offender" in summary
    assert "linked_case_count" in summary
    assert "linked_cases" in summary
    assert "flag_for_review" in summary
    assert "note" in summary


def test_summary_is_repeat_offender_matches_count():
    summary = get_repeat_offender_summary("ANY-INCIDENT")
    assert summary["is_repeat_offender"] == (summary["linked_case_count"] > 0)


def test_summary_flag_matches_is_repeat():
    summary = get_repeat_offender_summary("ANY-INCIDENT")
    assert summary["flag_for_review"] == summary["is_repeat_offender"]


def test_summary_note_present():
    summary = get_repeat_offender_summary("ANY-INCIDENT")
    assert len(summary["note"]) > 0

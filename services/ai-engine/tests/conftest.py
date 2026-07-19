# tests/conftest.py
import pytest

def pytest_configure(config):
    """Register custom pytest marks."""
    config.addinivalue_line(
        "markers",
        "slow: marks tests that require HuggingFace model downloads (deselect with -m 'not slow')"
    )

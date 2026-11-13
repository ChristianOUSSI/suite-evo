from app.utils import format_phone, normalize_phone


def test_cameroon_phone_normalization():
    assert normalize_phone("6 77 08 41 96") == "+237677084196"
    assert normalize_phone("00237 655 23 90 14") == "+237655239014"
    assert normalize_phone("+237 699 14 22 08") == "+237699142208"
    assert normalize_phone("237 6 74 82 15 93") == "+237674821593"
    assert normalize_phone("6 77 08 41") is None
    assert normalize_phone("abc") is None


def test_display_phone_keeps_local_rhythm():
    assert format_phone("+237677084196") == "+237 6 77 08 41 96"
    assert format_phone(None) == "Non renseigné"

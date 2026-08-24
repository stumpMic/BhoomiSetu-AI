import sys
import unittest
from pathlib import Path

# Add backend to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.ocr_service import OCRService

SAMPLE_DOCS_DIR = Path(__file__).resolve().parent.parent / "sample-documents"

class DummyParcel:
    plot_number = "142/A"
    khata_number = "312"
    area_acres = 4.5

class TestOCRMatching(unittest.TestCase):
    def test_exact_match(self):
        file_path = str(SAMPLE_DOCS_DIR / "valid_ror_plot142a.txt")
        parcel = DummyParcel()
        res = OCRService.extract_and_analyze(
            file_path=file_path,
            filename="valid_ror_plot142a.txt",
            official_parcel=parcel,
            official_owner_name="Bikram Keshari Das"
        )
        self.assertFalse(res["has_discrepancy"])
        self.assertEqual(res["status"], "Verified")
        self.assertTrue(res["plot_match"])

    def test_plot_mismatch(self):
        file_path = str(SAMPLE_DOCS_DIR / "mismatched_plot_ror.txt")
        parcel = DummyParcel()
        res = OCRService.extract_and_analyze(
            file_path=file_path,
            filename="mismatched_plot_ror.txt",
            official_parcel=parcel,
            official_owner_name="Bikram Keshari Das"
        )
        self.assertTrue(res["has_discrepancy"])
        self.assertEqual(res["status"], "Possible Mismatch")
        self.assertFalse(res["plot_match"])
        self.assertGreater(len(res["flagged_issues"]), 0)

if __name__ == "__main__":
    unittest.main()

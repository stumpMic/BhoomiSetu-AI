# BhoomiSetu AI — Sample Land Record Documents

Synthetic documents for testing OCR extraction, field parsing, and discrepancy detection.

## Categories
1. `valid/`: Clean, correctly matching Record of Rights (RoR / Patta), mutation slips, and Aadhaar consent forms where all extracted fields (Owner Name, Plot No, Khata No, Area) match the official database.
2. `mismatched/`: Documents intentionally containing discrepancies (e.g. Plot `142` instead of `142/A`, minor spelling variations in owner name, area discrepancy) to trigger RapidFuzz warning alerts.
3. `unreadable/`: Low-resolution, noisy, or corrupted scans to test the system's low-confidence warning and manual officer fallback.

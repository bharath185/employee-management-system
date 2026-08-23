# Letter formats (generate templates)

These HTML files are the **source of truth** for document generate.

On API startup, templates are loaded from this folder (or `employee-management-api/src/main/resources/letters/` in production) and upserted into `document_templates`.

| File | Template type |
|---|---|
| `letterhead.html` | Shared header on every letter |
| `joining-letter.html` | JOINING_LETTER |
| `offer-letter.html` | OFFER_LETTER |
| `appointment-letter.html` | APPOINTMENT_LETTER |
| `confirmation-letter.html` | CONFIRMATION_LETTER |
| `experience-letter.html` | EXPERIENCE_LETTER |
| `relieving-letter.html` | RELIEVING_LETTER |
| `noc.html` | NOC |
| `salary-slip.html` | SALARY_SLIP |

Keep `{{placeholders}}` when you edit wording. Generate fills them from employee + company data.

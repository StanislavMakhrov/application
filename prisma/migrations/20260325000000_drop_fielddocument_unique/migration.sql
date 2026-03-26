-- Drop the unique index on FieldDocument(fieldKey, year) so multiple
-- documents can be attached per emission category per year (e.g., 12 monthly
-- invoices + 1 annual settlement). Existing rows are preserved unchanged.
DROP INDEX "FieldDocument_fieldKey_year_key";

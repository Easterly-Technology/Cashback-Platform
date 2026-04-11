CREATE TEMP TABLE "legacy_qr_codes_to_delete" AS
SELECT "id"
FROM "transaction_qr_codes"
WHERE "payload"::jsonb ? 'items';

CREATE TEMP TABLE "legacy_transactions_to_detach" AS
SELECT "id"
FROM "transactions"
WHERE "qr_code_id" IN (SELECT "id" FROM "legacy_qr_codes_to_delete");

DELETE FROM "transaction_items"
WHERE "transaction_id" IN (SELECT "id" FROM "legacy_transactions_to_detach");

UPDATE "transactions"
SET "qr_code_id" = NULL
WHERE "id" IN (SELECT "id" FROM "legacy_transactions_to_detach");

DELETE FROM "audit_logs"
WHERE "resource_type" = 'TRANSACTION_QR'
  AND "resource_id" IN (
    SELECT "id"
    FROM "legacy_qr_codes_to_delete"
  );

DELETE FROM "transaction_qr_codes"
WHERE "id" IN (SELECT "id" FROM "legacy_qr_codes_to_delete");

DROP TABLE "legacy_transactions_to_detach";
DROP TABLE "legacy_qr_codes_to_delete";

DROP TABLE "transaction_items";

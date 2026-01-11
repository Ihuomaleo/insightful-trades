-- Make the trade-screenshots bucket private to protect sensitive trading data
UPDATE storage.buckets
SET public = false
WHERE id = 'trade-screenshots';
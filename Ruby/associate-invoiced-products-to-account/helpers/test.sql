ALTER TABLE billing.cdyne_validation
  ADD COLUMN status varchar(20),
  ALTER COLUMN status SET default 'Started';

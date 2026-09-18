-- Optional PostgreSQL RLS for multi-tenant isolation.
-- Application still scopes every query by store_id from the session.
-- To enable: SET app.store_id = '<store-cuid>'; before tenant queries.

ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlockedDate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Promotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_category ON "Category"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_product ON "Product"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_order ON "Order"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_customer ON "Customer"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_blocked ON "BlockedDate"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_zone ON "DeliveryZone"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_stock ON "StockMovement"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_promo ON "Promotion"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_analytics ON "AnalyticsEvent"
  USING ("storeId" = current_setting('app.store_id', true));
CREATE POLICY tenant_isolation_integration ON "Integration"
  USING ("storeId" = current_setting('app.store_id', true));

export type SupplierTestResult = {
  slug: string;
  ok: boolean;
  status: "connected" | "missing_secret" | "auth_failed" | "unreachable" | "not_supported";
  message: string;
};

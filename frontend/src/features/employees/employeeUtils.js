export const statuses = ["active", "notice_period", "exited"];
export const statusLabels = { active: "Active", notice_period: "Notice period", exited: "Exited" };
export const roleLabels = { employee: "Employee", manager: "Manager", hr: "HR", admin: "Administrator" };

export function idOf(value) { return value && typeof value === "object" ? value._id ?? value.id : value; }
export function labelOf(value, fallback = "Not available") { return value && typeof value === "object" ? value.name ?? value.email ?? idOf(value) ?? fallback : value || fallback; }
export function formatDate(value) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Not available"; }
export function formatCurrency(value) { return value === undefined || value === null ? "Not available" : new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }


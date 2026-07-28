export function attendanceStatus(record) { if (record.presentDays > 0 && record.absentDays === 0) return "present"; if (record.absentDays > 0 && record.presentDays === 0) return "absent"; return "mixed"; }
export const attendanceStatusLabels = { present: "Present", absent: "Absent", mixed: "Mixed" };
export function formatPeriod(value) { return value ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value)) : "Not available"; }
export function formatShortDate(value) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Not available"; }
export function employeeLabel(employee) { return employee && typeof employee === "object" ? employee.employeeCode ?? employee.name ?? employee.email ?? employee._id ?? employee.id : employee || "Unknown employee"; }


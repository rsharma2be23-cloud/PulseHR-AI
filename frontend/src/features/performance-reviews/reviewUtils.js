export function ratingLabel(rating) { return `${rating}/5`; }
export function formatReviewPeriod(value) { return value || "Not available"; }
export function reviewerLabel(reviewer) { return reviewer && typeof reviewer === "object" ? reviewer.name ?? reviewer.email ?? reviewer._id ?? reviewer.id : reviewer || "Not available"; }
export function employeeLabel(employee) { return employee && typeof employee === "object" ? employee.employeeCode ?? employee.name ?? employee.email ?? employee._id ?? employee.id : employee || "Not available"; }


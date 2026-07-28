export const surveyFields = ["jobSatisfaction", "workLifeBalance", "careerGrowth", "managerSupport", "compensationSatisfaction"];
export const surveyLabels = { jobSatisfaction: "Job satisfaction", workLifeBalance: "Work-life balance", careerGrowth: "Career growth", managerSupport: "Manager support", compensationSatisfaction: "Compensation satisfaction" };
export function averageSurveyScore(survey) { const scores = surveyFields.map((field) => Number(survey[field]) || 0); return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0; }
export function employeeLabel(employee) { return employee && typeof employee === "object" ? employee.employeeCode ?? employee.name ?? employee.email ?? employee._id ?? employee.id : employee || "Not available"; }
export function sentimentLabel(value) { return value ? value[0].toUpperCase() + value.slice(1) : "Not available"; }
export function formatDate(value) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Not available"; }


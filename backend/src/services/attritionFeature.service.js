const { Attendance } = require("../models/attendance.model");
const { Department } = require("../models/department.model");
const { Feedback } = require("../models/feedback.model");
const { PerformanceReview } = require("../models/performanceReview.model");
const { Survey } = require("../models/survey.model");

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function fullYears(date) { return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))); }
function stableEmployeeNumber(employee) { return parseInt(employee._id.toString().slice(-8), 16) % 1000000000; }
function modelDepartment(name) { const value = String(name || "").toLowerCase(); if (value.includes("sales")) return "Sales"; if (value.includes("human")) return "Human Resources"; return "Research & Development"; }
function jobLevel(designation) { const value = String(designation || "").toLowerCase(); if (value.includes("director") || value.includes("head")) return 5; if (value.includes("manager")) return 4; if (value.includes("senior") || value.includes("lead")) return 3; if (value.includes("junior") || value.includes("intern")) return 1; return 2; }
function jobRole(designation) { const value = String(designation || "").toLowerCase(); if (value.includes("manager")) return "Manager"; if (value.includes("sales")) return "Sales Executive"; if (value.includes("hr") || value.includes("human resource")) return "Human Resources"; if (value.includes("research") || value.includes("scientist")) return "Research Scientist"; if (value.includes("lab")) return "Laboratory Technician"; return "Healthcare Representative"; }
function scoreToFour(value, fallback) { return value ? clamp(Math.round((Number(value) / 5) * 4), 1, 4) : fallback; }

async function buildAttritionFeatures(employee) {
  const [department, attendance, review, survey, feedback] = await Promise.all([
    Department.findById(employee.department), Attendance.findOne({ employee: employee._id }).sort({ period: -1 }), PerformanceReview.findOne({ employee: employee._id }).sort({ createdAt: -1 }), Survey.findOne({ employee: employee._id }).sort({ submittedAt: -1 }), Feedback.findOne({ employee: employee._id }).sort({ submittedAt: -1 }),
  ]);
  const defaults = ["BusinessTravel", "DistanceFromHome", "Education", "EducationField", "Gender", "MaritalStatus", "NumCompaniesWorked", "PercentSalaryHike", "RelationshipSatisfaction", "StockOptionLevel", "TrainingTimesLastYear"];
  const yearsAtCompany = fullYears(employee.dateOfJoining); const yearsSincePromotion = employee.lastPromotionDate ? fullYears(employee.lastPromotionDate) : yearsAtCompany; const monthlyIncome = Math.max(0, Math.round(employee.salary));
  const features = {
    Age: clamp(employee.age, 18, 100), BusinessTravel: "Travel_Rarely", DailyRate: Math.round(monthlyIncome / 22), Department: modelDepartment(department?.name), DistanceFromHome: 10, Education: 3, EducationField: "Other", EmployeeCount: 1, EmployeeNumber: stableEmployeeNumber(employee), EnvironmentSatisfaction: feedback?.sentimentLabel === "negative" ? 2 : 3, Gender: "Male", HourlyRate: Math.round(monthlyIncome / 176), JobInvolvement: 3, JobLevel: jobLevel(employee.designation), JobRole: jobRole(employee.designation), JobSatisfaction: scoreToFour(survey?.jobSatisfaction, 3), MaritalStatus: "Single", MonthlyIncome: monthlyIncome, MonthlyRate: monthlyIncome, NumCompaniesWorked: 1, Over18: "Y", OverTime: Number(attendance?.overtimeHours || 0) > 0 ? "Yes" : "No", PercentSalaryHike: 10, PerformanceRating: scoreToFour(review?.rating, 3), RelationshipSatisfaction: 3, StandardHours: 80, StockOptionLevel: 0, TotalWorkingYears: yearsAtCompany, TrainingTimesLastYear: 3, WorkLifeBalance: scoreToFour(survey?.workLifeBalance, 3), YearsAtCompany: yearsAtCompany, YearsInCurrentRole: yearsAtCompany, YearsSinceLastPromotion: yearsSincePromotion, YearsWithCurrManager: employee.manager ? yearsAtCompany : 0,
  };
  if (!department) defaults.push("Department mapped to Research & Development because no department document was found");
  if (!attendance) defaults.push("OverTime derived as No because no attendance record was found");
  if (!review) defaults.push("PerformanceRating defaulted to 3 because no performance review was found");
  if (!survey) defaults.push("Survey satisfaction scores defaulted to 3 because no survey response was found");
  if (!feedback) defaults.push("EnvironmentSatisfaction defaulted to 3 because no feedback was found");
  defaults.push("salary is used as MonthlyIncome because salary frequency is not stored");
  return { features, defaults };
}

module.exports = { buildAttritionFeatures };


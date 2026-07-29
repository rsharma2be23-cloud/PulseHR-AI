const { Attendance } = require("../models/attendance.model");
const { AttritionPrediction } = require("../models/attritionPrediction.model");
const { Feedback } = require("../models/feedback.model");
const { PerformanceReview } = require("../models/performanceReview.model");
const { Survey } = require("../models/survey.model");

const SURVEY_FIELDS = ["jobSatisfaction", "workLifeBalance", "careerGrowth", "managerSupport", "compensationSatisfaction"];
const clip = (value, length = 700) => String(value || "").trim().slice(0, length);
const round = (value, places = 2) => Number(Number(value).toFixed(places));

function average(items, field) { return items.length ? round(items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / items.length) : null; }

async function collectManagerCoachEvidence(employee) {
  await employee.populate("department", "name");
  const [attendance, reviews, surveys, feedback, prediction] = await Promise.all([
    Attendance.find({ employee: employee._id }).sort({ period: -1 }).limit(6).lean(),
    PerformanceReview.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(3).lean(),
    Survey.find({ employee: employee._id }).sort({ submittedAt: -1 }).limit(3).lean(),
    Feedback.find({ employee: employee._id }).sort({ submittedAt: -1 }).limit(3).lean(),
    AttritionPrediction.findOne({ employee: employee._id }).sort({ predictedAt: -1 }).lean(),
  ]);
  const totalWorkingDays = attendance.reduce((sum, item) => sum + item.workingDays, 0);
  const totalAbsentDays = attendance.reduce((sum, item) => sum + item.absentDays, 0);
  const missingInformation = [];
  if (!attendance.length) missingInformation.push("attendance records");
  if (!reviews.length) missingInformation.push("performance reviews");
  if (!surveys.length) missingInformation.push("employee surveys");
  if (!feedback.length) missingInformation.push("employee feedback");
  if (!prediction) missingInformation.push("attrition prediction and SHAP explanations");

  return {
    employee: { employeeCode: employee.employeeCode, designation: employee.designation, department: employee.department?.name || "Unavailable", employmentStatus: employee.employmentStatus, dateOfJoining: employee.dateOfJoining },
    attendance: attendance.length ? { periodsReviewed: attendance.length, totalWorkingDays, totalAbsentDays, absenceRate: totalWorkingDays ? round(totalAbsentDays / totalWorkingDays) : null, overtimeHours: round(attendance.reduce((sum, item) => sum + item.overtimeHours, 0)), periods: attendance.map((item) => ({ period: item.period, workingDays: item.workingDays, presentDays: item.presentDays, absentDays: item.absentDays, overtimeHours: item.overtimeHours })) } : null,
    performance: reviews.length ? { averageRating: average(reviews, "rating"), reviews: reviews.map((item) => ({ reviewPeriod: item.reviewPeriod, rating: item.rating, comments: clip(item.comments) })) } : null,
    surveys: surveys.length ? { responsesReviewed: surveys.length, averages: Object.fromEntries(SURVEY_FIELDS.map((field) => [field, average(surveys, field)])), latestSubmittedAt: surveys[0].submittedAt } : null,
    feedback: feedback.length ? { responsesReviewed: feedback.length, sentimentCounts: feedback.reduce((counts, item) => ({ ...counts, [item.sentimentLabel || "unclassified"]: (counts[item.sentimentLabel || "unclassified"] || 0) + 1 }), {}), excerpts: feedback.map((item) => ({ sentiment: item.sentimentLabel, score: item.sentimentScore, submittedAt: item.submittedAt, text: clip(item.text) })) } : null,
    attrition: prediction ? { probability: prediction.probability, riskLevel: prediction.riskLevel, prediction: prediction.prediction, modelVersion: prediction.modelVersion, predictedAt: prediction.predictedAt, shapFactors: (prediction.explanations || []).slice(0, 8).map((item) => ({ feature: item.feature, direction: item.direction, contribution: item.contribution, importance: item.importance, rank: item.rank })) } : null,
    missingInformation,
  };
}

module.exports = { collectManagerCoachEvidence };

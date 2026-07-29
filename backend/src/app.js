const express = require("express");
const { createCorsMiddleware } = require("./config/cors");
const { errorHandler } = require("./middleware/error.middleware");
const { authRouter } = require("./routes/auth.routes");
const { attendanceRouter } = require("./routes/attendance.routes");
const { departmentRouter } = require("./routes/department.routes");
const { employeeRouter } = require("./routes/employee.routes");
const { feedbackRouter } = require("./routes/feedback.routes");
const { healthRouter } = require("./routes/health.routes");
const { performanceReviewRouter } = require("./routes/performanceReview.routes");
const { rbacRouter } = require("./routes/rbac.routes");
const { surveyRouter } = require("./routes/survey.routes");
const { attritionPredictionRouter } = require("./routes/attritionPrediction.routes");
const { knowledgeRouter } = require("./routes/knowledge.routes");
const { copilotRouter } = require("./routes/copilot.routes");
const { managerCoachRouter } = require("./routes/managerCoach.routes");

const app = express();

app.use(createCorsMiddleware());
app.use(express.json());
app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/employees", employeeRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/rbac", rbacRouter);
app.use("/api/v1/performance-reviews", performanceReviewRouter);
app.use("/api/v1/surveys", surveyRouter);
app.use("/api/v1/attrition-predictions", attritionPredictionRouter);
app.use("/api/v1/knowledge", knowledgeRouter);
app.use("/api/v1/copilot", copilotRouter);
app.use("/api/v1/manager-coach", managerCoachRouter);
app.use(errorHandler);

module.exports = app;

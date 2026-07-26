const { model, models, Schema } = require("mongoose");

const satisfactionScore = { type: Number, required: true, min: 1, max: 5 };

const surveySchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    jobSatisfaction: satisfactionScore,
    workLifeBalance: satisfactionScore,
    careerGrowth: satisfactionScore,
    managerSupport: satisfactionScore,
    compensationSatisfaction: satisfactionScore,
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

surveySchema.index({ employee: 1, submittedAt: -1 });

const Survey = models.Survey || model("Survey", surveySchema);

module.exports = { Survey };

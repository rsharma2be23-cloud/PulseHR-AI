const { model, models, Schema } = require("mongoose");

const topFactorSchema = new Schema(
  {
    feature: { type: String, required: true, trim: true, maxlength: 100 },
    contribution: { type: Number, required: true },
  },
  { _id: false },
);

const attritionPredictionSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    riskScore: { type: Number, required: true, min: 0, max: 1 },
    riskLevel: { type: String, required: true, enum: ["low", "moderate", "high", "critical"] },
    modelVersion: { type: String, required: true, trim: true, maxlength: 100 },
    topFactors: { type: [topFactorSchema], default: [] },
    predictedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

attritionPredictionSchema.index({ employee: 1, predictedAt: -1 });

const AttritionPrediction = models.AttritionPrediction || model("AttritionPrediction", attritionPredictionSchema);

module.exports = { AttritionPrediction };

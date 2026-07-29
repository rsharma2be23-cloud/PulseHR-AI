const { model, models, Schema } = require("mongoose");

const topFactorSchema = new Schema(
  {
    feature: { type: String, required: true, trim: true, maxlength: 100 },
    contribution: { type: Number, required: true },
    direction: { type: String, enum: ["increase risk", "decrease risk"], required: true },
    importance: { type: Number, required: true, min: 0 },
    rank: { type: Number, min: 1 },
  },
  { _id: false },
);

const attritionPredictionSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    probability: { type: Number, required: true, min: 0, max: 1 },
    riskLevel: { type: String, required: true, enum: ["low", "medium", "high"] },
    prediction: { type: String, required: true, enum: ["attrition", "stay"] },
    threshold: { type: Number, required: true, min: 0, max: 1 },
    modelVersion: { type: String, required: true, trim: true, maxlength: 100 },
    mappingDefaults: { type: [String], default: [] },
    explanations: { type: [topFactorSchema], default: [] },
    shapValues: {
      type: [{ feature: { type: String, required: true }, value: { type: Number, required: true } }],
      default: [],
      _id: false,
    },
    predictedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

attritionPredictionSchema.index({ employee: 1, predictedAt: -1 });

const AttritionPrediction = models.AttritionPrediction || model("AttritionPrediction", attritionPredictionSchema);

module.exports = { AttritionPrediction };

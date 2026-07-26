const { model, models, Schema } = require("mongoose");

const feedbackSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    sentimentLabel: { type: String, enum: ["positive", "neutral", "negative"], default: null },
    sentimentScore: { type: Number, min: -1, max: 1, default: null },
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

feedbackSchema.index({ employee: 1, submittedAt: -1 });

const Feedback = models.Feedback || model("Feedback", feedbackSchema);

module.exports = { Feedback };

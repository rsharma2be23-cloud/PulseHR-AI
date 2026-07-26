const { model, models, Schema } = require("mongoose");

const performanceReviewSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewPeriod: { type: String, required: true, trim: true, maxlength: 50 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String, trim: true, maxlength: 5000 },
  },
  { timestamps: true },
);

performanceReviewSchema.index({ employee: 1, reviewPeriod: -1 });

const PerformanceReview = models.PerformanceReview || model("PerformanceReview", performanceReviewSchema);

module.exports = { PerformanceReview };

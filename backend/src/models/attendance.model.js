const { model, models, Schema } = require("mongoose");

const attendanceSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    period: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value.getUTCDate() === 1,
        message: "Attendance period must use the first day of its month in UTC.",
      },
    },
    workingDays: { type: Number, required: true, min: 0 },
    presentDays: { type: Number, required: true, min: 0 },
    absentDays: { type: Number, required: true, min: 0 },
    overtimeHours: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

attendanceSchema.index({ employee: 1, period: -1 }, { unique: true });
attendanceSchema.path("absentDays").validate(function validateAttendanceTotal() {
  return this.presentDays + this.absentDays <= this.workingDays;
}, "Present and absent days cannot exceed working days.");

const Attendance = models.Attendance || model("Attendance", attendanceSchema);

module.exports = { Attendance };

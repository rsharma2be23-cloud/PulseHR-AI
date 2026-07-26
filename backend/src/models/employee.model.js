const { model, models, Schema } = require("mongoose");

const employeeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    employeeCode: { type: String, required: true, unique: true, trim: true, uppercase: true, minlength: 3, maxlength: 30 },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    manager: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    designation: { type: String, required: true, trim: true, maxlength: 100 },
    dateOfJoining: { type: Date, required: true },
    age: { type: Number, required: true, min: 16, max: 100 },
    salary: { type: Number, required: true, min: 0 },
    employmentStatus: {
      type: String,
      required: true,
      enum: ["active", "notice_period", "exited"],
      default: "active",
    },
    lastPromotionDate: { type: Date, default: null },
  },
  { timestamps: true },
);

const Employee = models.Employee || model("Employee", employeeSchema);

module.exports = { Employee };

const { model, models, Schema } = require("mongoose");

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
    manager: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  },
  { timestamps: true },
);

const Department = models.Department || model("Department", departmentSchema);

module.exports = { Department };

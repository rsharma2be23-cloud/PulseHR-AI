const { model, models, Schema } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["employee", "manager", "hr", "admin"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = models.User || model("User", userSchema);

module.exports = { User };

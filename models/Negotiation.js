const mongoose = require("mongoose");

const negotiationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."]
    },
    phone: { type: String, required: true, trim: true, maxlength: 25, match: [/^[+0-9() .-]{7,25}$/, "Enter a valid phone number."] },
    destination: { type: String, required: true, trim: true },
    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: "Destination" },
    plan: { type: String, required: true, trim: true, enum: ["Basic", "Standard", "Premium"] },
    travelers: { type: Number, required: true, min: 1, max: 50 },
    travelDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value >= new Date(new Date().toISOString().slice(0, 10)),
        message: "Travel date cannot be in the past."
      }
    },
    currentPrice: { type: Number, required: true, min: 1 },
    proposedPrice: { type: Number, required: true, min: 1 },
    message: { type: String, trim: true, maxlength: 2000, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Negotiation", negotiationSchema);

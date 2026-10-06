const mongoose = require("mongoose");

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    duration: { type: Number, required: true, min: 1, max: 60 },
    price: { type: Number, required: true, min: 1 },
    activities: { type: [String], required: true },
    image: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => {
          try {
            return ["http:", "https:"].includes(new URL(value).protocol);
          } catch {
            return false;
          }
        },
        message: "Image must be a valid HTTP or HTTPS URL."
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Destination", destinationSchema);

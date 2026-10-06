const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const { sendTripNotification } = require("../services/notificationService");

const router = express.Router();
const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

function makeTripId() {
  return `TRIP${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;
}

function tripLookup(id) {
  const lookup = id.trim();
  return mongoose.isValidObjectId(lookup)
    ? { $or: [{ _id: lookup }, { tripId: lookup.toUpperCase() }] }
    : { tripId: lookup.toUpperCase() };
}

function hasValidAdminKey(req) {
  const expected = process.env.ADMIN_API_KEY;
  const supplied = req.get("x-admin-api-key") || "";
  if (!expected) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "Send trip details as a JSON object." });
    }
    if (req.body.destinationId && !mongoose.isValidObjectId(req.body.destinationId)) {
      return res.status(400).json({ message: "Invalid destination ID." });
    }
    const trip = await Trip.create({
      ...req.body,
      tripId: makeTripId(),
      destinationId: req.body.destinationId || undefined,
      travelers: Number(req.body.travelers),
      finalPrice: Number(req.body.finalPrice)
    });

    const notificationStatus = await sendTripNotification(trip.toObject());
    res.status(201).json({
      ...trip.toObject(),
      notificationStatus
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError" || error.code === 11000) {
      return res.status(400).json({ message: error.message || "Please check the trip details and try again." });
    }
    next(error);
  }
});

router.post("/:id/reminder", async (req, res, next) => {
  try {
    const email = String(req.body && req.body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter the email address used to book this trip." });
    }

    const trip = await Trip.findOne({ ...tripLookup(req.params.id), email });
    if (!trip) return res.status(404).json({ message: "No trip matched that Trip ID and email address." });
    if (trip.status !== "Confirmed") {
      return res.status(409).json({ message: "Reminders are only available for confirmed trips." });
    }
    if (trip.travelDate < new Date(new Date().toISOString().slice(0, 10))) {
      return res.status(409).json({ message: "A reminder cannot be sent for a trip that has already started." });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - REMINDER_INTERVAL_MS);
    const claimedTrip = await Trip.findOneAndUpdate(
      {
        _id: trip._id,
        $or: [
          { reminderSentAt: null },
          { reminderSentAt: { $exists: false } },
          { reminderSentAt: { $lte: cutoff } }
        ]
      },
      { $set: { reminderSentAt: now } },
      { new: true }
    );
    if (!claimedTrip) {
      return res.status(429).json({ message: "A reminder was already requested within the last 24 hours." });
    }

    const notificationStatus = await sendTripNotification(claimedTrip.toObject(), { type: "reminder" });
    res.json({ message: "Reminder request processed.", notificationStatus });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    if (!hasValidAdminKey(req)) {
      const configured = Boolean(process.env.ADMIN_API_KEY);
      return res.status(configured ? 401 : 503).json({
        message: configured
          ? "A valid admin API key is required to change trip status."
          : "Trip status updates are disabled until ADMIN_API_KEY is configured."
      });
    }

    const status = String(req.body && req.body.status || "");
    if (!["Confirmed", "Cancelled", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Status must be Confirmed, Cancelled, or Completed." });
    }

    const trip = await Trip.findOne(tripLookup(req.params.id));
    if (!trip) return res.status(404).json({ message: "No trip was found." });
    if (trip.status === status) {
      return res.json({ trip, notificationStatus: null, message: "Trip already has that status." });
    }

    trip.status = status;
    await trip.save();
    const notificationStatus = await sendTripNotification(trip.toObject(), { type: "status" });
    res.json({ trip, notificationStatus });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Enter an email address to find trips." });
    const trips = await Trip.find({ email }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const trip = await Trip.findOne(tripLookup(req.params.id));
    if (!trip) return res.status(404).json({ message: "No confirmed trip was found." });
    res.json(trip);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

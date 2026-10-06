const express = require("express");
const mongoose = require("mongoose");
const Negotiation = require("../models/Negotiation");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "Send negotiation details as a JSON object." });
    }
    if (req.body.destinationId && !mongoose.isValidObjectId(req.body.destinationId)) {
      return res.status(400).json({ message: "Invalid destination ID." });
    }
    const negotiation = await Negotiation.create({
      ...req.body,
      destinationId: req.body.destinationId || undefined,
      travelers: Number(req.body.travelers),
      currentPrice: Number(req.body.currentPrice),
      proposedPrice: Number(req.body.proposedPrice)
    });
    res.status(201).json({ message: "Your request has been sent to the agency.", negotiation });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const negotiations = await Negotiation.find().sort({ createdAt: -1 });
    res.json(negotiations);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

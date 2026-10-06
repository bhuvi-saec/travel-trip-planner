const express = require("express");
const mongoose = require("mongoose");
const Destination = require("../models/Destination");

const router = express.Router();

function normalizeActivities(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

router.get("/", async (req, res, next) => {
  try {
    const destinations = await Destination.find().sort({ name: 1 });
    res.json(destinations);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "Send destination details as a JSON object." });
    }
    const { name, location, description, duration, price, image } = req.body;
    const activities = normalizeActivities(req.body.activities);
    if (!name || !location || !description || !image || activities.length === 0) {
      return res.status(400).json({ message: "Complete all destination fields and add at least one activity." });
    }

    const destination = await Destination.create({
      name,
      location,
      description,
      duration: Number(duration),
      price: Number(price),
      activities,
      image
    });
    res.status(201).json(destination);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid destination ID." });
    }
    const destination = await Destination.findById(req.params.id);
    if (!destination) return res.status(404).json({ message: "Destination not found." });
    res.json(destination);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

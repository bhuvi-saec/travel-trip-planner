require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const destinationRoutes = require("./routes/destinationRoutes");
const negotiationRoutes = require("./routes/negotiationRoutes");
const tripRoutes = require("./routes/tripRoutes");
const Destination = require("./models/Destination");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/destinations", destinationRoutes);
app.use("/api/negotiations", negotiationRoutes);
app.use("/api/trips", tripRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "The requested resource was not found." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  console.error(error);
  res.status(status).json({
    message: status === 500 ? "An unexpected server error occurred." : error.message
  });
});

const starterDestinations = [
  {
    name: "Ooty",
    location: "Tamil Nadu",
    description: "Breathe in the mountain air among rolling tea gardens, colonial-era charm, and sparkling lakes.",
    duration: 3,
    price: 12000,
    activities: ["Ooty Lake", "Botanical Garden", "Tea Estate"],
    image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Kodaikanal",
    location: "Tamil Nadu",
    description: "Discover misty valleys, pine forests, and peaceful lakes in this much-loved hill retreat.",
    duration: 3,
    price: 13500,
    activities: ["Kodai Lake", "Coaker's Walk", "Pillar Rocks"],
    image: "https://images.unsplash.com/photo-1692792284356-f80113facd09?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    name: "Goa",
    location: "Goa",
    description: "Pair sun-soaked beaches with Portuguese heritage, fresh coastal food, and a lively local culture.",
    duration: 4,
    price: 18000,
    activities: ["Beach hopping", "Old Goa churches", "Dolphin cruise"],
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Kerala",
    location: "Kerala",
    description: "Slow down on a backwater houseboat, explore tea-covered hills, and enjoy Kerala's warm hospitality.",
    duration: 5,
    price: 24000,
    activities: ["Alleppey backwaters", "Munnar tea gardens", "Kathakali show"],
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Manali",
    location: "Himachal Pradesh",
    description: "Find your mountain escape with snow-capped peaks, riverside trails, and welcoming cafés.",
    duration: 5,
    price: 26000,
    activities: ["Solang Valley", "Old Manali", "Rohtang Pass"],
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Kashmir",
    location: "Jammu and Kashmir",
    description: "Take in alpine lakes, flower-filled gardens, and the unforgettable scenery of the Kashmir Valley.",
    duration: 6,
    price: 32000,
    activities: ["Dal Lake shikara", "Mughal gardens", "Gulmarg gondola"],
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Rajasthan",
    location: "Rajasthan",
    description: "Explore golden desert landscapes, grand forts, colourful bazaars, and timeless royal architecture.",
    duration: 6,
    price: 28000,
    activities: ["Jaipur forts", "Jaisalmer desert camp", "Udaipur lakes"],
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Coorg",
    location: "Karnataka",
    description: "Wake up to coffee-scented air, forest waterfalls, and the unhurried beauty of the Western Ghats.",
    duration: 3,
    price: 14500,
    activities: ["Coffee plantation", "Abbey Falls", "Dubare Elephant Camp"],
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Pondicherry",
    location: "Puducherry",
    description: "Wander pastel French Quarter streets, discover quiet beaches, and enjoy a relaxed seaside weekend.",
    duration: 3,
    price: 12500,
    activities: ["White Town walk", "Promenade Beach", "Auroville"],
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"
  },
  {
    name: "Andaman",
    location: "Andaman and Nicobar Islands",
    description: "Escape to clear island waters, coral reefs, and palm-lined shores in India's tropical paradise.",
    duration: 6,
    price: 36000,
    activities: ["Radhanagar Beach", "Snorkelling", "Cellular Jail"],
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85"
  }
];

async function seedDestinations() {
  const count = await Destination.countDocuments();
  if (count === 0) {
    await Destination.insertMany(starterDestinations);
    console.log(`Added ${starterDestinations.length} starter destinations.`);
  }
}

async function start() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travel_planner";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");
  await seedDestinations();
  app.listen(port, () => console.log(`Travel Trip Planner is running at http://localhost:${port}`));
}

start().catch((error) => {
  console.error("Could not start the server. Check that MongoDB is running and MONGODB_URI is correct.");
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = app;

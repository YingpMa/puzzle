require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

const Redis = require("ioredis");
const rateLimit = require("express-rate-limit");

mongoose.connect(config.connectionString);

const Player = require("./models/player.model");
const Score = require("./models/score.model");

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");

const redisClient = new Redis();

// Create a rate limiter (max 10 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later.",
});

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.use(limiter);

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

// Create account
app.post("/create-account", async (req, res) => {
  const { playerName, email, password } = req.body;
  if (!playerName) {
    return res
      .status(400)
      .json({ error: true, message: "Player name is required" });
  }

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  const isPlayer = await Player.findOne({ email: email });

  if (isPlayer) {
    return res.json({
      error: true,
      message: "Player already exist",
    });
  }

  const player = new Player({
    playerName,
    email,
    password,
  });

  await player.save();

  const accessToken = jwt.sign({ player }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "36000m",
  });

  return res.json({
    error: false,
    player,
    accessToken,
    message: "Registration Successful! 🎉",
  });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  const playerInfo = await Player.findOne({ email });
  if (!playerInfo) {
    return res.status(400).json({ error: true, message: "Player not found" });
  }

  if (playerInfo.email === email && playerInfo.password === password) {
    const accessToken = jwt.sign(
      { player: playerInfo },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "36000m",
      }
    );

    return res.json({
      error: false,
      message: "Login Successful! 🎊",
      email,
      accessToken,
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Invalid Credentials",
    });
  }
});

// add or update score
app.post("/add-score", authenticateToken, async (req, res) => {
  const { score } = req.body;
  const { player } = req.player;

  if (!score) {
    return res.status(400).json({ error: true, message: "Score is required" });
  }

  try {
    // Check if there's already a score entry for this player
    const existingScore = await Score.findOne({ playerId: player._id });

    if (existingScore) {
      // Overwrite existing score
      existingScore.score = score;
      await existingScore.save();

      return res.json({
        error: false,
        score: existingScore,
        message: "Score updated successfully! 🎉",
      });
    } else {
      // Create a new score entry
      const newScore = new Score({
        playerId: player._id,
        playerName: player.playerName,
        score,
      });
      await newScore.save();

      return res.json({
        error: false,
        score: newScore,
        message: "Score added successfully! 🎈",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Fetch top scores
app.get("/top-scores", async (req, res) => {
  try {
    const now = new Date();
    const timeString =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    // 1. Check if there's a cached version
    const cachedScores = await redisClient.get("topScores");
    if (cachedScores) {
      return res.json({
        error: false,
        topScores: JSON.parse(cachedScores),
        message: `Scores last updated before ${timeString}. Data may be up to 5 minutes old. ⏰`,
      });
    }

    // 2. If no cached data, fetch from DB
    const topScores = await Score.find().sort({ score: -1 }).limit(3);

    // 3. Store in Redis for 5 minutes
    await redisClient.set("topScores", JSON.stringify(topScores), "EX", 300);

    return res.json({
      error: false,
      topScores,
      message: `Scores fetched at ${timeString}. They may remain unchanged for up to 5 minutes. ✨`,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Retrieve a player's ranking
app.get("/player-rank", authenticateToken, async (req, res) => {
  try {
    const { player } = req.player;
    const allScores = await Score.find().sort({ score: -1 });
    const rank =
      allScores.findIndex((item) => item.playerId.equals(player._id)) + 1;

    if (rank === 0) {
      return res.status(404).json({
        error: true,
        message: `Player ${player.playerName} not found in the scoreboard`,
      });
    }

    return res.json({
      error: false,
      rank,
      message: `Player ${player.playerName}'s rank is ${rank} 🪄`,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.listen(8000);

module.exports = app;

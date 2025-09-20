const express = require('express');
const router = express.Router();
const Face = require('../models/Face'); // Face modelini chaqirib olish (sizdagi fayl yo‘lini moslashtiring)

// Hamma userlarni olish
router.get("/users", async (req, res) => {
  try {
    const users = await Face.find(); // db dagi barcha userlarni olish
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

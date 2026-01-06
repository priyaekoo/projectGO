const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Login (JWT)
router.post("/login", authController.login);

module.exports = router;

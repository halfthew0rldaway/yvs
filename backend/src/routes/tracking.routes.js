const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking.controller");

router.post("/", trackingController.track);
router.post("/rate", trackingController.submitRating);

module.exports = router;

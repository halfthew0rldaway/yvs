const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking.controller");
const { trackingLimiter } = require("../middleware/rateLimiter");

router.use(trackingLimiter);

router.post("/", trackingController.track);
router.post("/rate", trackingController.submitRating);
router.post("/respond", trackingController.respondDiagnosisApproval);
router.post("/sign-invoice", trackingController.signCustomerInvoice);

module.exports = router;

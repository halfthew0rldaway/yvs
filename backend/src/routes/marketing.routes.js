const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const {
    listPromotions,
    listActivePromotions,
    validatePromotion,
    getPromotionDetail,
    createPromotion,
    updatePromotion,
    togglePromotion,
    deletePromotion,
    getOutreachList,
    getMarketingReport,
    listCampaignNotes,
    createCampaignNote,
    updateCampaignNote,
    deleteCampaignNote,
} = require("../controllers/marketing.controller");

const router = express.Router();

router.use(authenticate);

// Cashier & marketing accessible endpoints (OR permission check)
router.get("/promotions/active", requirePermission("invoices.manage", "marketing.view"), listActivePromotions);
router.post("/promotions/validate", requirePermission("invoices.manage", "marketing.view"), validatePromotion);

// Marketing analytics & outreach
router.get("/report", requirePermission("marketing.report"), getMarketingReport);
router.get("/outreach", requirePermission("marketing.view"), getOutreachList);

// Campaign Notes (dedicated section)
router.get("/campaigns", requirePermission("marketing.view"), listCampaignNotes);
router.post("/campaigns", requirePermission("marketing.manage"), createCampaignNote);
router.put("/campaigns/:id", requirePermission("marketing.manage"), updateCampaignNote);
router.delete("/campaigns/:id", requirePermission("marketing.manage"), deleteCampaignNote);

// Promotions CRUD
router.get("/promotions", requirePermission("marketing.view"), listPromotions);
router.get("/promotions/:id", requirePermission("marketing.view"), getPromotionDetail);
router.post("/promotions", requirePermission("marketing.manage"), createPromotion);
router.put("/promotions/:id", requirePermission("marketing.manage"), updatePromotion);
router.patch("/promotions/:id/toggle", requirePermission("marketing.manage"), togglePromotion);
router.delete("/promotions/:id", requirePermission("marketing.manage"), deletePromotion);

module.exports = router;

const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
    getOverviewStats,
    getJobPostings,
    getJobById,
    createJobPosting,
    updateJobPosting,
    deleteJobPosting,
    getApplicants,
    getApplicantById,
    createApplicant,
    updateApplicant,
    evaluateApplicant,
    hireApplicant,
    deleteApplicant
} = require("../controllers/recruitment.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorize("admin", "pimpinan")); // Restricted to Admin and Pimpinan

// Overview stats
router.get("/stats", getOverviewStats);

// Job Postings
router.get("/jobs", getJobPostings);
router.get("/jobs/:id", getJobById);
router.post("/jobs", createJobPosting);
router.put("/jobs/:id", updateJobPosting);
router.delete("/jobs/:id", deleteJobPosting);

// Applicants
router.get("/applicants", getApplicants);
router.get("/applicants/:id", getApplicantById);
router.post("/applicants", createApplicant);
router.put("/applicants/:id", updateApplicant);
router.delete("/applicants/:id", deleteApplicant);

// Candidate Actions: Evaluation & One-Click Hire
router.post("/applicants/:id/evaluate", evaluateApplicant);
router.post("/applicants/:id/hire", hireApplicant);

module.exports = router;


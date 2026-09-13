const express = require('express');
const { createJob, listJobs, getJob } = require('../controllers/jobsController');

const router = express.Router();

router.post('/', createJob);
router.get('/', listJobs);
router.get('/:id', getJob);

module.exports = router;

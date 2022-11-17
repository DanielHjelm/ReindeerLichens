// Imports
import express from 'express'

// Router
const router = express.Router();

// Get
router.get('/', (req, res, next) => {
    res.status(200).json({
        message: 'Handling GET requests to /images'
});
});

router.post('/', (req, res, next) => {
    res.status(200).json({
        message: 'Handling POST requests to /images'
});
});

module.exports = router;



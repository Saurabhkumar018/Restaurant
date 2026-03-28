import express from 'express';
const router = express.Router();

// Serve main page
router.get('/', (req, res) => {
  res.render('index');
});

export default router;
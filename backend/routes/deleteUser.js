const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Use environment variables for security!
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', async (req, res) => {
  const { userId } = req.body;
  // TODO: Add authentication/authorization checks here!
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
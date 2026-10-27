<?php
// Copy to site-admin.config.php. Use a long unique password; keep this file private.
// Generate the hash with PHP password_hash(), then paste the hash below.
return array(
    'password_hash' => '',
    // Keep state OUTSIDE the deployed dist/ directory so a new upload does not reset it.
    'state_file' => dirname(__DIR__) . '/site-state.json',
);

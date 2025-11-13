const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.use('/.git', express.static(path.join(__dirname, '.git')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`OTT Platform running on http://localhost:${PORT}`);
  console.log(`⚠️  .git folder is exposed at http://localhost:${PORT}/.git/`);
});

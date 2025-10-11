const express = require('express');
const app = express();
const PORT = 3000;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node API!' });
});

app.listen(PORT, () => console.log(`Node API listening on port ${PORT}`));

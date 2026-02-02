import express from 'express';

const app = express();
const PORT = 3001;

app.get('/test', (req, res) => {
  res.json({ message: 'Hello from test server!' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

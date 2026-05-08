require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`JWT_SECRET set: ${!!process.env.JWT_SECRET}`);
  console.log(`DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
});

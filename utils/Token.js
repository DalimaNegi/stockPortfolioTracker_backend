const jwt = require('jsonwebtoken')

const generateAccessToken = (userId, userEmail) => {
  return jwt.sign({ id: userId, email: userEmail }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};


const generateRefreshToken = (userId, userEmail) => {
  return jwt.sign({ id: userId, email: userEmail}, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken
}
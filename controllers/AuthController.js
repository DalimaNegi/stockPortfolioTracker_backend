const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { generateRefreshToken, generateAccessToken } = require('../utils/Token.js');
const RefToken = require('../models/RefToken.js');


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id, user.email);
    
    const refTok = await RefToken.findOne({email})
    if(!refTok){
      await RefToken.create({email, refreshToken})

    }else{
      refTok.refreshToken = refreshToken
      refTok.save()
    }


    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });

    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const register = async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Incoming registration:", req.body);

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      console.log("User already exists");
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed });

    console.log("User created:", newUser.email);
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error("Registration failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};



const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ message: 'No refresh token found' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Refresh token expired or invalid' });
  }
};


const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  try {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = '';
      await user.save();
    }

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict', secure: true });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const verify = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {

    jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return res.status(200).json({ 
      message: 'Token is valid'})

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Access token expired' });
    }

    return res.status(403).json({ message: 'Invalid or corrupted token' });
  }
};


module.exports = {
  login,
  logout,
  register,
  refreshToken, 
  verify
}
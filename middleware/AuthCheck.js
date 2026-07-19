const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token missing or malformed",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      exp: decoded.exp, // was decoded.expireIn, which doesn't exist on the JWT payload
    };

    next();
  } catch (error) {
    console.log("JWT VERIFY ERROR:", error.name);

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        message: "Access token expired",
      });
    }

    return res.status(403).json({
      message: "Invalid or corrupted token",
    });
  }
};

module.exports = authMiddleware;
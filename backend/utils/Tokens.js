import jwt from "jsonwebtoken";

const ISSUER = "digital-banking-api";
const AUDIENCE = "digital-banking-client";

export const createAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
    issuer: ISSUER,
    audience: AUDIENCE,
  });
};

export const createRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: "refresh" }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
    issuer: ISSUER,
    audience: AUDIENCE,
  });
};
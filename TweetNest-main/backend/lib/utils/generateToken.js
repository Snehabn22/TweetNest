import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
  try {
    // Generate JWT
    const token = jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1d", // Token expiration (1 day)
    });

    // Set cookie options
    const cookieOptions = {
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      httpOnly: true, // Prevent client-side access to the cookie
      sameSite: "Strict", // Strictly same-site for CSRF protection
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    };

    // Set the cookie
    res.cookie("jwt", token, cookieOptions);
  } catch (error) {
    console.error("Error generating token or setting cookie:", error.message);
    res.status(500).json({ message: "Failed to set authentication cookie" });
  }
};

import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt; // Fetch the JWT from cookies

        // 1. Check if the token exists
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Please login" });
        }

        // 2. Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            console.error("JWT verification error:", err.message);
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        // 3. Check if the user exists in the database
        const user = await User.findById(decoded._id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        // 4. Attach user information to the request object
        req.user = user;

        // 5. Proceed to the next middleware
        next();
    } catch (err) {
        // Handle unexpected errors
        console.error("Error in protectRoute middleware:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

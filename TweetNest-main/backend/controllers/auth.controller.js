import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { username, fullname, password, email } = req.body;
    if (!username || !fullname || !password || !email) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }
    const userEmail = z.string().email();
    if (!userEmail.safeParse(email).success) {
      return res.status(400).json({ error: "Invalid email" });
    }
    const existinuser = await User.findOne({ username });
    if (existinuser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const existingemail = await User.findOne({ email });
    if (existingemail) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    if (hashedpassword) {
      const Createduser = new User({
        username,
        fullname,
        password: hashedpassword,
        email,
      });
      if (Createduser) {
        generateTokenAndSetCookie(Createduser._id, res);
        await Createduser.save();
        res.status(201).json({
          _id: Createduser._id,
          username: Createduser.username,
          fullname: Createduser.fullname,
          email: Createduser.email,
          Followers: Createduser.followers,
          Following: Createduser.following,
          profileImage: Createduser.profileImage,
          coverImage: Createduser.coverImage,
          bio: Createduser.bio,
        });
      } else {
        res.status(400).json({ message: "Failed to create account" });
      }
    }
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }
    
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const hashedpassword = await bcrypt.compare(password, user.password);

    if (!hashedpassword) {
      res.status(401).json({ error: "Invalid  password" });
    } else {
      generateTokenAndSetCookie(user._id, res);
      res.status(200).json({
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        Followers: user.followers,
        Following: user.following,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        bio: user.bio,
        link: user.link,
      });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logged out successfully" });
  }
  catch (err) {
    res.status(400).json({ message: err.message });
  }
};


export const getMe = async (req, res) => {
  try {
      if (!req.user || !req.user._id) {
          return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await User.findById(req.user._id).select("-password");
      res.status(200).json(user);
  } catch (error) {
      console.log("Error in getMe controller", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
};
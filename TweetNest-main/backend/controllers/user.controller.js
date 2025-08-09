import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";  
import {v2 as cloudinary } from "cloudinary"; 





export const getUserProfile = async (req, res) => {
  const { username } = req.params; // Access route parameter
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      res.staatus(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in GetUserProfile controller${err.message}` });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const ModifyToUser = await User.findById(id);
    console.log("ModifyToUser", ModifyToUser);
    if (!ModifyToUser) {
      res.status(404).json({ message: "ModifyTo User not found" });
    }
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      res.status(404).json({ message: "Current User not found" });
    }
    if (id == req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }
    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      //unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "Unfollowed successfully" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      const newNotification = await new Notification({
        from: req.user._id,
        to: id,
        type: "follow",
        read: false,
      });
      await newNotification.save();
      //todo return the id of the use as a response
      res.status(200).json({ message: "Followed successfully" });
    }
  } catch (err) {
    res.status(400).json({
        message: `Error in followUnfollowUser controller ${err.message}`,
      });
  }
};

export const getSuggestedUsers = async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Get the users followed by the current user
      const usersFollowedByMe = await User.findById(userId).select("following");
      if (!usersFollowedByMe) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Fetch 10 random users not followed by the current user
      const users = await User.aggregate([
        { $match: { _id: { $ne: userId } } }, // Exclude the current user
        { $sample: { size: 10 } }, // Randomly sample 10 users
      ]);
  
      // Filter users not already followed
      const filteredUsers = users.filter(
        (user) => !usersFollowedByMe.following.includes(user._id.toString())
      );
  
      // Select only 5 suggestions
      const suggestedUsers = filteredUsers.slice(0, 5);
  
      // Sanitize the output to exclude sensitive fields
      const sanitizedUsers = suggestedUsers.map((user) => ({
        ...user,
        password: null,
      }));
  
      res.status(200).json(sanitizedUsers);
    } catch (err) {
      res.status(400).json({
        message: `Error in getSuggestedUsers controller: ${err.message}`,
      });
    }
  };
  

  export const updateUser = async (req, res) => {
    try {
      const userId = req.user._id;
      const { fullname, email, username, currentPassword, newPassword, bio, link } = req.body;
      let { profileImage, coverImage } = req.body;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (currentPassword || newPassword) {
        if (!currentPassword || !newPassword) {
          return res.status(400).json({ message: "Please fill both current and new password fields" });
        }
  
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
          return res.status(401).json({ message: "Invalid current password" });
        }
  
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        if (!hashedPassword) {
          return res.status(400).json({ message: "Error hashing new password" });
        }
        user.password = hashedPassword; // Update the password only if validated
      }
  
      // Handle profile image upload
      let profileImg = user.profileImage;
      if (profileImage) {
        if (user.profileImage) {
          await cloudinary.uploader.destroy(user.profileImage.split("/").pop().split(".")[0]);
        }
        const uploadedResponse = await cloudinary.uploader.upload(profileImage);
        profileImg = uploadedResponse.secure_url;
      }
  
      // Handle cover image upload
      let coverImg = user.coverImage;
      if (coverImage) {
        if (user.coverImage) {
          await cloudinary.uploader.destroy(user.coverImage.split("/").pop().split(".")[0]);
        }
        const uploadedResponse = await cloudinary.uploader.upload(coverImage);
        coverImg = uploadedResponse.secure_url;
      }
  
      // Update user fields
      user.fullname = fullname || user.fullname;
      user.email = email || user.email;
      user.username = username || user.username;
      user.bio = bio || user.bio;
      user.link = link || user.link;
      user.profileImage = profileImg;
      user.coverImage = coverImg;
  
      await user.save();
  
      // Do not include password in the response
      const responseUser = { ...user.toObject(), password: null };
      return res.status(200).json({ user: responseUser });
    } catch (err) {
      res.status(400).json({ message: `Error in updateUser controller: ${err.message}` });
    }
  };
  

  
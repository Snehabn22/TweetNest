import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";


export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id;

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate input
        if (!text && !img) {
            return res.status(400).json({ message: "Post must have text or image" });
        }

        // Handle image upload
        if (img) {
            try {
                const uploadedResponse = await cloudinary.uploader.upload(img, {
                    folder: "posts", // Optional: Organize uploads in a folder
                    resource_type: "image", // Specify type if necessary
                });
                img = uploadedResponse.secure_url;
            } catch (uploadError) {
                return res.status(500).json({
                    message: "Error uploading image to Cloudinary",
                    error: uploadError.message,
                });
            }
        }

        // Create and save the post
        const post = new Post({
            user: userId,
            text,
            img,
        });
        await post.save();

        // Respond with the created post
        return res.status(201).json({
            message: "Post created successfully",
            post,
        });
    } catch (err) {
        // Handle other errors
        return res.status(500).json({
            message: `Error in createPost controller: ${err.message}`,
        });
    }
};


export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the post by ID
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is authorized to delete the post
        if (post.user.toString() !== req.user._id.toString()) {
            return res
                .status(401)
                .json({ message: "You are not authorized to delete this post" });
        }

        // Delete the image from Cloudinary, if it exists
        if (post.img) {
            const publicId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Delete the post from the database
        await Post.findByIdAndDelete(id);

        // Send a success response
        return res.status(200).json({ message: "Post deleted successfully", post });
    } catch (err) {
        // Handle errors
        res
            .status(400)
            .json({ message: `Error in deletePost controller: ${err.message}` });
    }
};


export const commentOnPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { text } = req.body;
        const userId = req.user._id;

        // Validate the comment text
        if (!text || text.trim() === "") {
            return res.status(400).json({ message: "Comment must have non-empty text" });
        }

        // Find the post by ID
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Add the comment
        const comment = {
            user: userId,
            text,
            createdAt: new Date(),
        };
        post.comments.push(comment);
        await post.save();

        // Respond with the updated post's comments
        return res.status(201).json({
            message: "Comment created successfully",
            comments: post.comments,
        });
    } catch (err) {
        return res.status(500).json({
            message: `Error in commentOnPost controller: ${err.message}`,
        });
    }
};

export const likeUnLikePost = async (req, res) => {
    try {
        const PostId = req.params.id;
        const userId = req.user._id;
        const post = await Post.findById(PostId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }



        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            // Unliking the post
            await Post.updateOne({ _id: PostId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: PostId } });
            const updatedPost = await Post.findById(PostId); // Get the updated post
            res.status(200).json(updatedPost); // Return the updated post
        } else {
            // Liking the post
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: PostId } });
            const updatedPost = await post.save(); // Save and get the updated post
            await new Notification({
                from: userId,
                to: post.user, // Assuming post.user is the owner of the post
                type: "like",
            }).save();
            res.status(200).json(updatedPost); // Return the updated post
        }

    } catch (err) {
        res.status(400).json({
            message: `Error in likeUnLikePost controller: ${err.message}`,
        });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: "Posts not found" });
        }

        return res.status(200).json(posts);
    } catch (err) {
        return res.status(400).json({
            message: `Error in getAllPosts controller: ${err.message}`
        });
    }
};

export const getLikedPosts = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } }).sort({ createdAt: -1 })
            .populate({ path: "user", select: "-password" }) // Ensure ref "user" is used
            .populate({ path: "comments.user", select: "-password" }); // Ensure ref "user" is used for comments

        if (!likedPosts || likedPosts.length === 0) {
            return res.status(404).json({ message: "No liked posts found" });
        }

        res.status(200).json(likedPosts);

    } catch (err) {
        res.status(400).json({ message: `Error in getLikedPosts controller: ${err.message}` });
    }
};


export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const following = user.following;
        const feedPosts = await Post.find({ user: { $in: following } })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" });
        if (!feedPosts || feedPosts.length === 0) {
            return res.status(404).json({ message: "No posts found " });
        }
        res.status(200).json(feedPosts);
    }
    catch (err) {
        res.status(400).json({ message: `Error in getFollowingPosts controller${err.message}` });
    }
}

export const getuserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).populate({ path: "user", select: "-password" }).populate({ path: "comments.user", select: "-password" });
        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: "No posts found" });
        }
        res.status(200).json(posts);


    } catch (err) {
        res.status(400).json({ message: `Error in getuserPosts controller${err.message}` });
    }
}


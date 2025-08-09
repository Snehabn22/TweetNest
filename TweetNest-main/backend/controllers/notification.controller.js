import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";


export const getNotifications = async (req, res) => {
    try{
        const userId=req.user._id;
        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const notifications= await Notification.find({to:userId}).populate({path:"from",select:"username profileImage"});
        if(!notifications||notifications.length===0){
            return res.status(404).json({message:"No notifications found"});
        }
        await Notification.updateMany({to:userId,read:false},{read:true});
        res.status(200).json(notifications);    

      
    }
    catch(err){
        res.status(400).json({message:`Error in getNotifications controller${err.message}`});
    }
    
};

export const deleteNotification = async (req, res) => {
      try{
        const userId=req.user._id;
        await Notification.deleteMany({to:userId});
        res.status(200).json({message:"Notification deleted successfully"});
      }
      catch(err){
          res.status(400).json({message:`Error in deleteNotification controller${err.message}`});
      }
};  
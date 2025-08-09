import { Link } from "react-router-dom";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { useQuery } from "@tanstack/react-query";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";
import { useState } from "react";

const RightPanel = () => {
  const [pendingUsers, setPendingUsers] = useState({}); // Tracks loading state per user

  const { data: suggestedUsers, isError, isLoading, error } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/users/suggested");
        if (!res.ok) throw new Error("Failed to fetch suggested users");
        const data = await res.json();
        console.log(data);
        return data;
      } catch (err) {
        throw new Error(err.message);
      }
    },
    retry: false,
  });

  const { followMutation, isLoading: isFollowLoading } = useFollow();
  
  if (suggestedUsers?.length === 0) {
    return <div className="md:w-64 w-0"></div>;
  }

  const handleFollow = async (userId) => {
    setPendingUsers((prev) => ({ ...prev, [userId]: true })); // Mark as pending
    try {
      await followMutation.mutate(userId);
    } catch (err) {
      console.error("Follow action failed:", err.message);
    } finally {
      setPendingUsers((prev) => ({ ...prev, [userId]: false })); // Remove pending
    }
  };

  return (
    <div className="hidden lg:block my-4 mx-2">
      <div className="bg-[#16181C] p-4 rounded-md sticky top-2">
        <p className="font-bold">Who to follow</p>
        <div className="flex flex-col gap-4">
          {/* Loading State */}
          {isLoading && (
            <>
              <RightPanelSkeleton />
              <RightPanelSkeleton />
              <RightPanelSkeleton />
              <RightPanelSkeleton />
            </>
          )}
          {/* Suggested Users */}
          {!isLoading &&
            suggestedUsers?.map((user) => (
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center justify-between gap-4"
                key={user._id}
              >
                <div className="flex gap-2 items-center">
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <img
                        src={user.profileImage || "/avatar-placeholder.png"}
                        alt={`${user.fullname}'s profile`}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold tracking-tight truncate w-28">
                      {user.fullname}
                    </span>
                    <span className="text-sm text-slate-500">@{user.username}</span>
                  </div>
                </div>
                <div>
                  <button
                    className="btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleFollow(user._id);
                    }}
                    disabled={pendingUsers[user._id]} 
                  >
                    {pendingUsers[user._id] ? <LoadingSpinner size="sm" /> : "Follow"}
                  </button>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
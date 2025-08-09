import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const NotificationPage = () => {
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/notification/all");
        const data = await res.json();
        if (data.length === 0) {
          return [];
        }
        if (!res.ok)
          throw new Error(data.error || "Failed to fetch notifications");
        return data;
      } catch (err) {
        console.log(err);
        throw new Error(err.message);
      }
    },
  });
  
  const { mutate: deleteNotificationsMutation } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notification", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete notifications");
      return data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      
      // Save the current state
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      
      // Optimistically update the cache with empty notifications
      queryClient.setQueryData(["notifications"], []);
      
      // Return the previous state in case we need to rollback
      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success("Notifications deleted successfully");
    },
    onError: (error, _, context) => {
      // Rollback to the previous state if there was an error
      queryClient.setQueryData(["notifications"], context.previousNotifications);
      toast.error(error.message || "Failed to delete notifications");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <>
      <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <p className="font-bold">Notifications</p>
          <div className="dropdown">
            <div tabIndex={0} role="button" className="m-1">
              <IoSettingsOutline className="w-4" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a onClick={() => deleteNotificationsMutation()}>Delete all notifications</a>
              </li>
            </ul>
          </div>
        </div>
        {isLoading && (
          <div className="flex justify-center h-full items-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {notifications?.length === 0 && (
          <div className="text-center p-4 font-bold">No notifications 🤔</div>
        )}
        {notifications?.map((notification) => (
          <div className="border-b border-gray-700" key={notification._id}>
            <div className="flex gap-2 p-4">
              {notification.type === "follow" && (
                <FaUser className="w-7 h-7 text-primary" />
              )}
              {notification.type === "like" && (
                <FaHeart className="w-7 h-7 text-red-500" />
              )}
              <Link to={`/profile/${notification.from.username}`}>
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img
                      src={
                        notification.from.profileImg ||
                        "/avatar-placeholder.png"
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="font-bold">
                    @{notification.from.username}
                  </span>{" "}
                  {notification.type === "follow"
                    ? "followed you"
                    : "liked your post"}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationPage;
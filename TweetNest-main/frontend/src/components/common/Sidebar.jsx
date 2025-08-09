import XSvg from "../svgs/X";
import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const Sidebar = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    mutate: Logout,
    isError,
    isLoading,
    error,
  } = useMutation({
    mutationFn: async () => {
      // Call logout API
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are included
      });

      // Check if the response is okay
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to logout");
      }

      return res.json(); // Return the parsed JSON response
    },
    onSuccess: () => {
      // Clear cached authentication data
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      // Redirect to the login page
      navigate("/login");
      // Optional: Show success message
      toast.success("Logged out successfully");
    },
    onError: (err) => {
      // Optional: Show error message
      toast.error(err.message || "Logout failed");
    },
  });

  const {data}=useQuery({queryKey:["authUser"]});
 console.log(data);
  return (
    <div className="md:flex-[2_2_0] w-18 max-w-52">
      <div className="sticky top-0 left-0 h-screen flex flex-col border-r border-gray-700 w-20 md:w-full">
        <Link to="/" className="flex justify-center md:justify-start">
          <XSvg className="px-2 w-12 h-12 rounded-full fill-white hover:bg-stone-900" />
        </Link>
        <ul className="flex flex-col gap-3 mt-4">
          <li className="flex justify-center md:justify-start">
            <Link
              to="/"
              className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
            >
              <MdHomeFilled className="w-8 h-8" />
              <span className="text-lg hidden md:block">Home</span>
            </Link>
          </li>
          <li className="flex justify-center md:justify-start">
            <Link
              to="/notifications"
              className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
            >
              <IoNotifications className="w-6 h-6" />
              <span className="text-lg hidden md:block">Notifications</span>
            </Link>
          </li>
          <li className="flex justify-center md:justify-start">
            <Link
              to={`/profile/${data?.username}`}
              className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
            >
              <FaUser className="w-6 h-6" />
              <span className="text-lg hidden md:block">Profile</span>
            </Link>
          </li>
        </ul>
        {data && (
          <Link
            to={`/profile/${data?.username}`}
            className="mt-auto mb-10 flex gap-2 items-start transition-all duration-300 hover:bg-[#181818] py-2 px-4 rounded-full"
          >
            <div className="avatar hidden md:inline-flex">
              <div className="w-8 rounded-full">
                <img src={data.profileImage || "/avatar-placeholder.png"} />
              </div>
            </div>
            <div className="flex justify-between items-center flex-1">
              <div className="hidden md:block">
                <p className="text-white font-bold text-sm w-20 truncate">
                  {data?.fullname}
                </p>
                <p className="text-slate-500 text-sm">@{data?.username}</p>
              </div>
              <BiLogOut
                className="size-6 hover:text-green-500 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  Logout(); // Call logout mutation
                }}
              />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

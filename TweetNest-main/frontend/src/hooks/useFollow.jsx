import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useFollow = () => {
    const queryClient = useQueryClient();

    const followMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await fetch(`/api/users/follow/${userId}`, {
                method: "GET",  // 'GET' method for following (consider changing to 'POST' if necessary)
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to follow user");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (err) => {
            console.error("Follow error:", err);
            toast.error(err?.message || "Failed to follow user. Please try again.");
        },
    });

    return { followMutation, isLoading: followMutation.isLoading };
};

export default useFollow;

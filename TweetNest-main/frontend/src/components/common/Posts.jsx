import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const Posts = ({ feedType,username,userId }) => {
  const getPostEndPoint = () => {
    switch (feedType) {
      case "foryou":
        return "/api/posts/all";
      case "following":
        return "/api/posts/following";
      case "posts": 
        return `/api/posts/user/${username}`;
      case "likes": 
        return `/api/posts/likes/${userId}`;
    
      default:
        return "/api/posts/all";
    }
  };

  const POST_END_POINT = getPostEndPoint();

  const {
    data: POSTS,
    isLoading,
    isError,
    refetch,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["posts", feedType], // Different queryKey for each feedType
    queryFn: async () => {
      const res = await fetch(POST_END_POINT);
      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await res.json();
      // console.log(`[${feedType}] Fetched data:`, data); // Debug log for API response
      return data;
    },
    enabled: !!feedType, // Ensures the query runs only when feedType is valid
    staleTime: 0, // Fetch fresh data
    refetchOnWindowFocus: false, // Avoid refetching on focus
  });

  useEffect(() => {
    refetch(); // Refetch posts on feedType change
    // console.log(feedType);
  }, [feedType, refetch,username,userId]);

  return (
    <>
      {(isLoading || isFetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isFetching && POSTS?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isFetching&& POSTS && POSTS.length > 0 && (
        <div>
          {POSTS.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
      {isError && (
        <p className="text-center font-bold  text-red-500">No Posts Found</p>
      )}
    </>
  );
};

export default Posts;

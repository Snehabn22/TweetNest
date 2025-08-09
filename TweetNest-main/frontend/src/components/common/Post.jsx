import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Post = ({ post }) => {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const postOwner = post.user;
  const isLiked = post.likes.includes(authUser._id);
  const isMyPost = authUser._id === postOwner._id;

  const date = new Date(post.createdAt);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  const formattedDate = `${day}/${month}/${year}`;

  const {
    mutate: deletePostMutation,
    isError,
    isPending: isDeleting,
    error,
  } = useMutation({
    mutationFn: async ({ id }) => {
      try {
        const res = await fetch(`/api/posts/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete post");
        return data;
      } catch (err) {
        console.error(err);
        throw new Error(err.message);
      }
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      queryClient.setQueryData(["posts"], (old) => {
        return old?.filter((p) => p._id !== id) ?? [];
      });
      return { previousPosts };
    },
    onError: (err, newPost, context) => {
      queryClient.setQueryData(["posts"], context.previousPosts);
      toast.error(err.message || "Failed to delete post");
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const { mutate: likeMutation, isPending: isLiking } = useMutation({
    mutationFn: async (id) => {
      try {
        const res = await fetch(`/api/posts/like/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to like post");
        return data;
      } catch (err) {
        throw new Error(err.message || "Failed to like post");
      }
    },
    onMutate: async (postId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update the like status
      queryClient.setQueryData(["posts"], (old) => {
        if (!old) return [];
        return old.map((p) => {
          if (p._id === postId) {
            // Toggle like status
            const updatedLikes = p.likes.includes(authUser._id)
              ? p.likes.filter(id => id !== authUser._id)  // Unlike
              : [...p.likes, authUser._id];                // Like
            return { ...p, likes: updatedLikes };
          }
          return p;
        });
      });

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (err, _, context) => {
      // If the mutation fails, roll back to the previous state
      queryClient.setQueryData(["posts"], context.previousPosts);
      toast.error(err.message || "Failed to like post");
    },
    onSettled: () => {
      // Sync with server after error or success
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  });

  const { mutate: commentMutation, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/comment/${post._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to comment on post");
        return data;
      } catch (err) {
        throw new Error(err.message);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      
      const newComment = {
        _id: Date.now().toString(), // Temporary ID
        text: comment,
        user: authUser,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(["posts"], (old) => {
        if (!old) return [];
        return old.map((p) => {
          if (p._id === post._id) {
            return {
              ...p,
              comments: [...p.comments, newComment],
            };
          }
          return p;
        });
      });

      return { previousPosts };
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      setComment(""); // Clear comment input
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["posts"], context.previousPosts);
      toast.error(err.message || "Failed to post comment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting || !comment.trim()) return;
    commentMutation();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likeMutation(post._id);
  };

  const handleDeletePost = () => {
    deletePostMutation({ id: post._id });
  };

  return (
    <>
      <div className='flex gap-2 items-start p-4 border-b border-gray-700'>
        <div className='avatar'>
          <Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
            <img src={postOwner.profileImage || "/avatar-placeholder.png"} />
          </Link>
        </div>
        <div className='flex flex-col flex-1'>
          <div className='flex gap-2 items-center'>
            <Link to={`/profile/${postOwner.username}`} className='font-bold'>
              {postOwner.fullname}
            </Link>
            <span className='text-gray-700 flex gap-1 text-sm'>
              <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>
            {isMyPost && (
              <span className='flex justify-end flex-1'>
                {!isDeleting && (
                  <FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
                )}
                {isDeleting && <LoadingSpinner size='sm' />}
              </span>
            )}
          </div>
          <div className='flex flex-col gap-3 overflow-hidden'>
            <span>{post.text}</span>
            {post.img && (
              <img
                src={post.img}
                className='h-80 object-contain rounded-lg border border-gray-700'
                alt=''
              />
            )}
          </div>
          <div className='flex justify-between mt-3'>
            <div className='flex gap-4 items-center w-2/3 justify-between'>
              <div
                className='flex gap-1 items-center cursor-pointer group'
                onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
              >
                <FaRegComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                  {post.comments.length}
                </span>
              </div>
              <dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
                <div className='modal-box rounded border border-gray-600'>
                  <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                  <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                    {post.comments.length === 0 && (
                      <p className='text-sm text-slate-500'>
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment._id} className='flex gap-2 items-start'>
                        <div className='avatar'>
                          <div className='w-8 rounded-full'>
                            <img
                              src={comment.user.profileImage || "/avatar-placeholder.png"}
                            />
                          </div>
                        </div>
                        <div className='flex flex-col'>
                          <div className='flex items-center gap-1'>
                            <span className='font-bold'>{comment.user.fullname}</span>
                            <span className='text-gray-700 text-sm'>
                              @{comment.user.username}
                            </span>
                          </div>
                          <div className='text-sm'>{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
                    onSubmit={handlePostComment}
                  >
                    <textarea
                      className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800'
                      placeholder='Add a comment...'
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button 
                      className='btn btn-primary rounded-full btn-sm text-white px-4'
                      disabled={isCommenting || !comment.trim()}
                    >
                      {isCommenting ? <LoadingSpinner size='md' /> : "Post"}
                    </button>
                  </form>
                </div>
                <form method='dialog' className='modal-backdrop'>
                  <button className='outline-none'>close</button>
                </form>
              </dialog>
              {/* <div className='flex gap-1 items-center group cursor-pointer'>
                <BiRepost className='w-6 h-6 text-slate-500 group-hover:text-green-500' />
                <span className='text-sm text-slate-500 group-hover:text-green-500'>0</span>
              </div> */}
              <div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
                {isLiking && <LoadingSpinner size='sm' />}
                {!isLiked && !isLiking && (
                  <FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
                )}
                {isLiked && !isLiking && (
                  <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500' />
                )}
                <span
                  className={`text-sm group-hover:text-pink-500 ${
                    isLiked ? "text-pink-500" : "text-slate-500"
                  }`}
                >
                  {post.likes.length}
                </span>
              </div>
            </div>
            {/* <div className='flex w-1/3 justify-end gap-2 items-center'>
              <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer' />
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;
// src/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import NotFound from './NotFound';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalLikes: 0 });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (localStorage.getItem('auth') !== '1') {
      navigate('/');
      return;
    }
    const mountedRef = { current: true };
    fetchData(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function fetchData(mountedRef) {
    setIsLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/stats`);
      const statsData = await statsRes.json();

      // Fetch posts
      const postsRes = await fetch(`${API_BASE_URL}/getposts`);
      const postsData = await postsRes.json();

      if (!mountedRef?.current) return;

      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalPosts: statsData.totalPosts || 0,
        totalLikes: statsData.totalLikes || 0,
      });

      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (mountedRef?.current !== false) alert('Failed to fetch data. Check console for details.');
    } finally {
      if (mountedRef?.current !== false) setIsLoading(false);
    }
  }

  // Delete a post
  async function handleDeletePost(postId) {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        // Remove locally
        setPosts((prev) => prev.filter((p) => p.post_id !== postId));
        alert(data.message || 'Post deleted successfully');
      } else {
        alert(data.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Something went wrong deleting the post.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="flex justify-between items-center text-3xl font-bold text-blue-900 mb-8">
        <span>SAPPHIRE Admin Dashboard</span>
        <span 
          className="text-black hover:bg-red-500 hover:text-white m-3 p-2 rounded-xl cursor-pointer"
          onClick={() => {
            localStorage.removeItem("auth");
            navigate('/');
          }}
        >
          logout
        </span>
      </h1>

      {/* Stats Cards */}
      <div className="grid gap-6 mb-6 md:grid-cols-3">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Total Users</p>
          <h2 className="text-2xl font-bold text-blue-900">{stats.totalUsers}</h2>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Total Posts</p>
          <h2 className="text-2xl font-bold text-blue-900">{stats.totalPosts}</h2>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Total Likes</p>
          <h2 className="text-2xl font-bold text-blue-900">{stats.totalLikes}</h2>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white border rounded-xl shadow-sm p-5">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">All Posts</h2>
        {posts.length === 0 ? (
          <p className="text-gray-600">No posts found.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Text</th>
                  <th className="px-4 py-2">Likes</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.post_id} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-sm text-gray-700">{post.post_id}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{post.userName}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{post.postText}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{post.likeCount || 0}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeletePost(post.post_id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

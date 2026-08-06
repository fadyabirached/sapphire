// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; 
import logo from '../assets/SapphireFYPlogo.png'; // adjust if needed

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Credentials are verified server-side (POST /admin/login) so they never
  // live in the client bundle.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('auth', '1');
        localStorage.setItem('adminToken', data.token);
        navigate('/dashboard');
      } else {
        alert(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      alert('Unable to reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Card Container */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-md shadow-lg">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src={logo} 
            alt="Sapphire Logo" 
            className="w-38 h-33 mb-2"
          />
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-wide">
            SAPPHIRE{' '}
            <span className="text-sm font-normal align-bottom">
              MODERATOR
            </span>
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-[#2C4F83]"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-[#2C4F83]"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Eye Icon Toggle */}
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 text-white bg-[#2C4F83] rounded-md
                         hover:bg-blue-800 focus:outline-none focus:ring-2
                         focus:ring-[#2C4F83] font-medium disabled:opacity-60"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

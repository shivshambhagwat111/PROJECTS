import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiKey, FiLock, FiLogIn } from 'react-icons/fi';
import supabase from '../supabaseClient';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      alert('Password updated! Please login with your new password.');
      navigate('/login');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand-dark-secondary text-white"
    >
      <div className="w-full max-w-md bg-black/30 backdrop-blur-md border border-brand-cyan/30 rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-full bg-gradient-to-br from-brand-pink to-brand-violet mb-3">
            <FiKey className="text-3xl text-white" />
          </div>
          <h2 className="text-2xl font-bold font-orbitron mb-2">Reset Your Password</h2>
          <p className="text-gray-400 text-center">Enter your new password below.</p>
        </div>
        <form className="space-y-6" onSubmit={handleReset}>
          <div>
            <label className="block text-sm mb-1 text-gray-400">New Password</label>
            <div className="relative">
              <input
                type="password"
                className="w-full p-3 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 text-white"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                required
              />
              <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-400">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                className="w-full p-3 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 text-white"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                required
              />
              <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 p-4 bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : <>Set New Password <FiLogIn /></>}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default ResetPassword;

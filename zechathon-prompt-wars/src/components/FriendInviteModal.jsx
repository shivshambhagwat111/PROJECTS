import React, { useContext, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiUserPlus, FiCheckCircle } from 'react-icons/fi';
import { OnlineContext } from '../context/OnlineContext';
import { InviteContext } from '../context/InviteContext';
import supabase from '../supabaseClient';

/**
 * Shared Friend Invite Modal Component
 * 
 * This component provides a unified interface for inviting friends in both
 * Solo and Team battle setup pages. It leverages the OnlineContext to display
 * real online users and handles the invite functionality with Supabase.
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Function to close the modal
 * @param {Array} props.selectedFriends Array of selected friend IDs
 * @param {Function} props.onToggleFriend Function to toggle friend selection
 * @param {Function} props.onSendInvites Function to send invites
 * @param {string} props.inviteStatus Current status ('idle', 'sending', 'sent')
 */
const FriendInviteModal = ({ 
  isOpen, 
  onClose, 
  selectedFriends = [], 
  onToggleFriend, 
  onSendInvites, 
  inviteStatus = 'idle' 
}) => {
  // Get online users from context
  const { onlineUsers, refreshUsers } = useContext(OnlineContext);
  const { sendInvites } = useContext(InviteContext);
  
  // State for all user profiles
  const [userProfiles, setUserProfiles] = useState([]);
  
  // Get the current user ID
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setCurrentUserId(data.session.user.id);
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Fetch all user profiles
  const fetchUserProfiles = useCallback(async () => {
    try {
      console.log('FriendInviteModal: Fetching user profiles...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(100);
        
      if (error) {
        console.error('Error fetching user profiles:', error);
        return;
      }
      
      if (data) {
        console.log(`FriendInviteModal: Loaded ${data.length} user profiles`);
        setUserProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);
  
  // Load profiles on mount and refresh online users
  useEffect(() => {
    fetchUserProfiles();
    refreshUsers();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      refreshUsers();
      fetchUserProfiles();
    }, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, [fetchUserProfiles, refreshUsers]);
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.username) {
      return user.username;
    } else {
      return user.email || 'Unknown User';
    }
  };
  
  // Merge users from profiles and online presence
  const getMergedUsers = () => {
    // Create a map of profiles for easy lookup
    const profileMap = {};
    userProfiles.forEach(user => {
      profileMap[user.id] = user;
    });
    
    // Start with an empty array to build our combined user list
    const allUsers = [];
    const processedIds = new Set();
    
    // Process all users from presence data first
    Object.entries(onlineUsers || {}).forEach(([id, data]) => {
      // Skip the current user
      if (id === currentUserId) return;
      
      const profile = profileMap[id];
      const isOnline = data?.status === 'online';
      
      // Only add if we have profile information or if they're online
      if (profile || isOnline) {
        allUsers.push({
          id: id,
          username: profile?.username || `User ${id.substring(0, 5)}`,
          email: profile?.email || 'Unknown Email',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          avatar: profile?.avatar_url || 'https://via.placeholder.com/150',
          is_online: isOnline,
          displayName: profile ? getUserDisplayName(profile) : `User ${id.substring(0, 8)}`
        });
        processedIds.add(id);
      }
    });
    
    // Add any remaining profiles not already processed
    userProfiles.forEach(user => {
      // Skip the current user
      if (user.id === currentUserId) return;
      
      if (!processedIds.has(user.id)) {
        allUsers.push({
          ...user,
          is_online: false,
          avatar: user.avatar_url || 'https://via.placeholder.com/150',
          displayName: getUserDisplayName(user)
        });
      }
    });
    
    // Sort by online status (online first) and then by name
    return allUsers.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  };
  
  // Get the merged user list
  const mergedUsers = getMergedUsers();
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-[#10142c] border border-gray-700 rounded-2xl w-full max-w-md shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-2xl font-bold font-orbitron text-glow-cyan">Invite Friends</h3>
          </div>
          <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
            {mergedUsers && mergedUsers.length > 0 ? (
              mergedUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => user.is_online && onToggleFriend(user.id)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${user.is_online ? 'cursor-pointer bg-gray-800/50 hover:bg-gray-700/70' : 'opacity-50 bg-gray-800/30'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={user.avatar || 'https://via.placeholder.com/150'} 
                        alt={user.displayName || 'User'} 
                        className="w-12 h-12 rounded-full" 
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#10142c] ${user.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    </div>
                    <div>
                      <p className="font-bold text-white">{user.displayName}</p>
                      <p className="text-sm text-gray-400">{user.is_online ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  {user.is_online && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedFriends.includes(user.id) ? 'bg-brand-cyan border-brand-cyan' : 'border-gray-600'}`}>
                      {selectedFriends.includes(user.id) && <FiCheck className="text-brand-dark" />}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400">No users available to invite.</p>
            )}
          </div>
          <div className="p-6 border-t border-gray-800">
            <motion.button
              key={inviteStatus}
              onClick={onSendInvites}
              disabled={inviteStatus !== 'idle' || selectedFriends.length === 0}
              className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-lg
                ${inviteStatus === 'idle' && selectedFriends.length > 0 && 'bg-brand-violet hover:bg-brand-violet/80'}
                ${(inviteStatus !== 'idle' || selectedFriends.length === 0) && 'bg-gray-600 cursor-not-allowed opacity-70'}
                ${inviteStatus === 'sending' && 'bg-yellow-500'}
                ${inviteStatus === 'sent' && 'bg-green-500'}`}
            >
              {inviteStatus === 'idle' && <><FiUserPlus /> Send Invites ({selectedFriends.length})</>}
              {inviteStatus === 'sending' && <>Sending...</>}
              {inviteStatus === 'sent' && <><FiCheckCircle /> Invites Sent!</>}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FriendInviteModal;

import React, { useEffect, useState, useCallback } from 'react';
import supabase from '../supabaseClient';
import { useOnlineStatus } from '../context/OnlineContext';

const UserStatus = () => {
  const [users, setUsers] = useState([]);
  const { onlineUsers, currentUserStatus, refreshUsers } = useOnlineStatus();
  const [currentUser, setCurrentUser] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Combined function to fetch all data needed
  const fetchAllData = useCallback(async () => {
    try {
      console.log('UserStatus: Refreshing all data...');
      
      // Get current user info
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setCurrentUser(userData.user);
      }
      
      // Refresh presence data from context
      refreshUsers();
      
      // Fetch all user profiles
      console.log('UserStatus: Fetching all profiles from public.profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(100); // Ensure we get all profiles up to 100
      console.log('UserStatus: Profiles data received:', data);
      if (!error && data) {
        console.log('UserStatus: Raw profiles data received:', data);
        
        // Process profiles to ensure we're using ID as the key
        const processedProfiles = data.map(profile => ({
          id: profile.id,           // Use this as primary identifier
          email: profile.email || '',
          username: profile.username || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          // Add any other fields you need
        }));
        
        setUsers(processedProfiles);
        console.log(`UserStatus: Loaded ${processedProfiles.length} user profiles`);
      } else if (error) {
        console.error('Error fetching user profiles:', error);
      }
      
      // Update refresh timestamp
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [refreshUsers]);
  
  // Initial data fetch on component mount
  useEffect(() => {
    fetchAllData();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 10000); // Every 10 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [fetchAllData]);
  
  // Monitor and log online user changes
  useEffect(() => {
    const onlineCount = Object.values(onlineUsers).filter(u => u.status === 'online').length;
    console.log(`UserStatus: ${onlineCount} users online out of ${users.length} total users`);
    console.log('UserStatus: Current online users:', onlineUsers);
  }, [onlineUsers, users.length]);
  
  // Track status changes
  useEffect(() => {
    if (currentUserStatus === 'online') {
      console.log('UserStatus: Current user is now online');
    }
  }, [currentUserStatus]);

  // Merge users from profiles and online users to show everyone
  const getAllUsers = () => {
    // Create a map of profiles for easy lookup
    const profileMap = {};
    users.forEach(user => {
      profileMap[user.id] = user;
    });
    
    // Start with an empty array to build our combined user list
    const allUsers = [];
    
    // Add all users from either source - profiles or online presence
    const processedIds = new Set();
    
    // First add all users from profiles
    users.forEach(user => {
      allUsers.push({
        ...user,
        hasProfile: true,
        displayName: getUserDisplayName(user)
      });
      processedIds.add(user.id);
    });
    
    // Then add any users from online presence that don't have profiles
    Object.entries(onlineUsers).forEach(([id, data]) => {
      if (!processedIds.has(id)) {
        allUsers.push({
          id: id,
          email: 'Unknown User',
          username: 'User ' + id.substring(0, 5),
          first_name: '',
          last_name: '',
          hasProfile: false,
          displayName: 'User ' + id.substring(0, 8)
        });
        processedIds.add(id);
      }
    });
    
    return allUsers;
  };
  
  // Helper function to get a display name for a user
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
  
  const allUsers = getAllUsers();

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-white mb-4">User Status</h3>
      
      {/* Current user status */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${currentUserStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <p className="text-white">
            Your status: <span className="font-medium">{currentUserStatus}</span>
          </p>
        </div>
        
        {currentUser && (
          <div className="mt-2 text-xs text-gray-400">
            Logged in as: {currentUser.email}
          </div>
        )}
      </div>
      
      {/* User list with online status */}
      <div className="mt-4">
        <h4 className="text-white text-lg font-medium mb-2">All Users ({allUsers.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allUsers.map(user => {
            const isCurrentUser = currentUser && user.id === currentUser.id;
            const isOnline = isCurrentUser ? currentUserStatus === 'online' : onlineUsers[user.id]?.status === 'online';
            
            return (
              <div
                key={user.id}
                className={`p-2 rounded flex items-center justify-between ${isCurrentUser ? 'bg-blue-900' : 'bg-gray-700'}`}
              >
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <div className="text-white font-medium">{user.displayName}</div>
                    <div className="text-xs text-gray-400">
                      {user.hasProfile ? user.email : 'No profile'}
                    </div>
                    {!isOnline && onlineUsers[user.id]?.lastSeen && (
                      <div className="text-xs text-gray-400">
                        Last seen: {new Date(onlineUsers[user.id].lastSeen).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                {isCurrentUser && <span className="text-xs text-blue-300">You</span>}
              </div>
            );
          })}
          {users.length === 0 && (
            <p className="text-gray-400 col-span-2 text-center py-4">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatus;

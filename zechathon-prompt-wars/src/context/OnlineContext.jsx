import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import supabase from '../supabaseClient';

// Create a context to share online users across components
const OnlineContext = createContext({
  onlineUsers: {},
  currentUserStatus: 'offline',
  refreshUsers: () => {}
});

// Export the context separately for better Vite Fast Refresh compatibility
export { OnlineContext };

export const OnlineProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [currentUserStatus, setCurrentUserStatus] = useState('offline');
  const [channel, setChannel] = useState(null);
  const [lastSessionCheck, setLastSessionCheck] = useState(null);
  const presenceChannelRef = useRef(null);

  // Track last log time to reduce logging frequency
  const lastLogTimeRef = useRef(0);
  const LOG_INTERVAL = 30000; // 30 seconds
  
  // Function to log only if enough time has passed
  const logIfNeeded = (message, data, level = 'log') => {
    const now = Date.now();
    if (now - lastLogTimeRef.current > LOG_INTERVAL) {
      lastLogTimeRef.current = now;
      if (level === 'error') {
        console.error(message, data);
      } else if (level === 'warn') {
        console.warn(message, data);
      } else {
        console.log(message, data);
      }
    }
  };

  // Function to refresh user presence data
  const refreshUsers = async () => {
    try {
      // Query ALL user_presence records, not just online ones
      const { data, error } = await supabase
        .from('user_presence')
        .select('*');
        
      if (error) {
        logIfNeeded('OnlineProvider: Error getting user presence data:', error, 'error');
        return;
      }
      
      if (data && data.length > 0) {
        // Process the data to update our state
        const updatedUsers = {};
        const now = new Date();
        
        data.forEach(user => {
          // Check if the user's last_seen timestamp is recent enough
          // If not seen in the last 2 minutes, consider them offline
          const lastSeen = new Date(user.last_seen);
          const timeDiff = now - lastSeen; // milliseconds
          const isStale = timeDiff > 120000; // 2 minutes
          
          // If user is marked as online but hasn't been seen recently, update them to offline
          if (user.status === 'online' && isStale) {
            logIfNeeded(`OnlineProvider: User ${user.id} appears stale (last seen ${Math.round(timeDiff/1000)}s ago), marking as offline`);
            
            // Update the database to mark them as offline
            supabase
              .from('user_presence')
              .update({ 
                status: 'offline',
                last_seen: user.last_seen // Keep the original last_seen time
              })
              .eq('id', user.id)
              .catch(err => {
                logIfNeeded(`OnlineProvider: Error updating stale user ${user.id}:`, err, 'error');
              });
              
            // Use offline status in our local state
            updatedUsers[user.id] = {
              status: 'offline',
              lastSeen: user.last_seen
            };
          } else {
            // Use the status as-is for non-stale users
            updatedUsers[user.id] = {
              status: user.status,
              lastSeen: user.last_seen
            };
          }
        });
        
        // Make sure current user is always shown as online if they're logged in
        if (session && session.user) {
          updatedUsers[session.user.id] = {
            status: 'online',
            lastSeen: new Date().toISOString()
          };
        }
        
        // Update the state with all users
        setOnlineUsers(updatedUsers);
        logIfNeeded(`OnlineProvider: Refreshed user presence data - ${Object.keys(updatedUsers).filter(id => updatedUsers[id].status === 'online').length} users online`);
      }
    } catch (error) {
      logIfNeeded('OnlineProvider: Error in refreshUsers:', error, 'error');
    }
  };

  // Session check effect - runs once on component mount
  useEffect(() => {
    logIfNeeded('OnlineProvider: Initializing auth session check');
    
    // Get current session
    const fetchSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        logIfNeeded('OnlineProvider: Initial session check result:', 
          data.session ? 'Session found' : 'No session');
        if (data?.session) {
          setSession(data.session);
          setLastSessionCheck(Date.now());
        }
      } catch (error) {
        logIfNeeded('OnlineProvider: Error getting session:', error, 'error');
      }
    };
    
    fetchSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      logIfNeeded('OnlineProvider: Auth state changed, event:', _event);
      setSession(session);
      setLastSessionCheck(Date.now());
    });

    return () => {
      logIfNeeded('OnlineProvider: Unsubscribing from auth changes');
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Load all users' presence status when component mounts
  useEffect(() => {
    const loadAllUsersStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_presence')
          .select('*');
          
        if (error) {
          logIfNeeded('OnlineProvider: Failed to load user presence:', error, 'error');
          return;
        }
        
        if (data && data.length > 0) {
          const usersMap = {};
          data.forEach(user => {
            usersMap[user.id] = {
              status: user.status,
              lastSeen: user.last_seen
            };
          });
          setOnlineUsers(usersMap);
          logIfNeeded('OnlineProvider: Loaded initial user presence data');
        }
      } catch (err) {
        logIfNeeded('OnlineProvider: Error loading user presence:', err, 'error');
      }
    };
    
    loadAllUsersStatus();
  }, []);
  
  // Set up presence channel when session changes
  useEffect(() => {
    if (!session) {
      logIfNeeded('OnlineProvider: No session, skipping presence setup');
      return;
    }
    
    // Load all users right away when session changes
    refreshUsers();
    
    // Clean up any existing channel
    if (presenceChannelRef.current) {
      presenceChannelRef.current.unsubscribe();
    }
    
    logIfNeeded('OnlineProvider: Setting up presence channel for user:', session.user.id);

    // Create and subscribe to the presence channel
    const presenceChannel = supabase.channel('online-users', {
      config: { 
        presence: { key: session.user.id } 
      }
    });
    
    logIfNeeded('OnlineProvider: Created presence channel');

    // Handle presence events
    presenceChannel
      .on('presence', { event: 'join' }, async ({ key, newPresences }) => {
        logIfNeeded(`OnlineProvider: ${newPresences.length} user(s) joined`);
        
        try {
          // Only update our own presence status to avoid RLS issues
          if (session && session.user) {
            logIfNeeded('OnlineProvider: Updating own presence on join event');
            
            await supabase
              .from('user_presence')
              .upsert({
                id: session.user.id,
                status: 'online',
                last_seen: new Date().toISOString()
              }, { onConflict: 'id' });
          }
          
          // Update online users state
          setOnlineUsers(prev => {
            const updated = { ...prev };
            newPresences.forEach(p => {
              updated[p.user_id] = { 
                status: 'online', 
                lastSeen: new Date() 
              };
            });
            return updated;
          });
        } catch (error) {
          logIfNeeded('OnlineProvider: Error updating user presence on join:', error, 'error');
        }
      })
      .on('presence', { event: 'leave' }, async ({ key, leftPresences }) => {
        logIfNeeded(`OnlineProvider: ${leftPresences.length} user(s) left`);
        
        // Only update our own status if we're among those who left
        if (session && session.user) {
          const ourPresence = leftPresences.find(p => p.user_id === session.user.id);
          
          if (ourPresence) {
            logIfNeeded('OnlineProvider: Updating our presence status to offline on leave');
            try {
              await supabase
                .from('user_presence')
                .update({
                  status: 'offline',
                  last_seen: new Date().toISOString()
                })
                .eq('id', session.user.id);
            } catch (error) {
              logIfNeeded('OnlineProvider: Error updating status on leave:', error, 'error');
            }
          }
        }
        
        // Update online users state
        setOnlineUsers(prev => {
          const updated = { ...prev };
          leftPresences.forEach(p => {
            if (updated[p.user_id]) {
              updated[p.user_id].status = 'offline';
              updated[p.user_id].lastSeen = new Date();
            }
          });
          return updated;
        });
      })
      .on('error', (err) => {
        logIfNeeded('OnlineProvider: Presence channel error:', err, 'error');
      });

    // Set the ref for cleanup
    presenceChannelRef.current = presenceChannel;
    
    // Subscribe and track presence
    presenceChannel.subscribe(async (status) => {
      logIfNeeded(`OnlineProvider: Channel subscription status: ${status}`);
      
      // Force currentUserStatus to update based on session existence
      if (session) {
        setCurrentUserStatus('online');
      }
      
      if (status === 'SUBSCRIBED') {
        try {
          // Track this user's presence
          logIfNeeded(`OnlineProvider: Tracking presence for user: ${session.user.id}`);
          await presenceChannel.track({
            user_id: session.user.id,
            status: 'online',
            timestamp: new Date().toISOString()
          });

          // Update the database for persistence
          logIfNeeded('OnlineProvider: Updating user_presence table');
          const { error } = await supabase
            .from('user_presence')
            .upsert({
              id: session.user.id,
              status: 'online',
              last_seen: new Date().toISOString()
            });
            
          if (error) {
            logIfNeeded('OnlineProvider: Error updating user_presence:', error, 'error');
          } else {
            logIfNeeded('OnlineProvider: Successfully updated user_presence');
            setCurrentUserStatus('online');
            
            // Also update our local state to reflect our own online status
            setOnlineUsers(prev => ({
              ...prev,
              [session.user.id]: { status: 'online', lastSeen: new Date() }
            }));
          }
        } catch (err) {
          logIfNeeded('OnlineProvider: Error in presence tracking:', err, 'error');
        }
      }
    });

    setChannel(presenceChannel);
    
    // Also load all current presence state
    const loadOnlineUsers = async () => {
      try {
        // Query ALL user_presence records, not just online ones
        const { data, error } = await supabase
          .from('user_presence')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          logIfNeeded(`OnlineProvider: Loaded presence data for ${data.length} users`);
          
          // Process the data to update our state
          const updatedUsers = {};
          data.forEach(user => {
            updatedUsers[user.id] = {
              status: user.status,
              lastSeen: user.last_seen || new Date().toISOString()
            };
          });
          
          // Make sure current user is always shown as online if they're logged in
          if (session && session.user) {
            updatedUsers[session.user.id] = {
              status: 'online',
              lastSeen: new Date().toISOString()
            };
          }
          
          // Update the state with all users
          setOnlineUsers(updatedUsers);
          logIfNeeded(`OnlineProvider: Updated presence state with ${Object.keys(updatedUsers).length} users`);
        }
      } catch (error) {
        logIfNeeded('OnlineProvider: Error getting user presence data:', error, 'error');
      }
    };
    
    loadOnlineUsers();
    
    // Set up window beforeunload handler for clean disconnects
    const handleBeforeUnload = async () => {
      if (session && session.user) {
        try {
          // Try to update via regular API first
          const { error } = await supabase
            .from('user_presence')
            .update({
              status: 'offline',
              last_seen: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (error) {
            logIfNeeded('OnlineProvider: Error updating status on unload:', error, 'error');
          }
        } catch (err) {
          logIfNeeded('OnlineProvider: Error in beforeunload handler:', err, 'error');
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up when component unmounts or session changes
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (presenceChannel) {
        logIfNeeded('OnlineProvider: Cleaning up presence channel');
        presenceChannel.unsubscribe();
        presenceChannelRef.current = null;
        
        // Update status before unsubscribing
        if (session) {
          supabase
            .from('user_presence')
            .update({ 
              status: 'offline', 
              last_seen: new Date().toISOString() 
            })
            .eq('id', session.user.id)
            .then(() => {
              logIfNeeded('OnlineProvider: Successfully set user as offline in cleanup');
            })
            .catch(err => {
              logIfNeeded('OnlineProvider: Error setting user as offline in cleanup:', err, 'error');
            });
        }
      }
    };
  }, [session]);

  // Heartbeat system to regularly update online status and detect offline users
  useEffect(() => {
    if (!session || !session.user) return;
    
    // Update user's online status and last_seen timestamp regularly
    const heartbeatInterval = setInterval(async () => {
      try {
        console.log('OnlineProvider: Sending heartbeat');
        
        // Update presence in the database
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            id: session.user.id,
            status: 'online',
            last_seen: new Date().toISOString()
          });
          
        if (error) {
          console.error('OnlineProvider: Heartbeat error:', error);
        }
        
        // Also track in the presence channel
        if (channel) {
          await channel.track({
            user_id: session.user.id,
            status: 'online',
            timestamp: new Date().toISOString()
          });
        }
        
        // Check for stale users (offline but not marked as such)
        await refreshUsers();
      } catch (err) {
        console.error('OnlineProvider: Error in heartbeat:', err);
      }
    }, 15000); // Heartbeat every 15 seconds
    
    return () => clearInterval(heartbeatInterval);
  }, [session, channel, refreshUsers]);

  return (
    <OnlineContext.Provider value={{ onlineUsers, currentUserStatus, refreshUsers }}>
      {children}
    </OnlineContext.Provider>
  );
};

// Custom hook to use the online status
export const useOnlineStatus = () => useContext(OnlineContext);

export default OnlineProvider;

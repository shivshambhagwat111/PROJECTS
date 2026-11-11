import React, { createContext, useState, useEffect } from 'react';
import supabase from '../supabaseClient';

// Create context
export const InviteContext = createContext();

/**
 * InviteProvider Component
 * 
 * Manages friend invites state and functionality:
 * - Subscribes to realtime invite notifications
 * - Provides methods to send, accept, and decline invites
 * - Maintains lists of sent, received, and pending invites
 * - NEW: Manages battle creation and real-time coordination
 */
export const InviteProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const currentUserId = session?.user?.id;
  
  // State for invites
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for battles
  const [activeBattle, setActiveBattle] = useState(null);
  const [battleLoading, setBattleLoading] = useState(false);
  
  // Get and subscribe to auth session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    
    // Subscribe to session changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );
    
    // Cleanup subscription
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  
  // Load all invites for the current user
  const loadInvites = async () => {
    if (!currentUserId) {
      setReceivedInvites([]);
      setSentInvites([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
      setLoading(true);
      
      try {
        // Load received invites (where user is receiver)
        const { data: received, error: receivedError } = await supabase
          .from('friend_invites')
          .select('*')
          .eq('receiver_id', currentUserId)
          .eq('status', 'pending');
        
        // If we have received invites, fetch the sender profiles separately
        if (received && received.length > 0) {
          const senderIds = received.map(invite => invite.sender_id);
          const { data: senderProfiles, error: senderProfilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', senderIds);
          
          if (senderProfiles && !senderProfilesError) {
            // Create a map of profiles for easy lookup
            const profileMap = {};
            senderProfiles.forEach(profile => {
              profileMap[profile.id] = profile;
            });
            
            // Add sender profile information to each invite
            received.forEach(invite => {
              invite.sender = profileMap[invite.sender_id] || { username: 'Unknown User' };
            });
          }
        }
        
        if (receivedError) throw receivedError;
        
        // Load sent invites (where user is sender)
        const { data: sent, error: sentError } = await supabase
          .from('friend_invites')
          .select('*')
          .eq('sender_id', currentUserId)
          .eq('status', 'pending');
        
        // If we have sent invites, fetch the receiver profiles separately
        if (sent && sent.length > 0) {
          const receiverIds = sent.map(invite => invite.receiver_id);
          const { data: receiverProfiles, error: receiverProfilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', receiverIds);
          
          if (receiverProfiles && !receiverProfilesError) {
            // Create a map of profiles for easy lookup
            const profileMap = {};
            receiverProfiles.forEach(profile => {
              profileMap[profile.id] = profile;
            });
            
            // Add receiver profile information to each invite
            sent.forEach(invite => {
              invite.receiver = profileMap[invite.receiver_id] || { username: 'Unknown User' };
            });
          }
        }
        
        if (sentError) throw sentError;
        
        setReceivedInvites(received || []);
        setSentInvites(sent || []);
      } catch (error) {
        console.error('Error loading invites:', error);
        console.error(`Failed to send invite: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
  };
  
  // Load existing invites on mount and when user changes
  useEffect(() => {
    if (currentUserId) {
      loadInvites();
    }
  }, [currentUserId]);

  // Subscribe to realtime updates for new invites and invite status changes
  useEffect(() => {
    const inviteChannel = supabase
      .channel('invite-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'friend_invites',
          filter: `receiver_id=eq.${currentUserId}`
        }, 
        async (payload) => {
          console.log('New invite received:', payload);
          
          // Get the full invite
          const { data: inviteData, error: inviteError } = await supabase
            .from('friend_invites')
            .select('*')
            .eq('id', payload.new.id)
            .single();
            
          // Get the sender profile separately
          let data = inviteData;
          let error = inviteError;
          
          if (inviteData && !inviteError) {
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', inviteData.sender_id)
              .single();
              
            if (senderData && !senderError) {
              // Add sender profile to invite data
              data = {
                ...inviteData,
                sender: senderData
              };
            }
            error = senderError;
          }
            
          if (error) {
            console.error('Error fetching new invite details:', error);
            return;
          }
          
          // Add to received invites
          setReceivedInvites(prev => [...prev, data]);
          
          // Log notification
          if (payload.event === 'INSERT' && payload.new.receiver_id === currentUserId) {
            console.log('You received a new battle invite!');
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_invites',
          filter: `sender_id=eq.${currentUserId} OR receiver_id=eq.${currentUserId}`
        },
        async (payload) => {
          console.log('Invite status updated:', payload);
          console.log('Current user ID:', currentUserId);
          console.log('Payload sender_id:', payload.new.sender_id);
          console.log('Payload receiver_id:', payload.new.receiver_id);
          console.log('Payload status:', payload.new.status);
          console.log('Payload battle_id:', payload.new.battle_id);
          
          // If invite was accepted and has a battle_id, navigate the sender to battle
          if (payload.new.status === 'accepted' && payload.new.battle_id && payload.new.sender_id === currentUserId) {
            console.log('Your invite was accepted! Navigating to battle...');
            
            // Get the battle details
            const { data: battleData, error: battleError } = await supabase
              .from('battles')
              .select('*')
              .eq('id', payload.new.battle_id)
              .single();
              
            if (!battleError && battleData) {
              // Navigate to appropriate battle arena
              const isSoloBattle = battleData.battle_type === 'solo';
              const battleConfig = battleData.battle_config || {};
              
              // Navigate to appropriate battle arena with battle state
              const battleUrl = isSoloBattle ? '/battle-arena' : '/team-battle-arena';
              const state = {
                battleId: battleData.id,
                battleType: isSoloBattle ? 'user-vs-user' : 'team-vs-ai',
                battleConfig: battleConfig,
                opponentId: payload.new.receiver_id,
                opponentName: 'Opponent',
                isInviteBattle: true
              };
              
              // Store state and navigate
              sessionStorage.setItem('battleState', JSON.stringify(state));
              window.location.href = battleUrl;
            }
          }
          
          // Refresh invites to update UI
          loadInvites();
        }
      )
      .subscribe();
      
    // Cleanup subscription
    return () => {
      supabase.removeChannel(inviteChannel);
    };
  }, [currentUserId]);

  // NEW: Subscribe to battle updates
  useEffect(() => {
    if (!currentUserId) return;

    const battleChannel = supabase
      .channel('battle-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'battles',
          filter: `player1_id=eq.${currentUserId} OR player2_id=eq.${currentUserId}`
        }, 
        async (payload) => {
          console.log('Battle update received:', payload);
          
          if (payload.event === 'INSERT') {
            // New battle created
            const { data: battleData, error } = await supabase
              .from('battles')
              .select('*')
              .eq('id', payload.new.id)
              .single();
              
            if (!error && battleData) {
              setActiveBattle(battleData);
            }
          } else if (payload.event === 'UPDATE') {
            // Battle updated
            setActiveBattle(prev => prev?.id === payload.new.id ? payload.new : prev);
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_events',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload) => {
          console.log('Battle event received:', payload);
          // Handle battle events (user joined, response submitted, etc.)
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(battleChannel);
    };
  }, [currentUserId]);

  /**
   * NEW: Create a battle record when invite is accepted
   * @param {string} inviteId - ID of the accepted invite
   * @param {Object} battleConfig - Battle configuration from inviter
   * @returns {Promise} - Result of the operation
   */
  const createBattle = async (inviteId, battleConfig) => {
    if (!currentUserId || !inviteId) return { success: false };
    
    try {
      setBattleLoading(true);
      console.log('Creating battle for invite:', inviteId);
      
      // Get the invite details
      const { data: invite, error: inviteError } = await supabase
        .from('friend_invites')
        .select('*')
        .eq('id', inviteId)
        .single();
        
      if (inviteError) {
        console.error('Error fetching invite:', inviteError);
        throw inviteError;
      }
      
      console.log('Creating battle for invite:', invite);
      
      // Create battle record
      const battle = {
        invite_id: inviteId,
        player1_id: invite.sender_id,
        player2_id: invite.receiver_id,
        battle_type: invite.battle_type,
        status: 'waiting',
        battle_config: battleConfig || {}
      };
      
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .insert(battle)
        .select()
        .single();
        
      if (battleError) throw battleError;
      
      // Note: The invite will be updated with battle_id and accepted_at 
      // by the acceptInvite function, not here
      console.log('Battle created successfully, invite will be updated by acceptInvite');
      
      // Create battle event
      await supabase
        .from('battle_events')
        .insert({
          battle_id: battleData.id,
          event_type: 'battle_started',
          user_id: currentUserId,
          event_data: { battle_config: battleConfig }
        });
      
      setActiveBattle(battleData);
      console.log('Battle created successfully:', battleData.id);
      
      // Note: createBattle is called by the invitee (receiver), not the inviter (sender)
      // The inviter will be notified via real-time subscription when the invite is updated
      
      return { success: true, data: battleData };
      
    } catch (error) {
      console.error('Error creating battle:', error);
      return { success: false, error };
    } finally {
      setBattleLoading(false);
    }
  };

  /**
   * NEW: Get battle details
   * @param {string} battleId - Battle ID
   * @returns {Promise} - Battle data
   */
  const getBattle = async (battleId) => {
    if (!battleId) return { success: false };
    
    try {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single();
        
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting battle:', error);
      return { success: false, error };
    }
  };

  /**
   * NEW: Submit battle response
   * @param {string} battleId - Battle ID
   * @param {string} response - User's response
   * @returns {Promise} - Result of the operation
   */
  const submitBattleResponse = async (battleId, response) => {
    if (!currentUserId || !battleId || !response) return { success: false };
    
    try {
      // Get current battle
      const { data: battle, error: battleError } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single();
        
      if (battleError) throw battleError;
      
      // Determine which player this user is
      const isPlayer1 = battle.player1_id === currentUserId;
      const responseField = isPlayer1 ? 'player1_response' : 'player2_response';
      
      // Update battle with response
      const { data: updatedBattle, error: updateError } = await supabase
        .from('battles')
        .update({ 
          [responseField]: response,
          status: 'active'
        })
        .eq('id', battleId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Create battle event
      await supabase
        .from('battle_events')
        .insert({
          battle_id: battleId,
          event_type: 'response_submitted',
          user_id: currentUserId,
          event_data: { response: response }
        });
      
      setActiveBattle(updatedBattle);
      
      return { success: true, data: updatedBattle };
      
    } catch (error) {
      console.error('Error submitting battle response:', error);
      return { success: false, error };
    }
  };

  /**
   * NEW: Complete battle with scores
   * @param {string} battleId - Battle ID
   * @param {Object} scores - Player scores
   * @returns {Promise} - Result of the operation
   */
  const completeBattle = async (battleId, scores) => {
    if (!battleId || !scores) return { success: false };
    
    try {
      const { player1_score, player2_score } = scores;
      const winner = player1_score > player2_score ? 'player1_id' : 
                    player2_score > player1_score ? 'player2_id' : null;
      
      const { data: updatedBattle, error } = await supabase
        .from('battles')
        .update({ 
          player1_score,
          player2_score,
          winner: winner ? (winner === 'player1_id' ? scores.player1_id : scores.player2_id) : null,
          status: 'completed'
        })
        .eq('id', battleId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Create battle event
      await supabase
        .from('battle_events')
        .insert({
          battle_id: battleId,
          event_type: 'battle_completed',
          user_id: currentUserId,
          event_data: { scores, winner }
        });
      
      setActiveBattle(updatedBattle);
      
      return { success: true, data: updatedBattle };
      
    } catch (error) {
      console.error('Error completing battle:', error);
      return { success: false, error };
    }
  };

  /**
   * Send invite to a single friend
   * @param {string} friendId - Friend user ID to invite
   * @param {string} battleType - Type of battle ('solo' or 'team')
   * @param {Object} battleConfig - Battle configuration (NEW)
   * @returns {Promise} - Result of the operation
   */
  const sendInvite = async (friendId, battleType = 'solo', battleConfig = null) => {
    if (!currentUserId || !friendId) return { success: false };
    
    try {
      console.log(`Sending ${battleType} battle invite to friend: ${friendId}`);
      
      // Create a single invite record with battle config
      const invite = {
        sender_id: currentUserId,
        receiver_id: friendId,
        status: 'pending',
        battle_type: battleType,
        battle_config: battleConfig  // NEW: Include battle configuration
      };
      
      const { data, error } = await supabase
        .from('friend_invites')
        .upsert(invite, { 
          onConflict: 'sender_id,receiver_id,status',
          ignoreDuplicates: true 
        });
        
      if (error) throw error;
      
      // Get the new invite with receiver profile
      const { data: newInvite, error: fetchError } = await supabase
        .from('friend_invites')
        .select('*')
        .eq('receiver_id', friendId)
        .eq('sender_id', currentUserId)
        .eq('status', 'pending')
        .single();
        
      // If we have a new invite, fetch the receiver profile separately
      if (newInvite && !fetchError) {
        const { data: receiverProfile, error: receiverProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', friendId)
          .single();
          
        if (receiverProfile && !receiverProfileError) {
          // Add receiver profile information to the invite
          newInvite.receiver = receiverProfile;
        }
      }
        
      if (fetchError) throw fetchError;
      
      // Update sent invites list
      setSentInvites(prev => {
        // Remove any existing invite to this friend and add the new one
        const filtered = prev.filter(invite => 
          invite.receiver_id !== friendId || invite.status !== 'pending'
        );
        return [...filtered, newInvite];
      });
      
      console.log(`Successfully sent invite to friend: ${friendId}`);
      
      // Force refresh invites to make sure we have the latest data
      loadInvites();
      
      return { success: true, data: newInvite };
      
    } catch (error) {
      console.error('Error sending invites:', error);
      return { success: false, error };
    }
  };
  
  /**
   * Respond to an invite (accept or decline)
   * @param {string} inviteId - ID of the invite to respond to
   * @param {string} status - New status ('accepted' or 'declined')
   * @param {string} battleId - Optional battle ID to set when accepting
   * @returns {Promise} - Result of the operation
   */
  const respondToInvite = async (inviteId, status, battleId = null) => {
    if (!currentUserId || !inviteId) return { success: false };
    if (!['accepted', 'declined'].includes(status)) {
      return { success: false, error: 'Invalid status' };
    }
    
    try {
      console.log(`Responding to invite ${inviteId} with status: ${status}`);
      if (battleId) {
        console.log(`Setting battle_id: ${battleId}`);
      }
      
      // Prepare update data
      const updateData = { status };
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
        if (battleId) {
          updateData.battle_id = battleId;
        }
      }
      
      const { data, error } = await supabase
        .from('friend_invites')
        .update(updateData)
        .eq('id', inviteId)
        .eq('receiver_id', currentUserId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state
      setReceivedInvites(prev => 
        prev.filter(invite => invite.id !== inviteId)
      );
      
      // Trigger a refresh of all invites to ensure state is current
      loadInvites();
      
      console.log(`Successfully ${status === 'accepted' ? 'accepted' : 'declined'} invite ${inviteId}`);
      return { success: true, data };
    } catch (error) {
      console.error(`Error ${status === 'accepted' ? 'accepting' : 'declining'} invite:`, error);
      return { success: false, error };
    }
  };
  
  // Manually refresh invites
  const refreshInvites = () => {
    loadInvites();
  };
  
  /**
   * Send invites to multiple friends (commented for future use)
   * @param {Array} friendIds - Array of friend user IDs to invite
   * @param {string} battleType - Type of battle ('solo' or 'team')
   * @param {Object} battleConfig - Battle configuration (NEW)
   * @returns {Promise} - Result of the operation
   */
  const sendInvites = async (friendIds, battleType = 'solo', battleConfig = null) => {
    if (!currentUserId || !friendIds.length) return { success: false };
    
    // For now, just send to the first friend in the list
    const firstFriendId = friendIds[0];
    return await sendInvite(firstFriendId, battleType, battleConfig);
  };
  
  // Context value
  const value = {
    receivedInvites,
    sentInvites,
    loading,
    activeBattle,
    battleLoading,
    sendInvite,
    sendInvites,
    acceptInvite: (inviteId, battleId = null) => respondToInvite(inviteId, 'accepted', battleId),
    declineInvite: (inviteId) => respondToInvite(inviteId, 'declined'),
    hasPendingInvites: receivedInvites.length > 0,
    refreshInvites,
    // NEW: Battle functions
    createBattle,
    getBattle,
    submitBattleResponse,
    completeBattle
  };
  
  return (
    <InviteContext.Provider value={value}>
      {children}
    </InviteContext.Provider>
  );
};

export default InviteProvider;

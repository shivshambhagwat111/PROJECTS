import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiUsers, FiBell } from 'react-icons/fi';
import { InviteContext } from '../context/InviteContext';
import { useNavigate } from 'react-router-dom';

/**
 * InviteNotifications Component
 * 
 * Displays notifications for incoming battle invites and provides
 * UI for accepting or declining them.
 * NEW: Creates battle records and coordinates real-time battles
 */
const InviteNotifications = () => {
  const { 
    receivedInvites, 
    acceptInvite, 
    declineInvite, 
    loading, 
    createBattle, 
    battleLoading 
  } = useContext(InviteContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  
  // Show a badge if there are pending invites
  const hasPendingInvites = receivedInvites.length > 0;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.invite-notifications')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);
  
  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Handle invite response
  const handleInviteResponse = async (inviteId, accept) => {
    try {
      if (accept) {
        // Get the invite details before accepting it
        const invite = receivedInvites.find(inv => inv.id === inviteId);
        
        // Create battle record with the stored configuration FIRST
        const battleConfig = invite?.battle_config || {};
        console.log('Creating battle before accepting invite...');
        const battleResult = await createBattle(inviteId, battleConfig);
        
        if (!battleResult.success) {
          throw new Error('Failed to create battle');
        }
        
        setNotification({ type: 'success', message: 'Battle created! Accepting invite...' });
        
        // Then accept the invite with battle_id
        const acceptResult = await acceptInvite(inviteId, battleResult.data.id);
        if (!acceptResult.success) {
          console.warn('Battle created but invite acceptance failed');
        }
        
        setNotification({ type: 'success', message: 'Battle created! Redirecting...' });
        
        // Navigate to appropriate battle arena after a short delay
        setTimeout(() => {
          // Close the dropdown
          setShowDropdown(false);
          
          // Determine battle type from invite metadata
          const isSoloBattle = invite?.battle_type === 'solo' || !invite?.battle_type;
          
          if (isSoloBattle) {
            // Navigate to solo battle arena with battle ID and config
            navigate('/battle-arena', { 
              state: { 
                battleId: battleResult.data.id,
                battleType: 'user-vs-user',
                battleConfig: battleConfig,
                opponentId: invite.sender_id,
                opponentName: invite.sender?.username || invite.sender?.email || 'Opponent',
                isInviteBattle: true
              } 
            });
          } else {
            // Navigate to team battle arena with battle ID and config
            navigate('/team-battle-arena', { 
              state: { 
                battleId: battleResult.data.id,
                battleType: 'team-vs-ai',
                battleConfig: battleConfig,
                teammateId: invite.sender_id,
                teammateName: invite.sender?.username || invite.sender?.email || 'Teammate',
                isInviteBattle: true
              } 
            });
          }
        }, 1500); // 1.5 second delay for notification to be visible
      } else {
        await declineInvite(inviteId);
        setNotification({ type: 'info', message: 'Invite declined' });
      }
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error responding to invite:', error);
      setNotification({ type: 'error', message: 'Failed to respond to invite' });
      setTimeout(() => setNotification(null), 3000);
    }
  };
  
  return (
    <div className="invite-notifications relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-800/50 transition-colors"
        disabled={battleLoading}
      >
        <FiUsers className="text-xl text-white" />
        {hasPendingInvites && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold text-white bg-red-500 rounded-full border border-gray-900 px-1">
            {receivedInvites.length}
          </span>
        )}
        {battleLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </button>
      
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-72 bg-[#10142c] border border-gray-700 rounded-lg shadow-lg z-50"
          >
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Battle Invites</h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading invites...</div>
              ) : receivedInvites.length > 0 ? (
                receivedInvites.map(invite => (
                  <div key={invite.id} className="p-3 border-b border-gray-700/50 hover:bg-gray-800/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {invite.sender?.username || invite.sender?.email || 'Someone'}
                        </p>
                        <p className="text-sm text-gray-400">
                          Invited you to {invite.battle_type || 'solo'} battle
                        </p>
                        {invite.battle_config && (
                          <p className="text-xs text-gray-500">
                            {invite.battle_config.selectedModel?.name || 'AI Model'} • {invite.battle_config.difficulty || 'Medium'}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(invite.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInviteResponse(invite.id, true)}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Accept"
                          disabled={battleLoading}
                        >
                          <FiCheck className="text-white" />
                        </button>
                        <button
                          onClick={() => handleInviteResponse(invite.id, false)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Decline"
                          disabled={battleLoading}
                        >
                          <FiX className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">No pending invites</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Simple notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute right-0 top-12 mt-2 px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-600' : notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {notification.type === 'success' && <FiCheck />}
            {notification.type === 'error' && <FiX />}
            {notification.type === 'info' && <FiBell />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InviteNotifications;

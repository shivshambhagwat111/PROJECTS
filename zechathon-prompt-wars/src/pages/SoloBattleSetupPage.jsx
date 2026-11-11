import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiLayers, FiSliders, FiZap, FiArrowRight, FiSearch, FiUploadCloud, FiSettings, FiCheck, FiClock, FiStar, FiSave, FiRefreshCw, FiUser, FiUsers, FiUserPlus, FiCheckCircle } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import FriendInviteModal from '../components/FriendInviteModal';
import { InviteContext } from '../context/InviteContext';

const models = [
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    tag: 'Pro',
    image: 'https://crystalpng.com/wp-content/uploads/2025/01/deepseek-logo-01-1024x1024.png',
    strengths: ['Long context', 'Multi-lingual', 'Efficient reasoning'],
    recommendedFor: 'Research, Analysis'
  },
  {
    id: 'gemma3',
    name: 'Google Gemma 3',
    tag: 'Standard',
    image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic1.howtogeekimages.com%2Fwordpress%2Fwp-content%2Fuploads%2F2024%2F02%2F23.jpg&f=1&nofb=1&ipt=80c61c6db16acc23e6c08b63e5516a76c51c9e3dd8c99e6d08e32fd90c6cc74e',
    strengths: ['Fast responses', 'Great summarization', 'Accurate facts'],
    recommendedFor: 'Summarization, Q&A'
  },
  {
    id: 'mistral-ai',
    name: 'Mistral AI',
    tag: 'Standard',
    image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fassets.stickpng.com%2Fimages%2F66af6a44585ea98e55ff8606.png&f=1&nofb=1&ipt=6fa46b334a75b4fd2a8f0101a7bf408ce4336c21829c8b5e6002b00d25d57078',
    strengths: ['Open weights', 'Strong code generation', 'Efficient'],
    recommendedFor: 'Coding, Open-source'
  },
  {
    id: 'llama-33',
    name: 'Meta Llama 3.3',
    tag: 'Pro',
    image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fverybriefly.com%2Fwp-content%2Fuploads%2F2023%2F02%2FMeta-AI-LLaMA-750x375.jpeg&f=1&nofb=1&ipt=2febe06e1833ed91e3316950693512147780e9891d642ca8ed5a82e4e38b8d7a',
    strengths: ['Large context', 'Versatile', 'Great reasoning'],
    recommendedFor: 'General, Reasoning'
  },
  {
    id: 'qwen',
    name: 'Alibaba Qwen',
    tag: 'Standard',
    image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fst1.latestly.com%2Fwp-content%2Fuploads%2F2025%2F01%2FQwen-Logo-784x441.jpg&f=1&nofb=1&ipt=6339d88d34ec6001ea9efeda32b67f9ae3a8da3e5ac40c755b36f300af053896',
    strengths: ['Chinese language', 'Business logic', 'Data analysis'],
    recommendedFor: 'Business, Multilingual'
  },
  {
    id: 'cohere-ai',
    name: 'Cohere AI',
    tag: 'Standard',
    image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fbpando.org%2Fwp-content%2Fuploads%2F00-AI-Branding-NLP-Cohere-Logo-Logotype-Pentagram-London-Office-Jody-Hudson-Powell-Luke-Powell-BPO-Review-2048x1365.jpg&f=1&nofb=1&ipt=436cf4cbea942f007c7b666efc2b5575bd56d85f722327f2fe05154941857b4d',
    strengths: ['Enterprise', 'Retrieval-augmented', 'Secure'],
    recommendedFor: 'Enterprise, Retrieval'
  },
  // ... (your models array, unchanged)
];

const layers = [
  { name: 'Crystal Wastes', description: 'Survive the harsh alien terrain', players: '1v1', difficulty: 'Extreme', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ70-kKqgCo_7ha2fZHd7RnVoF_x6TH6hjpDQ&s' },
  { name: 'Orbital Station', description: 'Close quarters combat in zero-g', players: '1v1', difficulty: 'Medium', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToegB7SVxxg2OaQBLcVV7Ilz6GnZbjFOXVAQ&s' },
  { name: 'Neon City', description: 'Urban warfare in a cyberpunk metropolis', players: '1v1', difficulty: 'Hard', image: 'https://img.freepik.com/free-vector/background-with-night-city-neon-lights_1441-2597.jpg?semt=ais_items_boosted&w=740' },
];
  // ... (your layers array, unchanged)

const opponents = [
  { id: 1, name: 'Vortex', avatar: 'https://i.pravatar.cc/48?u=opponent1' },
  { id: 2, name: 'Blaze', avatar: 'https://i.pravatar.cc/48?u=opponent2' },
  { id: 3, name: 'Shadow', avatar: 'https://i.pravatar.cc/48?u=opponent3' },
  { id: 4, name: 'Ghost', avatar: 'https://i.pravatar.cc/48?u=opponent4' },
  { id: 5, name: 'Reaper', avatar: 'https://i.pravatar.cc/48?u=opponent5' },
  { id: 6, name: 'Fury', avatar: 'https://i.pravatar.cc/48?u=opponent6' },
  // ... (your opponents array, unchanged)
];

const scenarioTypes = {
  'Strategy': 'bg-green-500 text-white',
  'Creative': 'bg-brand-violet text-white',
  'Technical': 'bg-yellow-500 text-white',
  'Analysis': 'bg-brand-pink text-white'
};

const Section = ({ title, children, className = '', bgImage }) => (
  <motion.div 
    variants={itemVariants} 
    className={`relative border border-gray-800 rounded-2xl p-6 overflow-hidden ${className}`}
  >
    {bgImage && (
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
    )}
    {!bgImage && (
      <div className="absolute inset-0 bg-[#10142c]/60 backdrop-blur-sm z-0"></div>
    )}
    <div className="relative z-10">
      <h2 className="text-xl font-bold font-orbitron text-gray-300 mb-6 tracking-wider uppercase">{title}</h2>
      {children}
    </div>
  </motion.div>
);

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

const OpponentSearchAnimation = ({ opponents }) => {
  const duplicatedOpponents = [...opponents, ...opponents, ...opponents];
  return (
    <div className="w-full text-center">
      <p className="text-yellow-400 mb-4 animate-pulse">Searching for opponent...</p>
      <div className="relative h-20 w-full overflow-hidden bg-gray-900/30 rounded-lg">
        <motion.div
          className="absolute top-0 left-0 flex items-center h-full"
          animate={{ x: ['0%', '-66.66%'] }}
          transition={{
            ease: 'linear',
            duration: 15,
            repeat: Infinity,
          }}
        >
          {duplicatedOpponents.map((op, index) => (
            <div key={index} className="flex-shrink-0 w-32 flex flex-col items-center justify-center p-2">
              <img src={op.avatar} alt={op.name} className="w-12 h-12 rounded-lg mb-1" />
              <p className="text-xs text-gray-400 truncate">{op.name}</p>
            </div>
          ))}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#10142c] via-transparent to-[#10142c]"></div>
      </div>
    </div>
  );
};

// const InviteFriendsModal = ({
//   isOpen,
//   onClose,
//   friends,
//   selectedFriends,
//   onToggleFriend,
//   onSendInvites,
//   inviteStatus,
//   loading
// }) => {
//   if (!isOpen) return null;
//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: 0.9, opacity: 0 }}
//           transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//           className="bg-[#10142c] border border-gray-700 rounded-2xl w-full max-w-md shadow-lg"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <div className="p-6 border-b border-gray-800">
//             <h3 className="text-2xl font-bold font-orbitron text-glow-cyan">Invite Friends</h3>
//           </div>
//           <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
//             {loading ? (
//               <p className="text-center text-gray-400">Loading users...</p>
//             ) : friends.length === 0 ? (
//               <p className="text-center text-gray-400">No users found.</p>
//             ) : (
//               friends.map(friend => (
//                 <div
//                   key={friend.id}
//                   onClick={() => onToggleFriend(friend.id)}
//                   className="flex items-center justify-between p-3 rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-700/70"
//                 >
//                   <div className="flex items-center gap-4">
//                     <img
//                       src={friend.avatar_url || `https://i.pravatar.cc/48?u=${friend.id}`}
//                       alt={friend.username}
//                       className="w-12 h-12 rounded-full"
//                     />
//                     <div>
//                       <p className="font-bold text-white">{friend.username}</p>
//                     </div>
//                   </div>
//                   <div
//                     className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
//                       selectedFriends.includes(friend.id)
//                         ? 'bg-brand-cyan border-brand-cyan'
//                         : 'border-gray-600'
//                     }`}
//                   >
//                     {selectedFriends.includes(friend.id) && (
//                       <FiCheck className="text-brand-dark" />
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//           <div className="p-6 border-t border-gray-800">
//             <motion.button
//               key={inviteStatus}
//               onClick={onSendInvites}
//               disabled={inviteStatus !== 'idle' || selectedFriends.length === 0}
//               className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-lg
//                 ${inviteStatus === 'idle' && selectedFriends.length > 0 && 'bg-brand-violet hover:bg-brand-violet/80'}
//                 ${(inviteStatus !== 'idle' || selectedFriends.length === 0) && 'bg-gray-600 cursor-not-allowed opacity-70'}
//                 ${inviteStatus === 'sending' && 'bg-yellow-500'}
//                 ${inviteStatus === 'sent' && 'bg-green-500'}`}
//             >
//               {inviteStatus === 'idle' && (
//                 <>
//                   <FiUserPlus /> Send Invites ({selectedFriends.length})
//                 </>
//               )}
//               {inviteStatus === 'sending' && <>Sending...</>}
//               {inviteStatus === 'sent' && (
//                 <>
//                   <FiCheckCircle /> Invites Sent!
//                 </>
//               )}
//             </motion.button>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// };
// Removed the local InviteFriendsModal component as we're now using the shared one

const SoloBattleSetupPage = () => {
  const navigate = useNavigate(); 
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedLayer, setSelectedLayer] = useState(layers[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedOpponent, setMatchedOpponent] = useState(null);
  const [difficulty, setDifficulty] = useState('Medium');
  const [battleFocus, setBattleFocus] = useState('Creative');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [inviteStatus, setInviteStatus] = useState('idle');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [scenarioType, setScenarioType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const email = location.state?.email;

  const difficultyBonus = { Easy: 100, Medium: 200, Hard: 300 }[difficulty];

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.recommendedFor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setIsSearching(true);
  }, []);

  useEffect(() => {
    if (isSearching) {
      const searchTimeout = setTimeout(() => {
        const availableOpponents = opponents.filter(
          (op) => op.id !== matchedOpponent?.id
        );
        const randomOpponent =
          availableOpponents[
            Math.floor(Math.random() * availableOpponents.length)
          ];
        setMatchedOpponent(randomOpponent);
        setIsSearching(false);
      }, 4000);
      return () => clearTimeout(searchTimeout);
    }
  }, [isSearching]);

  // Get the sendInvites function from InviteContext
  const { sendInvites } = useContext(InviteContext);
  const [inviteListener, setInviteListener] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user ID from supabase session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await import('../supabaseClient').then(m => m.default.auth.getSession());
      setCurrentUserId(session?.user?.id || null);
    };
    getSession();
  }, []);

  // Real-time subscription for invite updates (redirect inviter when invite is accepted)
  useEffect(() => {
    if (!currentUserId) return;
    if (inviteListener) return; // Prevent duplicate listeners
    import('../supabaseClient').then(({ default: supabase }) => {
      const channel = supabase.channel('invite-redirect-listener')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_invites',
          filter: `sender_id=eq.${currentUserId}`
        }, async (payload) => {
          const invite = payload.new;
          if (invite.status === 'accepted' && invite.battle_id) {
            // Redirect to BattleArenaPage with battle info
            window.sessionStorage.setItem('battleState', JSON.stringify({
              battleId: invite.battle_id,
              battleType: 'user-vs-user',
              isInviteBattle: true,
              battleConfig: invite.battle_config,
              opponentId: invite.receiver_id,
              inviteId: invite.id
            }));
            window.location.href = '/battle-arena';
          }
        });
      channel.subscribe();
      setInviteListener(channel);
    });
    return () => {
      if (inviteListener) {
        inviteListener.unsubscribe();
        setInviteListener(null);
      }
    };
  }, [currentUserId, inviteListener]);

  const handleRetryMatch = () => {
    setMatchedOpponent(null);
    setIsSearching(true);
  };

  const handleToggleFriend = (friendId) => {
    // If the clicked friend is already selected, deselect them
    // Otherwise, select the new friend and deselect any others
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? [] // Deselect if already selected
        : [friendId] // Select only the new friend
    );
  };

  /**
   * Handle sending invites to selected friends
   * Uses the Supabase real-time functionality to send actual invites
   */
  const handleSendInvites = async () => {
    try {
      setInviteStatus('sending');

      // Create battle configuration object
      const battleConfig = {
        selectedModel,
        selectedLayer,
        difficulty,
        battleFocus,
        scenarioType,
        timestamp: new Date().toISOString()
      };

      // Send invites to all selected friends with battle type 'solo' and config
      const result = await sendInvites(selectedFriends, 'solo', battleConfig);

      if (result.success) {
        setInviteStatus('sent');
        // Auto-close after 2 seconds
        setTimeout(() => {
          setInviteStatus('idle');
          setIsInviteModalOpen(false);
          setSelectedFriends([]);
        }, 2000);
      } else {
        console.error('Failed to send solo battle invites:', result.error);
        setInviteStatus('idle');
      }
    } catch (error) {
      console.error('Error sending solo battle invites:', error);
      setInviteStatus('idle');
    }
  };

  return (
    <>
      <FriendInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        selectedFriends={selectedFriends}
        onToggleFriend={handleToggleFriend}
        onSendInvites={handleSendInvites}
        inviteStatus={inviteStatus}
      />
       <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8"
              style={{
                backgroundImage: "url('https://img.freepik.com/free-photo/empty-road-with-blacklight_400718-34.jpg?semt=ais_hybrid&w=740')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
              }}
            >
              <div className="max-w-screen-xl mx-auto">
                <motion.div variants={itemVariants} className="text-center mb-10">
                  <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-glow-cyan mb-2">BATTLE SETUP</h1>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="relative bg-[#10142c]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center overflow-hidden min-h-[350px]" style={{ backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyL5iOf_V9ZGLXfjxgduziNFXyN7OFhI6S4mLgV66YW-wBYPLzniljSaMh_3C-bpZlaLU&usqp=CAU')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="absolute inset-0 bg-black/60 z-0"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <img src="https://us.123rf.com/450wm/yourapechkin/yourapechkin2412/yourapechkin241228100/239500387-robotic-headgear-showcases-sleek-design-elements-and-vibrant-neon-colors-in-a-modern-setting.jpg?ver=6" alt="Solo Battle Icon" className="w-32 h-32 object-cover rounded-full mb-4"/>
                      <h3 className="text-2xl font-bold font-orbitron text-glow-cyan">Solo Battle</h3>
                      <p className="text-gray-400 mt-2 max-w-xs">Face off against a single AI opponent in a test of wits.</p>
                    </div>
                  </div>

                  <div className="relative bg-[#10142c]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-around overflow-hidden min-h-[350px]" style={{ backgroundImage: `url('https://media.istockphoto.com/id/1358070514/vector/abstract-circuit-board-with-colorful-streaming-neon-lines.jpg?s=612x612&w=0&k=20&c=f64EqOUzyQ_45vG8-tpDTifXPBGpz61POSvLS7-FyPQ=')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="absolute inset-0 bg-black/70 z-0"></div>
                    <div className="relative z-10 space-y-6">
                        <div>
                          <h3 className="font-regular text-gray-100 mb-4 text-center text-xl">Invite friends to play</h3>
                          <button onClick={() => setIsInviteModalOpen(true)} className="w-full bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg">
                              <FiUsers /> Click Here
                          </button>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-300 mb=4 text-center text-xl">Live Matching</h3>
                          <div className="bg-gray-900/50 p-3 rounded-lg min-h-[124px] flex items-center justify-center">
                            <AnimatePresence mode="wait">
                              {isSearching ? (
                                <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                                  <OpponentSearchAnimation opponents={opponents} />
                                </motion.div>
                              ) : matchedOpponent ? (
                                <motion.div key="matched" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="w-full flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <img src={matchedOpponent.avatar} alt={matchedOpponent.name} className="w-12 h-12 rounded-lg border-2 border-brand-green"/>
                                    <div>
                                        <p className="text-sm text-gray-400">Opponent Found</p>
                                        <p className="font-bold text-white text-lg">{matchedOpponent.name}</p>
                                    </div>
                                  </div>
                                  <button onClick={handleRetryMatch} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors">
                                    <FiRefreshCw />
                                  </button>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </div>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <Section title="AI Model Selection">
                      <div className="flex justify-between items-center mb-4">
                        <div className="relative w-full max-w-xs">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Search AI models..."
                            aria-label="Search AI models"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-8 py-2 focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                            >
                              ×
                            </button>
                          )}
                          {searchTerm && filteredModels.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredModels.slice(0, 3).map(model => (
                                <div
                                  key={model.id}
                                  onClick={() => {
                                    setSelectedModel(model);
                                    setSearchTerm('');
                                  }}
                                  className="p-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                >
                                  <img src={model.image} alt={model.name} className="w-6 h-6 rounded" />
                                  <span>{model.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchTerm && (
                            <p className="text-xs text-gray-400 mt-1">
                              {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} found
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setBattleFocus('Speed')} className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${battleFocus === 'Speed' ? 'bg-brand-cyan text-brand-dark' : 'bg-gray-700 hover:bg-gray-600'}`}>Speed</button>
                          <button onClick={() => setBattleFocus('Creative')} className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${battleFocus === 'Creative' ? 'bg-brand-pink text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Creative</button>
                          <button className="px-4 py-2 text-sm rounded-lg bg-brand-violet text-white hover:bg-brand-violet/80 transition-colors">Compare</button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {filteredModels.map(model => (
                          <div key={model.id} onClick={() => setSelectedModel(model)} className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${selectedModel.id === model.id ? 'border-brand-cyan bg-brand-cyan/10' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`}>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <img src={model.image} alt={model.name} className="w-16 h-16 rounded-lg object-cover" />
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-bold text-lg">{model.name}</h3>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${model.tag === 'Pro' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{model.tag}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 mt-2">
                                  <div>
                                    <h4 className="text-sm text-gray-400 font-semibold">Strengths</h4>
                                    <ul className="mt-1 space-y-1">
                                      {model.strengths.map(s => <li key={s} className="flex items-center gap-2 text-xs text-gray-300"><FiCheck className="text-green-400" /> {s}</li>)}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="text-sm text-gray-400 font-semibold">Recommended for</h4>
                                    <p className="text-xs text-gray-300 mt-1">{model.recommendedFor}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                      <Section title="Battle Parameters" className="md:col-span-2">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Difficulty Level</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => setDifficulty('Easy')} className={`p-2 text-sm rounded-md border font-semibold transition-colors ${difficulty === 'Easy' ? 'bg-green-500 text-white border-green-500' : 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'}`}>Easy</button>
                              <button onClick={() => setDifficulty('Medium')} className={`p-2 text-sm rounded-md border font-semibold transition-colors ${difficulty === 'Medium' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30'}`}>Medium</button>
                              <button onClick={() => setDifficulty('Hard')} className={`p-2 text-sm rounded-md border font-semibold transition-colors ${difficulty === 'Hard' ? 'bg-red-500 text-white border-red-500' : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'}`}>Hard</button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Time Limit</h4>
                            <div className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-2">
                              <FiClock className="text-brand-pink" />
                              <span>10 minutes</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Scenario Type</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.keys(scenarioTypes).map(type => (
                                <button
                                  key={type}
                                  onClick={() => setScenarioType(type)}
                                  className={`p-2 text-sm rounded-md font-semibold transition-colors ${
                                    scenarioType === type 
                                    ? scenarioTypes[type]
                                    : 'bg-gray-700 hover:bg-gray-600'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Section>
                      <Section title="Select Your Layer" className="md:col-span-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                          {layers.map(layer => (
                            <div key={layer.name} onClick={() => setSelectedLayer(layer)} className={`relative rounded-lg overflow-hidden group cursor-pointer border-2 ${selectedLayer.name === layer.name ? 'border-brand-cyan' : 'border-transparent'}`}>
                              <img src={layer.image} alt={layer.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                              <div className="absolute bottom=0 left=0 p-3">
                                <h3 className="font-bold text-md">{layer.name}</h3>
                                <p className="text-xs text-gray-300">{layer.description}</p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs bg-red-500/50 px-1.5 py-0.5 rounded">{layer.difficulty}</span>
                                  <span className="text-xs bg-blue-500/50 px-1.5 py-0.5 rounded">{layer.players}</span>
                                </div>
                              </div>
                              {selectedLayer.name === layer.name && <div className="absolute top-2 right-2 bg-brand-cyan text-brand-dark rounded-full p-1"><FiCheck/></div>}
                            </div>
                          ))}
                        </div>
                      </Section>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-8">
                      <Section title="Battle Preview">
                        <div className="space-y=4 text-sm">
                          <h4 className="text-md font-semibold text-gray-300">Configuration</h4>
                          <div className="space-y-2 text-gray-400 border-b border-gray-800 pb-4">
                            <div className="flex justify-between"><span>Mode:</span> <span className="text-white font-semibold">{selectedFriends.length > 0 ? 'Team Battle' : 'Solo Battle'}</span></div>
                            <div className="flex justify-between"><span>AI Model:</span> <span className="text-white font-semibold">{selectedModel.name}</span></div>
                            <div className="flex justify-between"><span>Layer:</span> <span className="text-white font-semibold">{selectedLayer.name}</span></div>
                            <div className="flex justify-between"><span>Difficulty:</span> <span className="text-white font-semibold">{difficulty}</span></div>
                            <div className="flex justify-between"><span>Focus:</span> <span className="text-white font-semibold">{battleFocus}</span></div>
                            <div className="flex justify-between"><span>Scenario:</span> <span className="text-white font-semibold">{scenarioType || 'N/A'}</span></div>
                          </div>
                          <h4 className="text-md font-semibold text-gray-300">Estimated Scoring</h4>
                          <div className="space-y-2 text-gray-400 border-b border-gray-800 pb-4">
                            <div className="flex justify-between"><span>Base Points:</span> <span className="text-green-400 font-semibold">500</span></div>
                            <div className="flex justify-between"><span>Speed Bonus:</span> <span className="text-green-400 font-semibold">{battleFocus === 'Speed' ? 150 : 50}</span></div>
                            <div className="flex justify-between"><span>Difficulty Bonus:</span> <span className="text-green-400 font-semibold">{difficultyBonus}</span></div>
                          </div>
                          <h4 className="text-md font-semibold text-gray-300">Saved Presets</h4>
                          <div className="space-y-2">
                            <button className="w-full flex justify-between items-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700"><span>Quick Duel</span> <FiArrowRight/></button>
                            <button className="w-full flex justify-between items-center p-2 rounded-lg bg-gray-8 hover:bg-gray-7"><span>Logic Master</span> <FiArrowRight/></button>
                          </div>
                        </div>
                      </Section>
                      <Section title="Quick Actions">
                        <div className="flex flex-col gap-3">
                          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 hover:bg-brand-cyan/20 transition-colors"><FiStar/> Save Current Setup</button>
                          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-7 hover:bg-gray-6 transition-colors"><FiUploadCloud/> Share</button>
                          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-7 hover:bg-gray-6 transition-colors"><FiSliders/> Sandbox Mode</button>
                        </div>
                      </Section>
                    </div>
                  </div>
                </div>

                <motion.div variants={itemVariants} className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={() => navigate(
                      selectedFriends.length > 0 ? '/team-battle-arena' : '/battle-arena',
                      { state: { selectedModel, selectedLayer, difficulty, battleFocus, scenarioType } }
                    )}
                    className="flex items-center gap-2 bg-brand-green text-white font-bold py-3 px-8 rounded-full btn-glow-green text-lg"
                  >
                    <FiZap /> Start Battle
                  </button>
                  <button className="flex items-center gap-2 bg-brand-violet text-white font-bold py=3 px=8 rounded-full hover:bg-brand-violet/80 transition-colors text-lg">
                    <FiSave /> Save Preset
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </>
  );
};

export default SoloBattleSetupPage;

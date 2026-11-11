import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiUsers, FiZap, FiTarget, FiCpu, FiSliders, FiShare2, FiCopy, FiRefreshCw,
  FiChevronDown, FiChevronUp, FiCheckCircle, FiPlus, FiPlay
} from 'react-icons/fi';
import { FaBrain, FaDice } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';


const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const aiOpponents = [
  {
    name: "DeepSeek R1",
    img: 'https://crystalpng.com/wp-content/uploads/2025/01/deepseek-logo-01-1024x1024.png',
    tag: 'Free',
    features: 'Advanced reasoning and problem-solving',
    stats: [{ label: 'Speed', value: 4 }, { label: 'Creativity', value: 5 }, { label: 'Logic', value: 5 }],
    details: { response: '2.3s', cutoff: 'Jan 2024' }
  },
  {
    name: "Google Gemma 3",
    img: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic1.howtogeekimages.com%2Fwordpress%2Fwp-content%2Fuploads%2F2024%2F02%2F23.jpg&f=1&nofb=1&ipt=80c61c6db16acc23e6c08b63e5516a76c51c9e3dd8c99e6d08e32fd90c6cc74e',
    tag: 'Free',
    features: 'Excellent at analysis and understanding',
    stats: [{ label: 'Speed', value: 4 }, { label: 'Design', value: 5 }, { label: 'Creativity', value: 3 }],
    details: { response: '1.8s', cutoff: 'Mar 2024' }
  },
  {
    name: "Mistral AI",
    img: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fassets.stickpng.com%2Fimages%2F66af6a44585ea98e55ff8606.png&f=1&nofb=1&ipt=6fa46b334a75b4fd2a8f0101a7bf408ce4336c21829c8b5e6002b00d25d57078',
    tag: 'Free',
    features: 'Powerful multilingual capabilities',
    stats: [{ label: 'Speed', value: 5 }, { label: 'Logic', value: 5 }, { label: 'Accuracy', value: 4 }],
    details: { response: '1.5s', cutoff: 'Feb 2024' }
  },
  {
    name: "Meta Llama 3.3",
    img: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fverybriefly.com%2Fwp-content%2Fuploads%2F2023%2F02%2FMeta-AI-LLaMA-750x375.jpeg&f=1&nofb=1&ipt=2febe06e1833ed91e3316950693512147780e9891d642ca8ed5a82e4e38b8d7a',
    tag: 'Free',
    features: 'Strong performance across diverse tasks',
    stats: [{ label: 'Speed', value: 5 }, { label: 'Logic', value: 5 }, { label: 'Versatility', value: 5 }],
    details: { response: '2.0s', cutoff: 'Apr 2024' }
  },
  {
    name: "Cohere AI",
    img: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fbpando.org%2Fwp-content%2Fuploads%2F00-AI-Branding-NLP-Cohere-Logo-Logotype-Pentagram-London-Office-Jody-Hudson-Powell-Luke-Powell-BPO-Review-2048x1365.jpg&f=1&nofb=1&ipt=436cf4cbea942f007c7b666efc2b5575bd56d85f722327f2fe05154941857b4d',
    tag: 'Free',
    features: 'Enterprise-focused language model',
    stats: [{ label: 'Speed', value: 3 }, { label: 'Accuracy', value: 5 }, { label: 'Security', value: 5 }],
    details: { response: '2.5s', cutoff: 'Mar 2025' }
  },
  {
    name: "Alibaba Qwen AI",
    img: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fst1.latestly.com%2Fwp-content%2Fuploads%2F2025%2F01%2FQwen-Logo-784x441.jpg&f=1&nofb=1&ipt=6339d88d34ec6001ea9efeda32b67f9ae3a8da3e5ac40c755b36f300af053896',
    tag: 'Free',
    features: 'Equally powerful across all tasks',
    stats: [{ label: 'Speed', value: 4 }, { label: 'Creativity', value: 4 }, { label: 'Logic', value: 4 }],
    details: { response: '1.9s', cutoff: 'Dec 2023' }
  }
];

const BattleModeCard = ({ icon, title, description, stats, buttonText, buttonIcon, onClick, color }) => (
  <motion.div
    onClick={onClick}
    className={`bg-slate-900/50 border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 border-slate-700 hover:border-${color}-500 hover:shadow-${color}-500/30 hover:shadow-lg`}
    whileHover={{ y: -5 }}
  >
    <img src={icon} alt={title} className="w-full h-40 object-contain rounded-lg mb-4 bg-black/20" />
    <h3 className={`text-2xl font-orbitron font-bold text-white`}>{title}</h3>
    <p className="text-slate-400 text-sm mt-2 mb-4 h-10">{description}</p>
    <div className="space-y-2 text-sm mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="flex justify-between">
          <span className="text-slate-400">{stat.label}</span>
          <span className={`font-bold text-${stat.color || 'white'}`}>{stat.value}</span>
        </div>
      ))}
    </div>
    <button className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-full transition-all duration-300 bg-${color}-600 hover:bg-${color}-500 text-white shadow-lg shadow-${color}-600/30`}>
      {buttonIcon} {buttonText}
    </button>
  </motion.div>
);

const AiOpponentCard = ({ img, name, tag, features, stats, selected, position, onClick }) => (
  <motion.div
    onClick={onClick}
    className={`bg-slate-900/50 border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden ${selected ? 'border-cyan-400 shadow-cyan-400/30 shadow-lg' : 'border-slate-700 hover:border-slate-500'}`}
    whileHover={{ y: -5 }}
  >
    {tag && <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">{tag}</div>}
    {selected && position >= 0 && (
      <div className="absolute top-4 left-4 bg-cyan-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">
        {position === 0 ? 'A' : 'B'}
      </div>
    )}
    <img src={img} alt={name} className="w-full h-32 object-cover rounded-lg mb-4" />
    <h4 className="text-lg font-orbitron font-bold text-white">{name}</h4>
    <p className="text-slate-400 text-xs h-8">{features}</p>
    <div className="mt-4 space-y-2 text-xs">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-slate-400">{stat.label}</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, j) => (
              <div key={j} className={`w-3 h-1.5 rounded-full ${j < stat.value ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
            ))}
          </div>
        </div>
      ))}
    </div>
    {selected && (
      <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
        <FiCheckCircle className="text-cyan-400 text-6xl" />
      </div>
    )}
  </motion.div>
);

const scenarioConfig = {
  'Speed Test': { color: 'cyan', icon: <FiZap size={24} /> },
  'Strategy': { color: 'green', icon: <FiTarget size={24} /> },
  'Creativity': { color: 'purple', icon: <FaBrain size={24} /> },
};

const ScenarioButton = ({ label, selected, onClick }) => {
  const config = scenarioConfig[label];
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all duration-300 border-2 ${selected ? `bg-${config.color}-500/20 border-${config.color}-500 text-${config.color}-400` : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'}`}
    >
      {config.icon}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
};

const BattlePreviewSidebar = ({ selections, onStartBattle, prompt }) => {
  const [presetsOpen, setPresetsOpen] = useState(true);
  const { opponents } = selections;

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 space-y-6 sticky top-24">
      <div>
        <h4 className="font-orbitron text-lg text-white mb-3">Battle Preview</h4>
        <div className="bg-slate-800/50 p-4 rounded-lg space-y-2 text-sm">
          <h5 className="font-bold text-cyan-400 mb-2">Configuration</h5>
          <div className="flex justify-between"><span className="text-slate-400">Mode:</span> <span className="font-semibold">{selections.mode}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Models:</span> <span className="font-semibold">{opponents.map(op => op?.name).join(' vs ')}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Difficulty:</span> <span className="font-semibold text-yellow-400">Intermediate</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Scenario:</span> <span className="font-semibold">{selections.scenario}</span></div>
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-lg space-y-2 text-sm">
        <h5 className="font-bold text-cyan-400 mb-2">Prompt Preview</h5>
        <div className="bg-slate-700/30 p-3 rounded-lg text-sm max-h-32 overflow-y-auto">
          {prompt || <span className="text-slate-500 italic">No prompt entered</span>}
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-lg space-y-2 text-sm">
        <h5 className="font-bold text-cyan-400 mb-2">Estimated Scoring</h5>
        <div className="flex justify-between"><span className="text-slate-400">Base Points:</span> <span className="font-semibold">100</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Speed Bonus:</span> <span className="font-semibold text-green-400">+52</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Difficulty Multiplier:</span> <span className="font-semibold">x1.5</span></div>
        <div className="flex justify-between text-base"><span className="text-slate-400">Max Potential XP:</span> <span className="font-bold text-cyan-400">225</span></div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-lg space-y-2 text-sm">
        <h5 className="font-bold text-cyan-400 mb-2">Model Details</h5>
        {opponents.map((opponent, index) => (
          <div key={index} className="flex items-center gap-3 mb-4">
            <img src={opponent?.img} alt={opponent?.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-bold">{opponent?.name}</p>
              <p className="text-xs text-slate-400">Avg Response: {opponent?.details?.response}</p>
              <p className="text-xs text-slate-400">Knowledge Cutoff: {opponent?.details?.cutoff}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-lg">
        <button onClick={() => setPresetsOpen(!presetsOpen)} className="w-full flex justify-between items-center p-4">
          <h5 className="font-bold text-cyan-400">Saved Presets</h5>
          {presetsOpen ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {presetsOpen && (
          <div className="p-4 pt-0 space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-slate-700/50"><span>Quick Duel</span><FiPlay className="text-cyan-400"/></div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-slate-700/50"><span>Logic Master</span><FiPlay className="text-cyan-400"/></div>
            <button className="w-full flex items-center justify-center gap-2 text-cyan-400 mt-2 p-2 rounded-md border border-cyan-400/50 hover:bg-cyan-400/10">
              <FiPlus /> Save Current Setup
            </button>
          </div>
        )}
      </div>

      <div>
        <h5 className="font-bold text-cyan-400 mb-3">Quick Actions</h5>
        <div className="space-y-2">
          <button onClick={onStartBattle} className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30">
            <FiPlay /> Start Battle
          </button>
          <div className="flex gap-2">
            <button className="w-full flex items-center justify-center gap-2 font-bold py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white"><FiShare2 size={16}/> Share</button>
            <button className="w-full flex items-center justify-center gap-2 font-bold py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white"><FiCopy size={16}/> Duplicate</button>
          </div>
          <button className="w-full flex items-center justify-center gap-2 font-bold py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white"><FiRefreshCw size={16}/> Random Setup</button>
        </div>
      </div>
    </div>
  );
};

const randomPrompts = [
  "Write a story where two robots debate the meaning of creativity.",
  "Design a prompt for a coding challenge about sorting algorithms.",
  "Simulate a negotiation between two AIs for world peace.",
  "Create a poem about the future of artificial intelligence.",
  "Describe a strategy to optimize supply chain logistics using AI."
];

const BattleModePage = () => {
  const navigate = useNavigate();
  const [selectedModels, setSelectedModels] = useState([]);
  const [scenario, setScenario] = useState('Strategy');
  const [advancedRulesOpen, setAdvancedRulesOpen] = useState(true);
  const [noJokesMode, setNoJokesMode] = useState(false);
  const [tokenLimit, setTokenLimit] = useState(1202);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const email = location.state?.email;

  const toggleModel = (modelName) => {
    if (selectedModels.includes(modelName)) {
      setSelectedModels(selectedModels.filter(name => name !== modelName));
    } else if (selectedModels.length < 2) {
      setSelectedModels([...selectedModels, modelName]);
    }
  };

  const handleRandomPrompt = () => {
    setPrompt(randomPrompts[Math.floor(Math.random() * randomPrompts.length)]);
  };

  // THE ONLY CHANGE IS HERE:
  const handleStartBattle = () => {
    if (selectedModels.length === 0) {
      setError("Please select at least one model");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a battle prompt");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const battleData = {
      modelA: selectedModels[0],
      modelB: selectedModels[1] || selectedModels[0],
      prompt: prompt.trim(),
      scenario: scenario,
      tokenLimit,
      noJokesMode
    };
    sessionStorage.setItem('battleData', JSON.stringify(battleData));
    // CHANGE THIS ROUTE:
    console.log(email);
    navigate('/local-battle', { state: {battleData, email} });
  };

  const selections = {
    mode: 'Local Battle',
    opponents: selectedModels.map(name =>
      aiOpponents.find(op => op.name === name)
    ).filter(Boolean),
    scenario: scenario,
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
      className="min-h-screen bg-brand-dark text-white font-sans"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.stockcake.com/public/a/d/d/add348ef-ab45-4f83-b462-78c54ae8a47a_large/neon-robot-artist-stockcake.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <header className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-brand-pink to-brand-violet shadow-lg">
            <span className="font-bold text-xl font-orbitron text-white">Z</span>
          </div>
          <h1 className="text-xl font-bold font-orbitron">Zecathon Prompt Wars</h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm border border-slate-700 bg-slate-900/50 rounded-full px-6 py-2">
          <a href="#" className="text-slate-300 hover:text-cyan-400 transition">Dashboard</a>
          <a href="#" className="text-cyan-400 font-bold transition">Battles</a>
          <a href="#" className="text-slate-300 hover:text-cyan-400 transition">Leaderboard</a>
        </nav>
        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 transition"><FiUser /></button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Choose Battle Mode */}
        <motion.section variants={sectionVariants} className="text-center mb-16">
          <h2 className="text-5xl font-bold font-orbitron text-glow-cyan mb-2">Choose Your Battle Mode</h2>
          <p className="text-slate-400">Select your combat configuration and prepare for AI warfare.</p>
        </motion.section>

        <motion.section variants={sectionVariants} className="grid md:grid-cols-2 gap-8 mb-20">
          <BattleModeCard
            icon="https://imgcdn.stablediffusionweb.com/2024/3/17/eeb4474e-4f15-41d3-b670-5a98f048d008.jpg"
            title="Solo Battle"
            description="Test your prompting skills against AI in single combat."
            stats={[
              { label: 'Your Solo Stats', value: '87% Win Rate', color: 'green-400' },
              { label: 'Last 5 Battles', value: '4 Wins, 1 Loss' },
              { label: 'XP Earned', value: '2,458 XP', color: 'cyan-400' },
            ]}
            buttonText="Configure Solo Battle"
            buttonIcon={<FiUser />}
            onClick={() => navigate('/solo-battle-setup', { state: { email } })}
            color="cyan"
          />
          <BattleModeCard
            icon="https://thumbs.dreamstime.com/b/pink-humanoid-robots-neon-lit-high-tech-environment-ai-robots-pink-female-robots-team-artificial-intelligence-machine-361067895.jpg"
            title="Team Battle"
            description="Collaborate with allies or compete in strategic team warfare."
            stats={[
              { label: 'Team Win Rate', value: '73% Win Rate', color: 'green-400' },
              { label: 'Active Teams', value: '3 Teams' },
              { label: 'Team XP', value: '4,820 XP', color: 'purple-400' },
            ]}
            buttonText="Configure Team Battle"
            buttonIcon={<FiUsers />}
            onClick={() => navigate('/team-battle-setup', { state: { email } })}
            color="purple"
          />
          </motion.section>
          <motion.section variants={sectionVariants} className="flex justify-center mb-20">
            <div className="w-full md:w-1/2">
              <BattleModeCard
                icon="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fneurosciencenews.com%2Ffiles%2F2023%2F07%2Fchatgpt-reasoning-ai-neurosicence.jpg&f=1&nofb=1&ipt=27811803b5f701fa285773c6cd0fabde294109365682f32dbcf0bd7a61453c8a"
                title="vs AI"
                description="Challenge yourself directly against a powerful AI model."
                stats={[
                  { label: 'AI Difficulty', value: 'Adaptive', color: 'yellow-400' },
                  { label: 'AI Win Rate', value: '60%', color: 'red-400' },
                  { label: 'XP for Win', value: '1,200 XP', color: 'yellow-400' },
                ]}
                buttonText="Start vs AI Battle"
                buttonIcon={<FaBrain />}
                onClick={() => navigate('/vs-ai-battle-setup', { state: { email } })}
                color="yellow"
              />
            </div>
          </motion.section>

        {/* Select AI Opponent */}
        <motion.section variants={sectionVariants} className="text-center mb-12">
          <p className="text-purple-400 font-semibold">Play Local battle</p>
          <h2 className="text-4xl font-bold font-orbitron text-glow-purple mt-2 mb-2">Select Your AI Models</h2>
          <p className="text-slate-400">Choose up to 2 models to battle against each other.</p>
        </motion.section>

        <motion.section variants={sectionVariants} className="grid md:grid-cols-3 gap-6 mb-20 max-w-6xl mx-auto">
          {aiOpponents.map(opponent => {
            const position = selectedModels.indexOf(opponent.name);
            return (
              <AiOpponentCard
                key={opponent.name}
                {...opponent}
                selected={selectedModels.includes(opponent.name)}
                position={position}
                onClick={() => toggleModel(opponent.name)}
              />
            );
          })}
        </motion.section>

        {error && (
          <motion.div
            variants={sectionVariants}
            className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-center"
          >
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        <motion.div variants={sectionVariants} className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Scenario Type */}
            <section>
              <h4 className="font-orbitron text-lg text-white mb-4">Scenario Type</h4>
              <div className="flex gap-4">
                {Object.keys(scenarioConfig).map(label => (
                  <ScenarioButton key={label} label={label} selected={scenario === label} onClick={() => setScenario(label)} />
                ))}
              </div>
            </section>

            {/* Custom Scenario */}
            <section>
              <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                <h4 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2"><FiCpu /> Custom Scenario</h4>
                <textarea
                  placeholder="Design your battle prompt here..."
                  className="w-full bg-slate-800/70 border border-slate-600 rounded-lg p-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows="5"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                ></textarea>
                <button
                  className="mt-3 flex items-center gap-2 text-sm text-cyan-400 hover:text-white"
                  onClick={handleRandomPrompt}
                  type="button"
                >
                  <FaDice /> Randomize
                </button>
              </div>
            </section>

            {/* Advanced Rules */}
            <section>
              <div className="bg-slate-900/50 border border-slate-700 rounded-2xl">
                <button onClick={() => setAdvancedRulesOpen(!advancedRulesOpen)} className="w-full flex justify-between items-center p-6">
                  <h4 className="font-orbitron text-lg text-white flex items-center gap-2"><FiSliders /> Advanced Rules</h4>
                  {advancedRulesOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {advancedRulesOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-6 pb-6 space-y-4 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-slate-300">Token Limit</label>
                      <input
                        type="number"
                        value={tokenLimit}
                        min={256}
                        max={4096}
                        onChange={e => setTokenLimit(Number(e.target.value))}
                        className="w-24 bg-slate-800 border border-slate-600 rounded-md p-2 text-center"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-slate-300">No Jokes Mode</label>
                      <button onClick={() => setNoJokesMode(!noJokesMode)} className={`relative w-12 h-6 rounded-full p-1 transition-colors ${noJokesMode ? 'bg-purple-600' : 'bg-slate-700'}`}>
                        <motion.div className="w-4 h-4 bg-white rounded-full" layout transition={{ type: 'spring', stiffness: 700, damping: 30 }} style={{ x: noJokesMode ? '1.25rem' : '0rem' }} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </section>

            <div className="flex justify-center lg:hidden">
              <button onClick={handleStartBattle} className="w-full max-w-xs flex items-center justify-center gap-2 font-bold py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30">
                <FiPlay /> Start Battle
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 hidden lg:block">
            <BattlePreviewSidebar
              selections={selections}
              onStartBattle={handleStartBattle}
              prompt={prompt}
            />
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default BattleModePage;

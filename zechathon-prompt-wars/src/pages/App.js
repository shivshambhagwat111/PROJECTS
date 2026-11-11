import { Routes, Route } from 'react-router-dom';
import BattleModePage from './BattleModePage';
import BattleArenaPage from './BattleArenaPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<BattleModePage />} />
      <Route path="/battle-arena" element={<BattleArenaPage />} />
      {/* Other routes */}
    </Routes>
  );
}

export default App;

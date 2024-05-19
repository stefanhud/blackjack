import React, { useState } from 'react';
import Blackjack from './components/Blackjack';
import './App.css';

function App() {
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="App">
      {!gameStarted ? (
        <div className="start-screen">
          <h1>Vitajte v Blackjacku</h1>
          <input
            type="text"
            placeholder="Zadajte vaše meno"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button onClick={startGame} disabled={!playerName}>
            Začať hru
          </button>
        </div>
      ) : (
        <Blackjack playerName={playerName} />
      )}
    </div>
  );
}

export default App;
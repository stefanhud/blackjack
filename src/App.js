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
          <h1>Welcome to Blackjack</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button onClick={startGame} disabled={!playerName}>
            Start Game
          </button>
        </div>
      ) : (
        <Blackjack playerName={playerName} />
      )}
    </div>
  );
}

export default App;

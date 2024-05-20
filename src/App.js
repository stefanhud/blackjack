import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import Blackjack from './components/Blackjack';

const socket = io.connect('http://localhost:4001');

const App = () => {
    const [nickname, setNickname] = useState('');
    const [stack, setStack] = useState(1000); // Default stack
    const [players, setPlayers] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [waitingForNextGame, setWaitingForNextGame] = useState(false);

    useEffect(() => {
        socket.on('updatePlayers', (players) => {
            setPlayers(players);
        });

        socket.on('startGame', ({ players, dealerHand }) => {
            setGameStarted(true);
            setPlayers(players);
            setDealerHand(dealerHand);
            setWaitingForNextGame(false);
        });

        socket.on('waitForNextGame', () => {
            setWaitingForNextGame(true);
        });

        socket.on('dealerPlay', ({ dealerHand, players }) => {
            setDealerHand(dealerHand);
            setPlayers(players);
        });

        socket.on('gameResult', ({ players, dealerHand }) => {
            setDealerHand(dealerHand);
            setPlayers(players);
            setTimeout(() => {
                socket.emit('startNewGame');
            }, 5000); // Wait 5 seconds before starting a new game
        });

        return () => {
            socket.off('updatePlayers');
            socket.off('startGame');
            socket.off('waitForNextGame');
            socket.off('dealerPlay');
            socket.off('gameResult');
        };
    }, []);

    const takeSeat = (seatIndex) => {
        const player = { nickname, stack, seatIndex };
        socket.emit('joinGame', player);
    };

    return (
        <div className="App">
            {!gameStarted ? (
                <div className="join-screen">
                    <h2>Your Nickname</h2>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                    />
                    <h2>Your Stack</h2>
                    <input
                        type="number"
                        value={stack}
                        onChange={(e) => setStack(Number(e.target.value))}
                    />
                    <div className="seats">
                        {[0, 1, 2].map((index) => (
                            <button key={index} onClick={() => takeSeat(index)}>
                                {players[index] ? `${players[index].nickname} (${players[index].stack})` : 'Take this Seat'}
                            </button>
                        ))}
                    </div>
                    {waitingForNextGame && <p>Waiting for the next game...</p>}
                </div>
            ) : (
                <Blackjack players={players} dealerHand={dealerHand} socket={socket} />
            )}
        </div>
    );
};

export default App;

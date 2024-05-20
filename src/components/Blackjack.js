import React, { useState, useEffect } from 'react';
import './Blackjack.css';

const getCardValue = (card) => {
    if (!card) return 0;
    if (card.rank === 'ace') {
        return 11;
    } else if (['jack', 'queen', 'king'].includes(card.rank)) {
        return 10;
    } else {
        return parseInt(card.rank);
    }
};

const calculateHandValue = (hand) => {
    if (!hand || !Array.isArray(hand)) return 0; // Add defensive check
    let value = 0;
    let numAces = 0;
    hand.forEach(card => {
        if (card) {
            value += getCardValue(card);
            if (card.rank === 'ace') {
                numAces++;
            }
        }
    });
    while (value > 21 && numAces > 0) {
        value -= 10;
        numAces--;
    }
    return value;
};

const Blackjack = ({ players, dealerHand, socket }) => {
    const [gameResult, setGameResult] = useState('');
    const [currentBet, setCurrentBet] = useState(0);

    useEffect(() => {
        socket.on('gameResult', ({ players, dealerHand }) => {
            const playerResults = players.map(player => `${player.nickname}: ${player.result}`).join(', ');
            setGameResult(`Game Over! Results: ${playerResults}`);
        });

        return () => {
            socket.off('gameResult');
        };
    }, [socket]);

    const playerHit = (playerId) => {
        socket.emit('hit', playerId);
    };

    const playerStand = (playerId) => {
        socket.emit('stand', playerId);
    };

    const playerDoubleDown = (playerId) => {
        socket.emit('doubleDown', playerId);
    };

    const handleBetChange = (playerId, bet) => {
        setCurrentBet(bet);
        socket.emit('placeBet', { playerId, bet });
    };

    const getCardImage = (card) => {
        if (!card) return '';
        const { rank, suit } = card;
        return `/cards/${rank}_of_${suit}.png`;
    };

    return (
        <div className="blackjack">
            <h1>Blackjack</h1>
            <div className="hands">
                {players.map((player) => (
                    <div key={player.id} className="hand">
                        <h2>{player.nickname}'s Hand (Value: {calculateHandValue(player.hand)})</h2>
                        <div className="cards">
                            {player.hand.map((card, index) => (
                                <img key={index} src={getCardImage(card)} alt={`${card.rank} of ${card.suit}`} />
                            ))}
                        </div>
                        {player.turn && (
                            <div>
                                <button onClick={() => playerHit(player.id)}>Hit</button>
                                <button onClick={() => playerStand(player.id)}>Stand</button>
                                <button onClick={() => playerDoubleDown(player.id)}>Double Down</button>
                                <input 
                                    type="number" 
                                    placeholder="Enter your bet"
                                    value={currentBet}
                                    onChange={(e) => handleBetChange(player.id, Number(e.target.value))}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="hand">
                <h2>Dealer's Hand (Value: {calculateHandValue(dealerHand)})</h2>
                <div className="cards">
                    {dealerHand.map((card, index) => (
                        <img key={index} src={getCardImage(card)} alt={`${card.rank} of ${card.suit}`} />
                    ))}
                </div>
            </div>
            <h2>{gameResult}</h2>
        </div>
    );
};

export default Blackjack;

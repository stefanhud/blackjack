import React, { useState, useEffect, useCallback } from 'react';
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

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const initializeDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'
  ];
  let newDeck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      newDeck.push({ suit, rank });
    }
  }
  return shuffleDeck(newDeck.concat(newDeck, newDeck, newDeck, newDeck, newDeck)); // Using 6 decks
};

const calculateHandValue = (hand) => {
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

const Blackjack = ({ playerName }) => {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerBet, setPlayerBet] = useState(0);
  const [playerBalance, setPlayerBalance] = useState(1000); // Initial balance
  const [gameResult, setGameResult] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [playerHandValue, setPlayerHandValue] = useState(0);
  const [dealerHandValue, setDealerHandValue] = useState(0);
  const [doubleDownActive, setDoubleDownActive] = useState(false);

  const checkForNaturals = useCallback(() => {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    if (playerValue === 21 || dealerValue === 21) {
      if (playerValue === 21 && dealerValue === 21) {
        setGameResult("It's a tie with Naturals!");
      } else if (playerValue === 21) {
        setPlayerBalance(playerBalance + playerBet * 1.5);
        setGameResult("Blackjack! You win!");
      } else {
        setPlayerBalance(playerBalance - playerBet);
        setGameResult("Dealer has Blackjack. You lose!");
      }
      setGameStarted(false);
      setPlayerTurn(false);
    }
  }, [playerHand, dealerHand, playerBet, playerBalance]);

  useEffect(() => {
    if (gameStarted) {
      setPlayerHandValue(calculateHandValue(playerHand));
      setDealerHandValue(calculateHandValue(dealerHand));
      checkForNaturals();
    }
  }, [playerHand, dealerHand, gameStarted, checkForNaturals]);

  useEffect(() => {
    setPlayerHandValue(calculateHandValue(playerHand));
  }, [playerHand]);

  useEffect(() => {
    setDealerHandValue(calculateHandValue(dealerHand));
  }, [dealerHand]);

  const dealInitialCards = useCallback((newDeck) => {
    const playerInitialHand = [newDeck.pop(), newDeck.pop()];
    const dealerInitialHand = [newDeck.pop()]; // Only one card for the dealer initially
    setPlayerHand(playerInitialHand);
    setDealerHand(dealerInitialHand);
    setDeck(newDeck);
  }, []);

  const resetGameState = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameResult('');
    setPlayerTurn(true);
    setDoubleDownActive(false);
    setPlayerHandValue(0);
    setDealerHandValue(0);
  };

  const startGame = () => {
    if (playerBet < 2 || playerBet > 500) {
      setGameResult("Bet must be between $2 and $500.");
      return;
    }
    resetGameState();
    setGameStarted(true);
    const newDeck = initializeDeck();
    setTimeout(() => {
      dealInitialCards(newDeck);
    }, 1000);
  };

  const getCardImage = (card) => {
    if (!card) return '';
    const { rank, suit } = card;
    return `/cards/${rank}_of_${suit}.png`;
  };

  const handleBetChange = (e) => {
    setPlayerBet(Number(e.target.value));
  };

  const playerHit = () => {
    const newHand = [...playerHand, deck.pop()];
    setPlayerHand(newHand);
    const playerValue = calculateHandValue(newHand);
    setPlayerHandValue(playerValue);
    if (playerValue > 21) {
      setPlayerBalance(playerBalance - playerBet);
      setGameResult("You exceeded 21! You lose!");
      setGameStarted(false);
      setPlayerTurn(false);
    }
  };

  const playerStand = () => {
    setPlayerTurn(false);
    dealerPlay();
  };

  const playerDoubleDown = () => {
    const newBet = playerBet * 2;
    setPlayerBet(newBet);
    setDoubleDownActive(true);
    const newHand = [...playerHand, deck.pop()];
    setPlayerHand(newHand);
    setPlayerTurn(false); // Automatically end player's turn after double down
    if (calculateHandValue(newHand) <= 21) {
      dealerPlay();
    }
  };

  const determineWinner = useCallback((finalDealerHand) => {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(finalDealerHand);
    setPlayerHandValue(playerValue);
    setDealerHandValue(dealerValue);
    if (dealerValue > 21 || playerValue > dealerValue) {
      setPlayerBalance(playerBalance + playerBet);
      setGameResult("You win!");
    } else if (playerValue < dealerValue) {
      setPlayerBalance(playerBalance - playerBet);
      setGameResult("You lose!");
    } else {
      setGameResult("It's a tie!");
    }
    setGameStarted(false);
  }, [playerHand, playerBet, playerBalance]);

  const dealerPlay = useCallback(() => {
    let dealerValue = calculateHandValue(dealerHand);
    const newDealerHand = [...dealerHand];
    while (dealerValue < 17) {
      newDealerHand.push(deck.pop());
      dealerValue = calculateHandValue(newDealerHand);
    }
    setDealerHand(newDealerHand);
    determineWinner(newDealerHand);
  }, [dealerHand, deck, determineWinner]);

  return (
    <div className="blackjack">
      <h1>Blackjack</h1>
      <h2>Welcome, {playerName}</h2>
      <div className="betting">
        <input
          type="number"
          placeholder="Enter your bet"
          value={playerBet}
          onChange={handleBetChange}
          min="2"
          max="500"
          disabled={gameStarted}
        />
        <button onClick={startGame} disabled={gameStarted}>
          Place Bet and Start Game
        </button>
      </div>
      <div className="hand">
        <h2>Player's Hand (Value: {playerHandValue})</h2>
        <div className="cards">
          {playerHand.map((card, index) => (
            <img key={index} src={getCardImage(card)} alt={`${card?.rank} of ${card?.suit}`} />
          ))}
        </div>
        {playerTurn && gameStarted && (
          <div>
            <button onClick={playerHit}>Hit</button>
            <button onClick={playerStand}>Stand</button>
            <button onClick={playerDoubleDown} disabled={doubleDownActive}>Double Down</button>
          </div>
        )}
      </div>
      <div className="hand">
        <h2>Dealer's Hand (Value: {dealerHandValue})</h2>
        <div className="cards">
          {dealerHand.map((card, index) => (
            <img key={index} src={getCardImage(card)} alt={`${card?.rank} of ${card?.suit}`} />
          ))}
        </div>
      </div>
      <h2>{gameResult}</h2>
      <h3>Balance: ${playerBalance}</h3>
    </div>
  );
};

export default Blackjack;

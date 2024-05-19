import React, { useState, useEffect, useCallback } from 'react';
import './Blackjack.css';

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

  const calculateHandValue = useCallback((hand) => {
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
  }, []);

  const checkForNaturals = useCallback(() => {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    if (playerValue === 21 || dealerValue === 21) {
      if (playerValue === 21 && dealerValue === 21) {
        setGameResult("Je to remíza s Naturalmi!");
      } else if (playerValue === 21) {
        setPlayerBalance(playerBalance + playerBet * 1.5);
        setGameResult("Blackjack! Vyhrali ste!");
      } else {
        setPlayerBalance(playerBalance - playerBet);
        setGameResult("Krupiér má Blackjack. Prehrali ste!");
      }
      setGameStarted(false);
      setPlayerTurn(false);
    }
  }, [calculateHandValue, playerBet, playerHand, dealerHand, playerBalance]);

  useEffect(() => {
    if (gameStarted) {
      setPlayerHandValue(calculateHandValue(playerHand));
      setDealerHandValue(calculateHandValue(dealerHand));
      checkForNaturals();
    }
  }, [playerHand, dealerHand, gameStarted, calculateHandValue, checkForNaturals]);

  useEffect(() => {
    setDealerHandValue(calculateHandValue(dealerHand));
  }, [dealerHand, calculateHandValue]);

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
    newDeck = shuffleDeck(newDeck.concat(newDeck, newDeck, newDeck, newDeck, newDeck)); // Using 6 decks
    setDeck(newDeck);
  };

  const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const dealInitialCards = () => {
    const playerInitialHand = [deck.pop(), deck.pop()];
    const dealerInitialHand = [deck.pop(), deck.pop()];
    setPlayerHand(playerInitialHand);
    setDealerHand(dealerInitialHand);
  };

  const startGame = () => {
    setGameResult('');
    setGameStarted(true);
    setPlayerTurn(true);
    initializeDeck();
    setTimeout(() => {
      dealInitialCards();
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
      setGameResult("Prekročili ste 21! Prehrali ste!");
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
    playerHit();
    if (playerHandValue <= 21) {
      playerStand();
    }
  };

  const dealerPlay = () => {
    let dealerValue = calculateHandValue(dealerHand);
    while (dealerValue < 17) {
      const newHand = [...dealerHand, deck.pop()];
      setDealerHand(newHand);
      dealerValue = calculateHandValue(newHand);
    }
    determineWinner();
  };

  const determineWinner = () => {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    setPlayerHandValue(playerValue);
    setDealerHandValue(dealerValue);
    if (dealerValue > 21 || playerValue > dealerValue) {
      setPlayerBalance(playerBalance + playerBet);
      setGameResult("Vyhrali ste!");
    } else if (playerValue < dealerValue) {
      setPlayerBalance(playerBalance - playerBet);
      setGameResult("Prehrali ste!");
    } else {
      setGameResult("Je to remíza!");
    }
    setGameStarted(false);
  };

  return (
    <div className="blackjack">
      <h1>Blackjack</h1>
      <h2>Vitajte, {playerName}</h2>
      <div className="betting">
        <input
          type="number"
          placeholder="Zadajte vašu stávku"
          value={playerBet}
          onChange={handleBetChange}
          min="2"
          max="500"
          disabled={gameStarted}
        />
        <button onClick={startGame} disabled={playerBet < 2 || playerBet > 500 || gameStarted}>
          Vložiť stávku a začať hru
        </button>
      </div>
      <div className="hand">
        <h2>Ruka hráča (Hodnota: {playerHandValue})</h2>
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
        <h2>Ruka krupiéra (Hodnota: {dealerHandValue})</h2>
        <div className="cards">
          {dealerHand.map((card, index) => (
            <img key={index} src={getCardImage(card)} alt={`${card?.rank} of ${card?.suit}`} />
          ))}
        </div>
      </div>
      <h2>{gameResult}</h2>
      <h3>Zostatok: ${playerBalance}</h3>
    </div>
  );
};

export default Blackjack;
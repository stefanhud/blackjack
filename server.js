const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let players = [];
let gameInProgress = false;
let deck = [];
let dealerHand = [];

const initializeDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    let newDeck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            newDeck.push({ suit, rank });
        }
    }
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck.concat(newDeck, newDeck, newDeck, newDeck, newDeck); // Using 6 decks
};

const calculateHandValue = (hand) => {
    let value = 0;
    let numAces = 0;
    hand.forEach(card => {
        value += getCardValue(card);
        if (card.rank === 'ace') {
            numAces++;
        }
    });
    while (value > 21 && numAces > 0) {
        value -= 10;
        numAces--;
    }
    return value;
};

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

const dealInitialCards = () => {
    players.forEach(player => {
        player.hand = [deck.pop(), deck.pop()];
    });
    dealerHand = [deck.pop()]; // Dealer starts with only one card
};

const resetGameState = () => {
    deck = initializeDeck();
    players.forEach(player => {
        player.hand = [];
        player.turn = false;
        player.result = '';
        player.bet = 0; // Reset bet to 0
    });
    dealerHand = [];
    gameInProgress = false;
};

const startNewGame = () => {
    resetGameState();
    dealInitialCards();
    players[0].turn = true; // First player starts
    io.emit('startGame', { players, dealerHand });
    gameInProgress = true;
};

const nextPlayerTurn = () => {
    const currentPlayerIndex = players.findIndex(player => player.turn);
    if (currentPlayerIndex === -1 || currentPlayerIndex === players.length - 1) {
        dealerPlay();
    } else {
        players[currentPlayerIndex].turn = false;
        players[currentPlayerIndex + 1].turn = true;
        io.emit('updatePlayers', players);
    }
};

const dealerPlay = () => {
    let dealerValue = calculateHandValue(dealerHand);
    while (dealerValue < 17) {
        dealerHand.push(deck.pop());
        dealerValue = calculateHandValue(dealerHand);
    }
    determineWinners();
};

const determineWinners = () => {
    const dealerValue = calculateHandValue(dealerHand);
    players.forEach(player => {
        const playerValue = calculateHandValue(player.hand);
        if (playerValue > 21) {
            player.result = 'lose';
        } else if (dealerValue > 21 || playerValue > dealerValue) {
            player.result = 'win';
            player.stack += player.bet;
        } else if (playerValue < dealerValue) {
            player.result = 'lose';
            player.stack -= player.bet;
        } else {
            player.result = 'tie';
        }
    });
    io.emit('gameResult', { players, dealerHand });
    gameInProgress = false;
    setTimeout(() => {
        if (players.length > 0) {
            startNewGame();
        }
    }, 5000); // Wait 5 seconds before starting a new game
};

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinGame', (player) => {
        console.log('Player joined:', player);
        if (!gameInProgress && players.length < 3 && !players.some(p => p.seatIndex === player.seatIndex)) {
            players.push({ ...player, id: socket.id, hand: [], turn: false });
            io.emit('updatePlayers', players);
            if (players.length === 1) {
                startNewGame();
            }
        } else {
            socket.emit('waitForNextGame');
        }
    });

    socket.on('placeBet', ({ playerId, bet }) => {
        const player = players.find(p => p.id === playerId);
        if (player) {
            player.bet = bet;
        }
    });

    socket.on('hit', (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (player && player.turn) {
            player.hand.push(deck.pop());
            io.emit('updatePlayers', players);
            if (calculateHandValue(player.hand) > 21) {
                player.turn = false;
                nextPlayerTurn();
            }
        }
    });

    socket.on('stand', (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (player && player.turn) {
            player.turn = false;
            nextPlayerTurn();
        }
    });

    socket.on('doubleDown', (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (player && player.turn) {
            player.bet *= 2;
            player.hand.push(deck.pop());
            player.turn = false;
            if (calculateHandValue(player.hand) <= 21) {
                nextPlayerTurn();
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        players = players.filter(player => player.id !== socket.id);
        io.emit('updatePlayers', players);
    });

    socket.on('startNewGame', () => {
        startNewGame();
    });
});

server.listen(4001, () => console.log('Listening on port 4001'));

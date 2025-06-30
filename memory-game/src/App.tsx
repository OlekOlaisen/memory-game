import { useEffect, useState, useRef } from "react";
import "./App.css";

interface Card {
  id: number;
  letter: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Stokker kortene ved å duplisere bokstavene og blande dem
// Returnerer en liste med kortobjekter som har id, bokstav, om de er snudd og om de er matchet
function shuffleCards(): Card[] {
  const duplicatedLetters = [...CARD_LETTERS, ...CARD_LETTERS];

  for (
    let currentIndex = duplicatedLetters.length - 1;
    currentIndex > 0;
    currentIndex--
  ) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    [duplicatedLetters[currentIndex], duplicatedLetters[randomIndex]] = [
      duplicatedLetters[randomIndex],
      duplicatedLetters[currentIndex],
    ];
  }

  return duplicatedLetters.map((letter, index) => ({
    id: index,
    letter,
    isFlipped: false,
    isMatched: false,
  }));
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [ConfirmExit, setConfirmExit] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [highScore, setHighScore] = useState<number | null>(null);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allCardsMatched = matchCount === CARD_LETTERS.length;

  // Henter highscore fra local storage på første render
  // Hvis det finnes en lagret highscore, settes den i state
  useEffect(() => {
    const savedHighScore = localStorage.getItem("HighScore");
    if (savedHighScore) {
      setHighScore(Number(savedHighScore));
    }
  }, []);

  // Starter et nytt spill når spillstatus blir aktiv
  // Stokker kortene, nullstiller forsøk, treff, snudde kort og vinnerstatus
  useEffect(() => {
    if (isGameActive) {
      setCards(shuffleCards());
      setAttemptCount(0);
      setMatchCount(0);
      setFlippedCards([]);
      setHasWon(false);
    }
  }, [isGameActive]);

  // Når alle kort er matchet, registreres score og eventuelt ny rekord
  useEffect(() => {
    if (allCardsMatched && !hasWon) {
      setHasWon(true);
      const isNewHighScore = highScore === null || attemptCount < highScore;
      if (isNewHighScore) {
        setHighScore(attemptCount);
        localStorage.setItem("HighScore", attemptCount.toString());
      }
    }
  }, [allCardsMatched, hasWon, attemptCount, highScore]);

  // Sjekker to snudde kort som gir treff eller snur tilbake
  useEffect(() => {
    if (flippedCards.length === 2) {
      setAttemptCount((previousCount) => previousCount + 1);

      const [firstFlippedCard, secondFlippedCard] = flippedCards;

      // Sjekk om kortene matcher
      if (firstFlippedCard.letter === secondFlippedCard.letter) {
        // Markerer kortene som matchet
        setCards((previousCards) =>
          previousCards.map((card) =>
            card.letter === firstFlippedCard.letter
              ? { ...card, isMatched: true }
              : card
          )
        );
        setMatchCount((previousCount) => previousCount + 1);
        setFlippedCards([]);
      } else {
        // Eller snur kortene tilbake etter 750 ms
        flipTimeoutRef.current = setTimeout(() => {
          setCards((previousCards) =>
            previousCards.map((card) =>
              card.id === firstFlippedCard.id ||
              card.id === secondFlippedCard.id
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 750);
      }
    }

    // Rydder opp i timeout når komponenten avbrytes eller flippedCards endres
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    };
  }, [flippedCards]);


  // Håndterer bekreftelsesdialog for å forhindre lukking av siden
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isGameActive) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isGameActive]);

  // Håndterer klikk på et kort. Snur det om ikke allerede snudd eller matchet
  function handleCardClick(selectedCard: Card) {
    if (
      selectedCard.isFlipped ||
      selectedCard.isMatched ||
      flippedCards.length === 2
    )
      return;

    setCards((previousCards) =>
      previousCards.map((card) =>
        card.id === selectedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    setFlippedCards((previousFlippedCards) => [
      ...previousFlippedCards,
      selectedCard,
    ]);
  }

  // Setter spillet som aktivt
  function startGame() {
    setIsGameActive(true);
  }

  /* Starter spillet på nytt med stokket kort
   Nullstiller forsøk, treff, snudde kort og vinnerstatus
   Hvis det er en ny rekord, lagres den i local storage*/
  function restartGame() {
    setCards(shuffleCards());
    setAttemptCount(0);
    setMatchCount(0);
    setFlippedCards([]);
    setHasWon(false);
  }

  // Viser bekreftelsesdialog før man forlater spillet
  function confirmExit() {
    setConfirmExit(true);
  }

  // Går tilbake til hovedmenyen og lukker bekreftelsedialogen
  function returnToMainMenu() {
    setIsGameActive(false);
    setConfirmExit(false);
  }

  // HOVEDMENYEN
  if (!isGameActive) {
    return (
      <div className="memory-game__container">
        <div className="memory-game__menu-card">
          <div className="memory-game__menu-header">
            <h1 className="memory-game__menu-title">Memory Game</h1>
            <p className="memory-game__menu-subtitle">Test your memory skills!</p>
          </div>
          <div className="memory-game__menu-actions">
            <button
              className="memory-game__button memory-game__button--primary"
              onClick={startGame}
            >
              Start game
            </button>
            <button
              className="memory-game__button memory-game__button--secondary"
              onClick={() => window.close()}
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SPILLET
  return (
    <div className="memory-game__container">
      {/* Mobilkontroller */}
      <div className="memory-game__mobile-controls">
        <div className="memory-game__menu-actions">
          <button
            className="memory-game__button memory-game__button--secondary"
            onClick={confirmExit}
          >
            Main menu
          </button>
          <button
            className="memory-game__button memory-game__button--primary"
            onClick={restartGame}
          >
            Restart
          </button>
        </div>
      </div>

      <div className="memory-game__game-card">
        {/* Desktop-kontroller */}
        <div className="memory-game__desktop-controls">
          <button
            className="memory-game__button memory-game__button--secondary"
            onClick={confirmExit}
          >
            Main menu
          </button>
          <button
            className="memory-game__button memory-game__button--primary"
            onClick={restartGame}
          >
            Restart
          </button>
        </div>

        {/* Vinnerbeskjed */}
        {hasWon && (
          <div className="memory-game__victory-message">
            <h2>🎉 Congratulations!</h2>
            <p>
              You finished the game in {attemptCount} attempts!
              {highScore === attemptCount && (
                <>
                  <br />
                  <strong>New high score! 🏆</strong>
                </>
              )}
            </p>
            <button
              className="memory-game__button memory-game__button--primary"
              onClick={restartGame}
            >
              Play again
            </button>
          </div>
        )}

        {/* Statistikk */}
        <div className="memory-game__game-header">
          <h1 className="memory-game__game-title">Memory Game</h1>
          <div className="memory-game__stats">
            <div className="memory-game__stat">
              <span className="memory-game__stat-label">Attempts</span>
              <span className="memory-game__stat-value">{attemptCount}</span>
            </div>
            <div className="memory-game__stat">
              <span className="memory-game__stat-label">Matches</span>
              <span className="memory-game__stat-value">
                {matchCount}/{CARD_LETTERS.length}
              </span>
            </div>
            {highScore !== null && (
              <div className="memory-game__stat">
                <span className="memory-game__stat-label">High Score</span>
                <span className="memory-game__stat-value">{highScore}</span>
              </div>
            )}
          </div>
        </div>

        {/* Kort */}
        <div className="memory-game__card-grid">
          {cards.map((card) => (
            <button
              key={card.id}
              className={
                `memory-game__card-item` +
                (card.isFlipped ? " memory-game__card-item--flipped" : "") +
                (card.isMatched ? " memory-game__card-item--matched" : "")
              }
              onClick={() => handleCardClick(card)}
              disabled={
                card.isFlipped || card.isMatched || flippedCards.length === 2
              }
            >
              <div className="memory-game__card-inner">
                <div className="memory-game__card-front">?</div>
                <div className="memory-game__card-back">{card.letter}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bekreftelsesdialog for avslutning */}
      {ConfirmExit && (
        <div className="memory-game__dialog-overlay">
          <div className="memory-game__dialog">
            <h3 className="memory-game__dialog-title">Leave game?</h3>
            <p className="memory-game__dialog-text">
              Are you sure you want to leave? 
            </p>
            <div className="memory-game__dialog-actions">
              <button
                className="memory-game__button memory-game__button--secondary"
                onClick={() => setConfirmExit(false)}
              >
                Cancel
              </button>
              <button
                className="memory-game__button memory-game__button--primary"
                onClick={returnToMainMenu}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

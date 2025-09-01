import React, { useMemo, useEffect, useState } from "react";
import "../styles/PuzzleGame.css";

const puzzleImages = [
  "/images/spiderman.png",
  "/images/Ben10.png",
  "/images/shinchan.png",
  "/images/jackie.png",
  "/images/bheem.png",
];

// localStorage keys
const IMAGE_KEY = "puzzle_imageIndex";
const PROGRESS_KEY = "puzzle_progress";
const LASTCOUNT_KEY = "puzzle_lastCount";

// ✅ Helper function to reset puzzle storage
export const resetPuzzle = () => {
  localStorage.removeItem(IMAGE_KEY);
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(LASTCOUNT_KEY);
};

export default function PuzzleGame({ correctCount = 0 }) {
  const rows = 3;
  const cols = 3;
  const totalPieces = rows * cols; // 9
  const totalImages = puzzleImages.length;

  // Load saved imageIndex or pick a random one at first entry
  const [imageIndex, setImageIndex] = useState(() => {
    const saved = localStorage.getItem(IMAGE_KEY);
    if (saved !== null) return parseInt(saved, 10);
    const rand = Math.floor(Math.random() * totalImages);
    localStorage.setItem(IMAGE_KEY, String(rand));
    return rand;
  });

  // Load saved progress (revealed pieces) or start 0
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  // Baseline of correctCount already processed
  const [lastCount, setLastCount] = useState(() => {
    const saved = localStorage.getItem(LASTCOUNT_KEY);
    return saved !== null ? parseInt(saved, 10) : correctCount;
  });

  // Helper: pick random different image if possible
  const pickRandomDifferent = (current) => {
    if (totalImages <= 1) return current;
    let next = Math.floor(Math.random() * totalImages);
    if (next === current) next = (current + 1) % totalImages;
    return next;
  };

  // React to changes in correctCount
  useEffect(() => {
    if (correctCount <= lastCount) {
      if (correctCount < lastCount) {
        setLastCount(correctCount);
        localStorage.setItem(LASTCOUNT_KEY, String(correctCount));
      }
      return;
    }

    let delta = correctCount - lastCount;
    let newImage = imageIndex;
    let newProgress = progress;

    while (delta > 0) {
      if (newProgress < totalPieces) {
        const reveal = Math.min(delta, totalPieces - newProgress);
        newProgress += reveal;
        delta -= reveal;
      } else {
        newImage = pickRandomDifferent(newImage);
        newProgress = 1;
        delta -= 1;
      }
    }

    setImageIndex(newImage);
    setProgress(newProgress);
    setLastCount(correctCount);

    localStorage.setItem(IMAGE_KEY, String(newImage));
    localStorage.setItem(PROGRESS_KEY, String(newProgress));
    localStorage.setItem(LASTCOUNT_KEY, String(correctCount));
  }, [correctCount, lastCount, imageIndex, progress, totalPieces, totalImages]);

  const tiles = useMemo(
    () => Array.from({ length: totalPieces }, (_, i) => i),
    [totalPieces]
  );

  return (
    <section className="puzzle-section">
      <h3 className="puzzle-title">🧩 Answer correctly to reveal the puzzle!</h3>

      <div
        className="puzzle-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {tiles.map((i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const show = i < progress;

          return (
            <div
              key={i}
              className={`puzzle-tile ${show ? "show" : ""}`}
              style={{
                backgroundImage: show
                  ? `url("${puzzleImages[imageIndex]}")`
                  : "none",
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${(c / (cols - 1)) * 100}% ${
                  (r / (rows - 1)) * 100
                }%`,
                backgroundRepeat: "no-repeat",
              }}
            />
          );
        })}
      </div>

      <div className="puzzle-progress">
        Image {imageIndex + 1} / {totalImages} • Pieces {progress} / {totalPieces}
      </div>
    </section>
  );
}

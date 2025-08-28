import React, { useMemo, useEffect, useState } from "react";
import "../styles/PuzzleGame.css";

const puzzleImages = [
  "/images/spiderman.png",
  "/images/Ben10.png",
 
];

export default function PuzzleGame({ correctCount = 0 }) {
  const rows = 3;
  const cols = 3;
  const totalPieces = rows * cols;
  const totalImages = puzzleImages.length;
  const maxProgress = totalPieces * totalImages;

  const noQuizProgress = !localStorage.getItem("quizProgress");

  const [imageIndex, setImageIndex] = useState(() => {
    if (noQuizProgress) {
      const rand = Math.floor(Math.random() * totalImages);
      localStorage.setItem("imageIndex", String(rand));
      return rand;
    }
    const saved = localStorage.getItem("imageIndex");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [progress, setProgress] = useState(() => {
    if (noQuizProgress) {
      localStorage.setItem("progress", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("progress") || "0", 10);
  });


  useEffect(() => {
    if (correctCount === 0) return; 
    const newProgress = correctCount % maxProgress;
    if (newProgress !== progress) {
      setProgress(newProgress);
      localStorage.setItem("progress", String(newProgress));
    }
  }, [correctCount, maxProgress, progress]);

  
  useEffect(() => {
    if (progress > 0 && progress % totalPieces === 0) {
      const next = (imageIndex + 1) % totalImages;
      setImageIndex(next);
      localStorage.setItem("imageIndex", String(next));
    }
  }, [progress, totalPieces, imageIndex, totalImages]);



  const piecesForThisImage =
    progress % totalPieces === 0 ? (progress > 0 ? totalPieces : 0) : (progress % totalPieces);

  const tiles = useMemo(
    () => Array.from({ length: totalPieces }, (_, i) => i),
    [totalPieces]
  );

  return (
    <section className="puzzle-section">
      <h3 className="puzzle-title">🧩 Puzzle Challenge</h3>

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
          const show = i < piecesForThisImage;

          return (
            <div
              key={i}
              className={`puzzle-tile ${show ? "show" : ""}`}
              style={{
                backgroundImage: show ? `url("${puzzleImages[imageIndex]}")` : "none",
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${(c / (cols - 1)) * 100}% ${(r / (rows - 1)) * 100}%`,
                backgroundRepeat: "no-repeat",
              }}
            />
          );
        })}
      </div>

      <div className="puzzle-progress">
        Image {imageIndex + 1} / {totalImages} • Pieces {piecesForThisImage} / {totalPieces}
      </div>
    </section>
  );
}

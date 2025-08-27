import React, { useState, useEffect } from "react";

const GRID_SIZE = 9; 

const PuzzleGame = ({ topic, difficulty }) => {
  const [image, setImage] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [emptyIndex, setEmptyIndex] = useState(GRID_SIZE * GRID_SIZE - 1);

  const fetchImage = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/generate-image?topic=${topic}&difficulty=${difficulty}`
      );
      const data = await res.json();
      setImage(data.dataUrl);
    } catch (err) {
      console.error("Image fetch error:", err);
    }
  };

  
  useEffect(() => {
    if (!image) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      const tileSize = img.width / GRID_SIZE;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const newTiles = [];

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          canvas.width = tileSize;
          canvas.height = tileSize;
          ctx.drawImage(
            img,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
            0,
            0,
            tileSize,
            tileSize
          );
          const piece = canvas.toDataURL();
          newTiles.push(piece);
        }
      }


      newTiles[newTiles.length - 1] = null;
      setTiles(shuffle(newTiles));
    };
  }, [image]);

  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  
  const handleTileClick = (index) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;

    const isAdjacent =
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1);

    if (isAdjacent) {
      const newTiles = [...tiles];
      newTiles[emptyIndex] = newTiles[index];
      newTiles[index] = null;
      setTiles(newTiles);
      setEmptyIndex(index);
    }
  };

  return (
    <div>
      <h2>9x9 Sliding Puzzle - {topic}</h2>
      {!image && (
        <button onClick={fetchImage}>🎨 Generate Puzzle Image</button>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          width: "450px",
          height: "450px",
          border: "2px solid black",
          marginTop: "20px",
        }}
      >
        {tiles.map((tile, i) => (
          <div
            key={i}
            onClick={() => handleTileClick(i)}
            style={{
              backgroundImage: tile ? `url(${tile})` : "none",
              backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
              border: "1px solid #ccc",
              cursor: tile ? "pointer" : "default",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PuzzleGame;

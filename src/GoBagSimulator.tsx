import { useCallback, useEffect, useMemo, useState } from "react";
import characterFemaleOne from "./assets/game/character-female-1.png";
import characterMaleOne from "./assets/game/character-male-1.png";
import characterNeonFemaleOne from "./assets/game/character-neon-female-1.png";
import characterNeonFemaleTwo from "./assets/game/character-neon-female-2.png";
import characterNeonMaleOne from "./assets/game/character-neon-male-1.png";
import characterNeonMaleTwo from "./assets/game/character-neon-male-2.png";

type ModuleKey =
  | "home"
  | "am-i-crazy"
  | "go-bag-prep"
  | "planning"
  | "leaving"
  | "rebuilding"
  | "local-help"
  | "legal";

type Character = {
  id: string;
  label: string;
  image: string;
};

type RoomKey = "living" | "kitchen" | "bedroom" | "bathroom";

type Rect = {
  h: number;
  w: number;
  x: number;
  y: number;
};

type Item = {
  id: string;
  icon: string;
  label: string;
  required: boolean;
  room: RoomKey;
  x: number;
  y: number;
};

type Room = {
  furniture: Array<Rect & { label: string }>;
  key: RoomKey;
  name: string;
};

const stageWidth = 640;
const stageHeight = 420;
const playerSize = 34;

const characters: Character[] = [
  { id: "neon-male-1", label: "Runner 01", image: characterNeonMaleOne },
  { id: "neon-female-1", label: "Runner 02", image: characterNeonFemaleOne },
  { id: "neon-female-2", label: "Runner 03", image: characterNeonFemaleTwo },
  { id: "neon-male-2", label: "Runner 04", image: characterNeonMaleTwo },
  { id: "male-1", label: "Runner 05", image: characterMaleOne },
  { id: "female-1", label: "Runner 06", image: characterFemaleOne },
];

const rooms: Record<RoomKey, Room> = {
  living: {
    key: "living",
    name: "Living Room",
    furniture: [
      { label: "Couch", x: 54, y: 70, w: 190, h: 68 },
      { label: "Side Table", x: 280, y: 78, w: 74, h: 58 },
      { label: "Shelf", x: 502, y: 48, w: 86, h: 92 },
      { label: "Front Door", x: 278, y: 350, w: 84, h: 42 },
    ],
  },
  kitchen: {
    key: "kitchen",
    name: "Kitchen",
    furniture: [
      { label: "Counter", x: 64, y: 76, w: 208, h: 58 },
      { label: "Fridge", x: 476, y: 62, w: 80, h: 110 },
      { label: "Cabinet", x: 88, y: 280, w: 154, h: 64 },
      { label: "Pantry", x: 420, y: 278, w: 118, h: 72 },
    ],
  },
  bedroom: {
    key: "bedroom",
    name: "Bedroom",
    furniture: [
      { label: "Bed", x: 54, y: 70, w: 196, h: 118 },
      { label: "Dresser", x: 426, y: 72, w: 120, h: 72 },
      { label: "Closet", x: 438, y: 278, w: 128, h: 72 },
      { label: "Nightstand", x: 286, y: 102, w: 62, h: 52 },
    ],
  },
  bathroom: {
    key: "bathroom",
    name: "Bathroom",
    furniture: [
      { label: "Sink", x: 76, y: 78, w: 110, h: 64 },
      { label: "Medicine Cabinet", x: 430, y: 72, w: 112, h: 64 },
      { label: "Tub", x: 82, y: 264, w: 210, h: 82 },
      { label: "Towel Rack", x: 428, y: 284, w: 126, h: 42 },
    ],
  },
};

const items: Item[] = [
  { id: "bag", label: "Go-Bag", icon: "BAG", required: true, room: "bedroom", x: 368, y: 310 },
  { id: "medication", label: "Medication", icon: "MED", required: true, room: "bathroom", x: 484, y: 164 },
  { id: "charger", label: "Phone Charger", icon: "CHG", required: true, room: "living", x: 540, y: 174 },
  { id: "phone", label: "Phone", icon: "PHN", required: true, room: "bedroom", x: 312, y: 180 },
  { id: "keys", label: "Keys", icon: "KEY", required: true, room: "living", x: 318, y: 164 },
  { id: "identification", label: "Identification", icon: "ID", required: true, room: "bedroom", x: 468, y: 166 },
  { id: "documents", label: "Documents Folder", icon: "DOC", required: true, room: "bedroom", x: 522, y: 246 },
  { id: "clothes", label: "Change Of Clothes", icon: "CLO", required: true, room: "bedroom", x: 492, y: 372 },
  { id: "hygiene", label: "Hygiene Supplies", icon: "HYG", required: true, room: "bathroom", x: 496, y: 344 },
  { id: "water", label: "Water Bottle", icon: "H2O", required: true, room: "kitchen", x: 510, y: 210 },
  { id: "wallet", label: "Wallet Or Cash", icon: "CASH", required: true, room: "living", x: 120, y: 194 },
  { id: "glasses", label: "Glasses Or Medical Item", icon: "MED2", required: false, room: "bathroom", x: 146, y: 176 },
  { id: "pet", label: "Pet Supplies", icon: "PET", required: false, room: "kitchen", x: 170, y: 226 },
  { id: "child", label: "Child Supplies", icon: "KID", required: false, room: "living", x: 214, y: 306 },
];

const requiredItemIds = items.filter((item) => item.required).map((item) => item.id);

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function roomEntry(from: RoomKey, to: RoomKey) {
  if (from === "living" && to === "kitchen") return { x: 38, y: 210 };
  if (from === "kitchen" && to === "living") return { x: 568, y: 210 };
  if (from === "living" && to === "bedroom") return { x: 320, y: 36 };
  if (from === "bedroom" && to === "living") return { x: 320, y: 346 };
  if (from === "bedroom" && to === "bathroom") return { x: 42, y: 210 };
  return { x: 556, y: 210 };
}

function nextRoom(room: RoomKey, x: number, y: number): RoomKey | null {
  if (room === "living" && x > stageWidth - playerSize - 4 && y > 150 && y < 270) return "kitchen";
  if (room === "living" && y > stageHeight - playerSize - 4 && x > 252 && x < 388) return "bedroom";
  if (room === "kitchen" && x < 4 && y > 150 && y < 270) return "living";
  if (room === "bedroom" && y < 4 && x > 252 && x < 388) return "living";
  if (room === "bedroom" && x > stageWidth - playerSize - 4 && y > 150 && y < 270) return "bathroom";
  if (room === "bathroom" && x < 4 && y > 150 && y < 270) return "bedroom";
  return null;
}

function GoBagSimulator({
  onNavigate,
  onQuickExit,
}: {
  onNavigate: (module: ModuleKey, path: string) => void;
  onQuickExit: () => void;
}) {
  const [screen, setScreen] = useState<"intro" | "how" | "select" | "loading" | "play" | "pause" | "complete" | "review">("intro");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [room, setRoom] = useState<RoomKey>("living");
  const [position, setPosition] = useState({ x: 310, y: 214 });
  const [direction, setDirection] = useState<"down" | "left" | "right" | "up">("down");
  const [collected, setCollected] = useState<string[]>([]);
  const [message, setMessage] = useState("OBJECTIVE: FIND THE GO-BAG.");

  const collectedSet = useMemo(() => new Set(collected), [collected]);
  const currentRoom = rooms[room];
  const nearbyItem = items.find(
    (item) => item.room === room && !collectedSet.has(item.id) && distance(position, item) < 48,
  );
  const requiredCollected = requiredItemIds.filter((id) => collectedSet.has(id)).length;
  const selectedPortrait = selectedCharacter?.image ?? characters[0].image;

  function resetGame() {
    setRoom("living");
    setPosition({ x: 310, y: 214 });
    setDirection("down");
    setCollected([]);
    setMessage("OBJECTIVE: FIND THE GO-BAG.");
  }

  function clearAndExit() {
    resetGame();
    setSelectedCharacter(null);
    onQuickExit();
  }

  function selectCharacter(character: Character) {
    setSelectedCharacter(character);
  }

  function confirmCharacter() {
    if (!selectedCharacter) return;
    setScreen("loading");
    window.setTimeout(() => {
      resetGame();
      setScreen("play");
      setMessage("CHARACTER SELECTED. ENTERING: LIVING ROOM.");
    }, 520);
  }

  const interact = useCallback(() => {
    if (screen !== "play" || !nearbyItem) return;
    if (nearbyItem.id !== "bag" && !collectedSet.has("bag")) {
      setMessage("GO-BAG REQUIRED. LOCATE A BAG BEFORE COLLECTING ADDITIONAL ITEMS.");
      return;
    }
    setCollected((current) => (current.includes(nearbyItem.id) ? current : [...current, nearbyItem.id]));
    setMessage(`${nearbyItem.label.toUpperCase()} ADDED TO BAG.`);
  }, [collectedSet, nearbyItem, screen]);

  const move = useCallback(
    (dx: number, dy: number) => {
      if (screen !== "play") return;
      if (dx < 0) setDirection("left");
      if (dx > 0) setDirection("right");
      if (dy < 0) setDirection("up");
      if (dy > 0) setDirection("down");

      const candidate = {
        x: Math.max(0, Math.min(stageWidth - playerSize, position.x + dx)),
        y: Math.max(0, Math.min(stageHeight - playerSize, position.y + dy)),
      };
      const route = nextRoom(room, candidate.x, candidate.y);
      if (route) {
        setRoom(route);
        setPosition(roomEntry(room, route));
        setMessage(`ENTERING: ${rooms[route].name.toUpperCase()}.`);
        return;
      }

      const playerBox = { x: candidate.x, y: candidate.y, w: playerSize, h: playerSize };
      const blocked = currentRoom.furniture.some((piece) => intersects(playerBox, piece));
      if (!blocked) {
        setPosition(candidate);
      }
    },
    [currentRoom.furniture, position, room, screen],
  );

  useEffect(() => {
    if (requiredCollected === requiredItemIds.length && screen === "play") {
      setScreen("complete");
      setMessage("GO-BAG READY. CORE ITEMS COLLECTED. SIMULATION COMPLETE.");
    }
  }, [requiredCollected, screen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (screen !== "play") return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === "ArrowUp") move(0, -18);
      if (event.key === "ArrowDown") move(0, 18);
      if (event.key === "ArrowLeft") move(-18, 0);
      if (event.key === "ArrowRight") move(18, 0);
      if (event.key === "Enter") interact();
      if (event.key === "Escape") setScreen("pause");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [interact, move, screen]);

  if (screen === "intro") {
    return (
      <section className="simulator-shell">
        <div className="terminal-label">GO-BAG SIMULATOR</div>
        <h1>OBJECTIVE: GATHER ESSENTIAL ITEMS.</h1>
        <p>SESSION DATA: TEMPORARY. NO INFORMATION WILL BE SAVED.</p>
        <div className="terminal-actions denial-actions">
          <button type="button" onClick={() => setScreen("select")}>Start Simulator</button>
          <button type="button" onClick={() => setScreen("how")}>How To Play</button>
          <button type="button" onClick={() => onNavigate("planning", "/planning")}>Back To Exit Planning</button>
          <button type="button" onClick={clearAndExit}>Quick Exit</button>
        </div>
      </section>
    );
  }

  if (screen === "how") {
    return (
      <section className="simulator-shell">
        <div className="terminal-label">HOW TO PLAY</div>
        <h1>ARCADE CONTROLS</h1>
        <ul className="simulator-list">
          <li>Arrow keys: move through rooms.</li>
          <li>Enter: collect an item when detected.</li>
          <li>Escape: pause.</li>
          <li>Find the Go-Bag before collecting additional items.</li>
          <li>Touch controls appear below the game screen on mobile.</li>
        </ul>
        <div className="terminal-actions compact-actions">
          <button type="button" onClick={() => setScreen("select")}>Choose Character</button>
          <button type="button" onClick={() => setScreen("intro")}>Go Back</button>
          <button type="button" onClick={clearAndExit}>Quick Exit</button>
        </div>
      </section>
    );
  }

  if (screen === "select") {
    return (
      <section className="simulator-shell">
        <div className="terminal-label">CHARACTER SELECT</div>
        <h1>SELECT RUNNER</h1>
        <div className="character-grid">
          {characters.map((character) => (
            <button
              aria-pressed={selectedCharacter?.id === character.id}
              className={selectedCharacter?.id === character.id ? "character-card selected" : "character-card"}
              key={character.id}
              type="button"
              onClick={() => selectCharacter(character)}
            >
              <img src={character.image} alt="" />
              <span>{character.label}</span>
            </button>
          ))}
        </div>
        <div className="terminal-actions compact-actions">
          <button disabled={!selectedCharacter} type="button" onClick={confirmCharacter}>Select Character</button>
          <button type="button" onClick={() => setScreen("intro")}>Back</button>
          <button type="button" onClick={clearAndExit}>Quick Exit</button>
        </div>
      </section>
    );
  }

  if (screen === "loading") {
    return (
      <section className="simulator-shell">
        <div className="module-loading">
          <p>CHARACTER SELECTED.</p>
          <p>LOADING HOME ENVIRONMENT...</p>
          <p>SESSION MEMORY ONLY</p>
        </div>
      </section>
    );
  }

  if (screen === "complete" || screen === "review") {
    const collectedItems = items.filter((item) => collectedSet.has(item.id));
    return (
      <section className="simulator-shell">
        <div className="terminal-label">{screen === "review" ? "COLLECTED ITEMS" : "SIMULATION COMPLETE"}</div>
        <h1>{screen === "review" ? "BAG CONTENTS REVIEW" : "GO-BAG READY."}</h1>
        <p>
          {screen === "review"
            ? "This temporary summary exists only on this screen."
            : "YOU DO NOT NEED A PERFECT BAG. YOU NEED ENOUGH TO CREATE DISTANCE, TIME, AND OPTIONS."}
        </p>
        <div className="inventory-review">
          {collectedItems.map((item) => (
            <span key={item.id}>{item.icon} {item.label}</span>
          ))}
        </div>
        <div className="terminal-actions denial-actions">
          <button type="button" onClick={() => setScreen("review")}>Review Collected Items</button>
          <button type="button" onClick={() => { resetGame(); setScreen("play"); }}>Play Again</button>
          <button type="button" onClick={() => onNavigate("planning", "/planning")}>Return To Exit Planning</button>
          <button type="button" onClick={() => onNavigate("leaving", "/leaving")}>Show Go-Bag Resources</button>
          <button type="button" onClick={() => { resetGame(); setScreen("intro"); }}>Clear Session</button>
          <button type="button" onClick={clearAndExit}>Quick Exit</button>
        </div>
      </section>
    );
  }

  return (
    <section className="simulator-shell">
      <SimulatorHud
        collectedCount={collected.length}
        message={message}
        onPause={() => setScreen("pause")}
        onQuickExit={clearAndExit}
        portrait={selectedPortrait}
        roomName={currentRoom.name}
      />

      {screen === "pause" ? (
        <div className="pause-panel">
          <h1>SIMULATOR PAUSED</h1>
          <div className="terminal-actions compact-actions">
            <button type="button" onClick={() => setScreen("play")}>Resume</button>
            <button type="button" onClick={() => { resetGame(); setScreen("intro"); }}>Clear Session</button>
            <button type="button" onClick={clearAndExit}>Quick Exit</button>
          </div>
        </div>
      ) : (
        <>
          <div className="game-stage" aria-label={`${currentRoom.name} game scene`} tabIndex={0}>
            <div className={`room-floor ${room}`}>
              {currentRoom.furniture.map((piece) => (
                <div className="furniture" key={piece.label} style={{ height: piece.h, left: piece.x, top: piece.y, width: piece.w }}>
                  {piece.label}
                </div>
              ))}
              {items
                .filter((item) => item.room === room && !collectedSet.has(item.id))
                .map((item) => (
                  <div className={nearbyItem?.id === item.id ? "collectible nearby" : "collectible"} key={item.id} style={{ left: item.x, top: item.y }}>
                    {item.icon}
                  </div>
                ))}
              <div className={`player-sprite ${direction}`} style={{ left: position.x, top: position.y }}>
                <span />
              </div>
            </div>
            <div className="door-labels" aria-hidden="true">
              <span>{room === "kitchen" || room === "bathroom" ? "WEST DOOR" : "EAST/SOUTH DOORS"}</span>
            </div>
          </div>
          <div className="interaction-feed" aria-live="polite">
            {nearbyItem ? (
              <p>ITEM DETECTED: {nearbyItem.label.toUpperCase()} - PRESS ENTER TO COLLECT</p>
            ) : (
              <p>{message}</p>
            )}
          </div>
          <InventoryPanel collected={collectedSet} />
          <GameControls interact={interact} move={move} pause={() => setScreen("pause")} />
        </>
      )}
    </section>
  );
}

function SimulatorHud({
  collectedCount,
  message,
  onPause,
  onQuickExit,
  portrait,
  roomName,
}: {
  collectedCount: number;
  message: string;
  onPause: () => void;
  onQuickExit: () => void;
  portrait: string;
  roomName: string;
}) {
  return (
    <header className="simulator-hud">
      <img src={portrait} alt="" />
      <div>
        <span>ROOM: {roomName.toUpperCase()}</span>
        <span>ITEMS: {collectedCount} / {items.length}</span>
        <span>{message}</span>
      </div>
      <button type="button" onClick={onPause}>Pause</button>
      <button type="button" onClick={onQuickExit}>Quick Exit</button>
    </header>
  );
}

function InventoryPanel({ collected }: { collected: Set<string> }) {
  return (
    <aside className="inventory-panel" aria-label="Inventory">
      <h2>Inventory</h2>
      <div>
        {items.map((item) => (
          <span className={collected.has(item.id) ? "packed" : ""} key={item.id}>
            {item.icon}
          </span>
        ))}
      </div>
    </aside>
  );
}

function GameControls({
  interact,
  move,
  pause,
}: {
  interact: () => void;
  move: (dx: number, dy: number) => void;
  pause: () => void;
}) {
  return (
    <div className="game-controls" aria-label="Touch game controls">
      <button aria-label="Move up" type="button" onClick={() => move(0, -18)}>UP</button>
      <button aria-label="Move left" type="button" onClick={() => move(-18, 0)}>LEFT</button>
      <button aria-label="Pick up item" type="button" onClick={interact}>PICK UP</button>
      <button aria-label="Move right" type="button" onClick={() => move(18, 0)}>RIGHT</button>
      <button aria-label="Move down" type="button" onClick={() => move(0, 18)}>DOWN</button>
      <button aria-label="Pause simulator" type="button" onClick={pause}>PAUSE</button>
    </div>
  );
}

export default GoBagSimulator;

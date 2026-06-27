import { type CSSProperties, useEffect, useMemo, useState } from "react";
import characterFemaleOne from "./assets/game/character-female-1.png";
import characterMaleOne from "./assets/game/character-male-1.png";
import characterNeonFemaleOne from "./assets/game/character-neon-female-1.png";
import characterNeonFemaleTwo from "./assets/game/character-neon-female-2.png";
import characterNeonMaleOne from "./assets/game/character-neon-male-1.png";
import characterNeonMaleTwo from "./assets/game/character-neon-male-2.png";
import roomBathroom from "./assets/game/room-bathroom.png";
import roomBedroom from "./assets/game/room-bedroom.png";
import roomKitchen from "./assets/game/room-kitchen.png";
import roomLiving from "./assets/game/room-living.png";

type ModuleKey =
  | "home"
  | "am-i-crazy"
  | "go-bag-prep"
  | "planning"
  | "leaving"
  | "rebuilding"
  | "local-help"
  | "legal";

type GaugeValue = {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  state: string;
  tone: "cyan" | "pink" | "purple";
};

type ControlPanelState = {
  emphasis: string | null;
  gauges: GaugeValue[];
  notice: string;
};

type Character = {
  id: string;
  label: string;
  image: string;
};

type RoomKey = "living" | "kitchen" | "bedroom" | "bathroom";

type Item = {
  id: string;
  icon: string;
  label: string;
  required: boolean;
  room: RoomKey;
  size?: "large" | "medium" | "small";
  x: number;
  y: number;
};

type Room = {
  background: string;
  key: RoomKey;
  name: string;
};

const characters: Character[] = [
  { id: "neon-male-1", label: "Runner 01", image: characterNeonMaleOne },
  { id: "neon-female-1", label: "Runner 02", image: characterNeonFemaleOne },
  { id: "neon-female-2", label: "Runner 03", image: characterNeonFemaleTwo },
  { id: "neon-male-2", label: "Runner 04", image: characterNeonMaleTwo },
  { id: "male-1", label: "Runner 05", image: characterMaleOne },
  { id: "female-1", label: "Runner 06", image: characterFemaleOne },
];

const rooms: Record<RoomKey, Room> = {
  living: { background: roomLiving, key: "living", name: "Living Room" },
  kitchen: { background: roomKitchen, key: "kitchen", name: "Kitchen" },
  bedroom: { background: roomBedroom, key: "bedroom", name: "Bedroom" },
  bathroom: { background: roomBathroom, key: "bathroom", name: "Bathroom" },
};

const roomLinks: Record<RoomKey, RoomKey[]> = {
  living: ["kitchen", "bedroom"],
  kitchen: ["living"],
  bedroom: ["living", "bathroom"],
  bathroom: ["bedroom"],
};

const items: Item[] = [
  { id: "bag", label: "Go-Bag", icon: "BAG", required: true, room: "bedroom", size: "large", x: 16, y: 70 },
  { id: "medication", label: "Medication", icon: "MED", required: true, room: "bathroom", x: 38, y: 69 },
  { id: "charger", label: "Phone Charger", icon: "CHG", required: true, room: "living", x: 74, y: 36 },
  { id: "phone", label: "Phone", icon: "PHN", required: true, room: "bedroom", x: 19, y: 38 },
  { id: "keys", label: "Keys", icon: "KEY", required: true, room: "living", x: 44, y: 55 },
  { id: "identification", label: "Identification", icon: "ID", required: true, room: "bedroom", size: "medium", x: 42, y: 72 },
  { id: "documents", label: "Documents Folder", icon: "DOC", required: true, room: "bedroom", size: "medium", x: 48, y: 72 },
  { id: "clothes", label: "Change Of Clothes", icon: "CLO", required: true, room: "bedroom", size: "large", x: 68, y: 70 },
  { id: "hygiene", label: "Hygiene Supplies", icon: "HYG", required: true, room: "bathroom", x: 74, y: 49 },
  { id: "water", label: "Water Bottle", icon: "H2O", required: true, room: "kitchen", size: "medium", x: 24, y: 57 },
  { id: "wallet", label: "Wallet Or Cash", icon: "CASH", required: true, room: "living", x: 42, y: 58 },
  { id: "glasses", label: "Glasses Or Medical Item", icon: "MED2", required: false, room: "bathroom", x: 30, y: 41 },
  { id: "pet", label: "Pet Supplies", icon: "PET", required: false, room: "kitchen", x: 31, y: 57 },
  { id: "child", label: "Child Supplies", icon: "KID", required: false, room: "living", x: 35, y: 74 },
];

const requiredItemIds = items.filter((item) => item.required).map((item) => item.id);
const inventorySlots = [
  { x: 83.1, y: 18.9 },
  { x: 88.3, y: 18.9 },
  { x: 93.5, y: 18.9 },
  { x: 83.1, y: 28.4 },
  { x: 88.3, y: 28.4 },
  { x: 93.5, y: 28.4 },
  { x: 83.1, y: 38 },
  { x: 88.3, y: 38 },
  { x: 93.5, y: 38 },
];

function gameGaugeValues(collected: Set<string>, screen: string): GaugeValue[] {
  const requiredCollected = requiredItemIds.filter((id) => collected.has(id)).length;
  const coreProgress = Math.round((requiredCollected / requiredItemIds.length) * 100);
  const bagProgress = collected.has("bag") ? 100 : 0;
  const readyProgress = screen === "complete" ? 100 : coreProgress >= 100 ? 92 : Math.max(12, coreProgress - 8);

  return [
    {
      label: "CORE ITEMS",
      value: coreProgress,
      lowLabel: "EMPTY",
      highLabel: "PACKED",
      state: `${requiredCollected}/${requiredItemIds.length} REQUIRED`,
      tone: "cyan",
    },
    {
      label: "BAG STATUS",
      value: bagProgress,
      lowLabel: "NEEDED",
      highLabel: "FOUND",
      state: collected.has("bag") ? "GO-BAG FOUND" : "LOCATE BAG FIRST",
      tone: "pink",
    },
    {
      label: "READY SIGNAL",
      value: readyProgress,
      lowLabel: "WAIT",
      highLabel: "READY",
      state: screen === "complete" ? "READY TO GO" : coreProgress >= 100 ? "CONFIRM EXIT" : "SEARCHING",
      tone: "purple",
    },
  ];
}

function GoBagSimulator({
  onControlPanelChange,
  onNavigate,
  onQuickExit,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
  onQuickExit: () => void;
}) {
  const [screen, setScreen] = useState<"intro" | "how" | "select" | "loading" | "play" | "pause" | "complete" | "review">("intro");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [room, setRoom] = useState<RoomKey>("living");
  const [collected, setCollected] = useState<string[]>([]);
  const [message, setMessage] = useState("OBJECTIVE: FIND THE GO-BAG.");

  const collectedSet = useMemo(() => new Set(collected), [collected]);
  const currentRoom = rooms[room];
  const requiredCollected = requiredItemIds.filter((id) => collectedSet.has(id)).length;
  const selectedPortrait = selectedCharacter?.image ?? characters[0].image;

  useEffect(() => {
    onControlPanelChange({
      emphasis:
        screen === "complete"
          ? "READY SIGNAL"
          : collectedSet.has("bag")
            ? "CORE ITEMS"
            : "BAG STATUS",
      gauges: gameGaugeValues(collectedSet, screen),
      notice: message,
    });
  }, [collectedSet, message, onControlPanelChange, screen]);

  useEffect(() => {
    if (requiredCollected === requiredItemIds.length && screen === "play") {
      setScreen("complete");
      setMessage("GO-BAG READY. CORE ITEMS COLLECTED. SELECT I'M READY TO GO WHEN YOU WANT THE NEXT PLANNING PROMPT.");
    }
  }, [requiredCollected, screen]);

  function resetGame() {
    setRoom("living");
    setCollected([]);
    setMessage("OBJECTIVE: FIND THE GO-BAG.");
  }

  function clearAndExit() {
    resetGame();
    setSelectedCharacter(null);
    onQuickExit();
  }

  function confirmCharacter() {
    if (!selectedCharacter) return;
    setScreen("loading");
    window.setTimeout(() => {
      resetGame();
      setScreen("play");
      setMessage("CHARACTER SELECTED. ENTERING: LIVING ROOM. CLICK ITEMS TO ADD THEM TO YOUR BAG.");
    }, 520);
  }

  function enterRoom(nextRoom: RoomKey) {
    setRoom(nextRoom);
    setMessage(`ENTERING: ${rooms[nextRoom].name.toUpperCase()}. SEARCH THE ROOM AND CLICK USEFUL ITEMS.`);
  }

  function collectItem(item: Item) {
    if (item.id !== "bag" && !collectedSet.has("bag")) {
      setMessage("GO-BAG REQUIRED. LOCATE A BAG BEFORE COLLECTING ADDITIONAL ITEMS.");
      return;
    }

    setCollected((current) => (current.includes(item.id) ? current : [...current, item.id]));
    setMessage(`${item.label.toUpperCase()} ADDED TO BAG. SYSTEM CHECK UPDATED.`);
  }

  const collectedItems = items.filter((item) => collectedSet.has(item.id));
  const roomItems = items.filter((item) => item.room === room && !collectedSet.has(item.id));

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
        <h1>OREGON TRAIL MODE</h1>
        <ul className="simulator-list">
          <li>Choose a room, then click items to add them to your Go-Bag.</li>
          <li>Find the Go-Bag before collecting additional items.</li>
          <li>Each action updates the system comms in the COMMAND CENTER.</li>
          <li>The simulator keeps this session temporary and browser-only.</li>
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
              onClick={() => setSelectedCharacter(character)}
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
          <button
            type="button"
            onClick={() => {
              setMessage("READY SIGNAL CONFIRMED. LOADING NEXT PLANNING PROMPT.");
              onNavigate("planning", "/planning");
            }}
          >
            I'm Ready To Go
          </button>
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
          <div className="game-stage" aria-label={`${currentRoom.name} game scene`}>
            <div className={`room-floor ${room}`} style={{ backgroundImage: `url(${currentRoom.background})` }}>
              {roomItems.map((item) => (
                <button
                  aria-label={`Add ${item.label} to Go-Bag`}
                  className={`collectible ${item.required ? "required" : "optional"} ${item.size ?? "small"}`}
                  key={item.id}
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  title={item.label}
                  type="button"
                  onClick={() => collectItem(item)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
              <SceneInventory collectedItems={collectedItems} />
              <SceneStatus collectedCount={collected.length} requiredCollected={requiredCollected} />
            </div>
          </div>
          <div className="room-nav" aria-label="Room navigation">
            <span>ROOM PATHS</span>
            {roomLinks[room].map((linkedRoom) => (
              <button key={linkedRoom} type="button" onClick={() => enterRoom(linkedRoom)}>
                Go To {rooms[linkedRoom].name}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SimulatorHud({
  collectedCount,
  onPause,
  onQuickExit,
  portrait,
  roomName,
}: {
  collectedCount: number;
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
        <span>CLICK ITEMS. SYSTEM COMMS PRINT BELOW.</span>
      </div>
      <button type="button" onClick={onPause}>Pause</button>
      <button type="button" onClick={onQuickExit}>Quick Exit</button>
    </header>
  );
}

function SceneInventory({ collectedItems }: { collectedItems: Item[] }) {
  const visibleItems = collectedItems.slice(0, inventorySlots.length);
  const overflowCount = Math.max(0, collectedItems.length - inventorySlots.length);

  return (
    <div className="scene-inventory" aria-label="Items added to Go-Bag">
      {inventorySlots.map((slot, index) => (
        <span
          aria-hidden="true"
          className="scene-inventory-slot"
          key={`${slot.x}-${slot.y}-${index}`}
          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
        />
      ))}
      {visibleItems.map((item, index) => {
        const slot = inventorySlots[index];
        return (
          <span
            className="scene-inventory-item"
            key={item.id}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            title={item.label}
          >
            {item.icon}
          </span>
        );
      })}
      {overflowCount > 0 && (
        <span className="scene-inventory-overflow" style={{ left: "93.5%", top: "38%" }}>
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

function SceneStatus({
  collectedCount,
  requiredCollected,
}: {
  collectedCount: number;
  requiredCollected: number;
}) {
  const requiredPercent = Math.round((requiredCollected / requiredItemIds.length) * 100);
  const bagPercent = Math.round((collectedCount / items.length) * 100);

  return (
    <div className="scene-status" aria-hidden="true">
      <span className="scene-status-bar time" style={{ "--status-fill": "72%" } as CSSProperties} />
      <span className="scene-status-bar bag" style={{ "--status-fill": `${bagPercent}%` } as CSSProperties} />
      <span className="scene-status-bar energy" style={{ "--status-fill": "64%" } as CSSProperties} />
      <span className="scene-status-bar options" style={{ "--status-fill": `${requiredPercent}%` } as CSSProperties} />
    </div>
  );
}

export default GoBagSimulator;

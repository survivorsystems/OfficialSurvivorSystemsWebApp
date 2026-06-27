import { useEffect, useMemo, useState } from "react";
import goBag from "./assets/game/items/go-bag.svg";
import hairBrush from "./assets/game/items/hair-brush.svg";
import clothesBag from "./assets/game/items/clothes-bag.svg";
import importantDocuments from "./assets/game/items/important-documents.svg";
import keys from "./assets/game/items/keys.svg";
import medicineBottle from "./assets/game/items/medicine-bottle.svg";
import phoneCharger from "./assets/game/items/phone-charger.svg";
import phone from "./assets/game/items/phone.svg";
import snack from "./assets/game/items/snack.svg";
import toiletryBag from "./assets/game/items/toiletry-bag.svg";
import wallet from "./assets/game/items/wallet.svg";
import waterBottle from "./assets/game/items/water-bottle.svg";
import bathroomRoom from "./assets/game/room-bathroom.png";
import bedroomRoom from "./assets/game/room-bedroom.png";
import kitchenRoom from "./assets/game/room-kitchen.png";
import livingRoom from "./assets/game/room-living.png";

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

type RoomKey = "living" | "kitchen" | "bedroom" | "bathroom";

type Item = {
  id: string;
  icon: string;
  image: string;
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

const rooms: Record<RoomKey, Room> = {
  living: { background: livingRoom, key: "living", name: "Living Room" },
  kitchen: { background: kitchenRoom, key: "kitchen", name: "Kitchen" },
  bedroom: { background: bedroomRoom, key: "bedroom", name: "Bedroom" },
  bathroom: { background: bathroomRoom, key: "bathroom", name: "Bathroom" },
};

const roomLinks: Record<RoomKey, RoomKey[]> = {
  living: ["kitchen", "bedroom"],
  kitchen: ["living"],
  bedroom: ["living", "bathroom"],
  bathroom: ["bedroom"],
};

const items: Item[] = [
  { id: "keys", label: "Keys", icon: "KEY", image: keys, required: true, room: "living", x: 43, y: 61 },
  { id: "wallet", label: "Wallet", icon: "CASH", image: wallet, required: true, room: "living", x: 51, y: 58 },
  { id: "phone", label: "Phone", icon: "PHN", image: phone, required: true, room: "living", x: 61, y: 61 },
  { id: "bag", label: "Go-Bag", icon: "BAG", image: goBag, required: true, room: "bedroom", size: "large", x: 16, y: 70 },
  {
    id: "documents",
    label: "Important Documents",
    icon: "DOC",
    image: importantDocuments,
    required: true,
    room: "bedroom",
    size: "medium",
    x: 46,
    y: 72,
  },
  { id: "charger", label: "Phone Charger", icon: "CHG", image: phoneCharger, required: true, room: "bedroom", x: 62, y: 69 },
  { id: "clothes", label: "Bag Of Clothes", icon: "CLO", image: clothesBag, required: true, room: "bedroom", size: "large", x: 70, y: 70 },
  { id: "medication", label: "Medicine Bottle", icon: "MED", image: medicineBottle, required: true, room: "bathroom", x: 34, y: 72 },
  { id: "brush", label: "Hair Brush", icon: "BRU", image: hairBrush, required: true, room: "bathroom", x: 45, y: 72 },
  { id: "toiletry", label: "Toiletry Bag", icon: "KIT", image: toiletryBag, required: true, room: "bathroom", size: "medium", x: 74, y: 56 },
  { id: "water", label: "Water Bottle", icon: "H2O", image: waterBottle, required: true, room: "kitchen", size: "medium", x: 24, y: 57 },
  { id: "snack", label: "Snack", icon: "SNK", image: snack, required: true, room: "kitchen", x: 36, y: 59 },
];

const requiredItemIds = items.filter((item) => item.required).map((item) => item.id);
const inventorySlots = Array.from({ length: 12 }, (_, index) => index);

function gameGaugeValues(collected: Set<string>, screen: string): GaugeValue[] {
  const requiredCollected = requiredItemIds.filter((id) => collected.has(id)).length;
  const coreProgress = Math.round((requiredCollected / requiredItemIds.length) * 100);
  const bagProgress = Math.round((collected.size / items.length) * 100);
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
      state: `${collected.size}/${items.length} PACKED`,
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
  const [screen, setScreen] = useState<"intro" | "how" | "play" | "pause" | "complete" | "review">("intro");
  const [room, setRoom] = useState<RoomKey>("bedroom");
  const [collected, setCollected] = useState<string[]>([]);
  const [message, setMessage] = useState("OBJECTIVE: FIND THE GO-BAG.");

  const collectedSet = useMemo(() => new Set(collected), [collected]);
  const currentRoom = rooms[room];
  const requiredCollected = requiredItemIds.filter((id) => collectedSet.has(id)).length;
  const isPacked = requiredCollected === requiredItemIds.length;

  useEffect(() => {
    onControlPanelChange({
      emphasis:
        screen === "complete"
          ? "READY SIGNAL"
          : collectedSet.size > 0
            ? "CORE ITEMS"
            : "BAG STATUS",
      gauges: gameGaugeValues(collectedSet, screen),
      notice: message,
    });
  }, [collectedSet, message, onControlPanelChange, screen]);

  useEffect(() => {
    if (isPacked && screen === "play") {
      setMessage("GO-BAG READY. CORE ITEMS COLLECTED. SELECT FINISH SIMULATOR.");
    }
  }, [isPacked, screen]);

  function resetGame() {
    setRoom("bedroom");
    setCollected([]);
    setMessage("OBJECTIVE: FIND THE GO-BAG.");
  }

  function clearAndExit() {
    resetGame();
    onQuickExit();
  }

  function startGame() {
    resetGame();
    setScreen("play");
    setMessage("ENTERING: BEDROOM. LOCATE THE GO-BAG FIRST, THEN PACK THE REST.");
  }

  function enterRoom(nextRoom: RoomKey) {
    setRoom(nextRoom);
    setMessage(`ENTERING: ${rooms[nextRoom].name.toUpperCase()}. SEARCH THE ROOM AND CLICK USEFUL ITEMS.`);
  }

  function collectItem(item: Item) {
    if (item.id !== "bag" && !collectedSet.has("bag")) {
      setMessage("GO-BAG REQUIRED. FIND THE GO-BAG FIRST, THEN RETURN FOR THIS ITEM.");
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
          <button type="button" onClick={startGame}>Start Simulator</button>
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
          <li>Find the Go-Bag first. Other items can be packed after the bag is collected.</li>
          <li>Collected items appear in the inventory panel on the right side of the room screen.</li>
          <li>Each action updates the system comms in the COMMAND CENTER.</li>
          <li>The simulator keeps this session temporary and browser-only.</li>
        </ul>
        <div className="terminal-actions compact-actions">
          <button type="button" onClick={startGame}>Start Simulator</button>
          <button type="button" onClick={() => setScreen("intro")}>Go Back</button>
          <button type="button" onClick={clearAndExit}>Quick Exit</button>
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
            <span key={item.id}>
              <img src={item.image} alt="" />
              {item.label}
            </span>
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
            <div className={`room-floor ${room}`}>
              <img className="room-backdrop" src={currentRoom.background} alt="" />
              <div className="room-side-mask" aria-hidden="true" />
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
                  <span className="pickup-art">
                    <img src={item.image} alt="" />
                  </span>
                </button>
              ))}
              <SceneInventory collectedItems={collectedItems} />
            </div>
          </div>
          <div className="room-nav" aria-label="Room navigation">
            <span>ROOM PATHS</span>
            {roomLinks[room].map((linkedRoom) => (
              <button key={linkedRoom} type="button" onClick={() => enterRoom(linkedRoom)}>
                Go To {rooms[linkedRoom].name}
              </button>
            ))}
            {isPacked ? (
              <button type="button" onClick={() => setScreen("complete")}>
                Finish Simulator
              </button>
            ) : null}
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
  roomName,
}: {
  collectedCount: number;
  onPause: () => void;
  onQuickExit: () => void;
  roomName: string;
}) {
  return (
    <header className="simulator-hud">
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
      <span className="scene-inventory-title">Inventory</span>
      {inventorySlots.map((slot) => {
        const item = visibleItems[slot];

        return (
          <span
            aria-label={item?.label}
            aria-hidden={!item}
            className={item ? "scene-inventory-slot packed" : "scene-inventory-slot"}
            key={slot}
            title={item?.label}
          >
            {item ? <img src={item.image} alt="" /> : null}
          </span>
        );
      })}
      {overflowCount > 0 && (
        <span className="scene-inventory-overflow">
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

export default GoBagSimulator;

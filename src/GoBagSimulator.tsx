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
  key: RoomKey;
  name: string;
};

const rooms: Record<RoomKey, Room> = {
  living: { key: "living", name: "Living Room" },
  kitchen: { key: "kitchen", name: "Kitchen" },
  bedroom: { key: "bedroom", name: "Bedroom" },
  bathroom: { key: "bathroom", name: "Bathroom" },
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
    if (requiredCollected === requiredItemIds.length && screen === "play") {
      setScreen("complete");
      setMessage("GO-BAG READY. CORE ITEMS COLLECTED. SELECT I'M READY TO GO WHEN YOU WANT THE NEXT PLANNING PROMPT.");
    }
  }, [requiredCollected, screen]);

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
              <RoomBackdrop room={room} />
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
                  <img src={item.image} alt="" />
                  <span>{item.label}</span>
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
          </div>
        </>
      )}
    </section>
  );
}

function RoomBackdrop({ room }: { room: RoomKey }) {
  return (
    <svg className="room-backdrop" aria-hidden="true" viewBox="0 0 1024 682">
      <defs>
        <pattern id={`floor-grid-${room}`} width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#00eaff" strokeOpacity="0.32" strokeWidth="2" />
        </pattern>
        <pattern id={`scan-${room}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0H4" stroke="#fff6dd" strokeOpacity="0.045" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="1024" height="682" fill="#05070d" />
      <rect x="22" y="22" width="808" height="420" fill="#07111a" stroke="#fff6dd" strokeWidth="8" />
      <rect x="22" y="442" width="808" height="218" fill={`url(#floor-grid-${room})`} stroke="#fff6dd" strokeWidth="8" />
      <rect x="22" y="22" width="808" height="638" fill={`url(#scan-${room})`} />
      {room === "living" ? <LivingRoomArt /> : null}
      {room === "bedroom" ? <BedroomArt /> : null}
      {room === "bathroom" ? <BathroomArt /> : null}
      {room === "kitchen" ? <KitchenArt /> : null}
    </svg>
  );
}

function LivingRoomArt() {
  return (
    <g>
      <rect x="84" y="86" width="134" height="150" fill="#061827" stroke="#fff6dd" strokeWidth="8" />
      <path d="M100 210h102v-52l-32 28-24-36-46 60Z" fill="#9f237e" />
      <rect x="278" y="300" width="300" height="116" rx="10" fill="#007987" stroke="#05070d" strokeWidth="10" />
      <rect x="300" y="322" width="78" height="56" fill="#9f237e" stroke="#05070d" strokeWidth="6" />
      <rect x="460" y="322" width="76" height="56" fill="#fff6dd" stroke="#05070d" strokeWidth="6" />
      <rect x="250" y="378" width="354" height="44" fill="#004c58" />
      <rect x="110" y="328" width="118" height="130" rx="8" fill="#9f237e" stroke="#05070d" strokeWidth="10" />
      <rect x="132" y="352" width="74" height="52" fill="#fff6dd" stroke="#05070d" strokeWidth="6" />
      <rect x="340" y="456" width="210" height="70" fill="#007987" stroke="#fff6dd" strokeWidth="8" />
      <rect x="666" y="250" width="122" height="122" fill="#061827" stroke="#00eaff" strokeWidth="10" />
      <path d="M690 340l74-66M690 282l70 54" stroke="#fff6dd" strokeWidth="10" />
      <rect x="690" y="382" width="78" height="28" fill="#fff6dd" />
      <rect x="236" y="182" width="6" height="190" fill="#fff6dd" />
      <path d="M205 176h68l-16-52h-36Z" fill="#fff6dd" stroke="#05070d" strokeWidth="6" />
      <rect x="194" y="448" width="50" height="80" fill="#00a66f" />
      <rect x="202" y="500" width="62" height="42" fill="#9f237e" stroke="#05070d" strokeWidth="6" />
      <rect x="632" y="100" width="96" height="244" fill="#fff6dd" stroke="#05070d" strokeWidth="8" />
      <circle cx="704" cy="230" r="7" fill="#05070d" />
    </g>
  );
}

function BedroomArt() {
  return (
    <g>
      <rect x="82" y="82" width="142" height="152" fill="#061827" stroke="#fff6dd" strokeWidth="8" />
      <path d="M100 216h104v-58l-34 28-24-38-46 68Z" fill="#9f237e" />
      <rect x="268" y="286" width="340" height="154" rx="8" fill="#007987" stroke="#05070d" strokeWidth="10" />
      <rect x="288" y="316" width="240" height="96" fill="#119eb0" />
      <rect x="526" y="316" width="64" height="96" fill="#9f237e" />
      <rect x="342" y="300" width="84" height="52" fill="#fff6dd" stroke="#05070d" strokeWidth="6" />
      <rect x="158" y="350" width="94" height="88" fill="#007987" stroke="#fff6dd" strokeWidth="8" />
      <rect x="172" y="382" width="66" height="12" fill="#05070d" />
      <rect x="628" y="170" width="162" height="216" fill="#007987" stroke="#fff6dd" strokeWidth="8" />
      <path d="M660 220h98M660 270h98M660 320h98" stroke="#05070d" strokeWidth="8" />
      <circle cx="690" cy="246" r="6" fill="#fff6dd" />
      <circle cx="728" cy="246" r="6" fill="#fff6dd" />
      <rect x="770" y="86" width="64" height="296" fill="#005966" stroke="#fff6dd" strokeWidth="8" />
      <path d="M802 104v260" stroke="#05070d" strokeWidth="6" />
      <rect x="404" y="486" width="260" height="76" fill="#9f237e" stroke="#fff6dd" strokeWidth="8" />
      <rect x="274" y="142" width="190" height="18" fill="#fff6dd" />
      <rect x="318" y="92" width="92" height="38" fill="#9f237e" stroke="#05070d" strokeWidth="6" />
    </g>
  );
}

function BathroomArt() {
  return (
    <g>
      <rect x="136" y="92" width="188" height="138" fill="#061827" stroke="#9f237e" strokeWidth="10" />
      <path d="M156 210l136-90M170 124l96 74" stroke="#fff6dd" strokeOpacity="0.75" strokeWidth="6" />
      <rect x="102" y="296" width="282" height="78" fill="#fff6dd" stroke="#05070d" strokeWidth="10" />
      <ellipse cx="244" cy="334" rx="54" ry="22" fill="#061827" />
      <path d="M232 292v-38h52" stroke="#fff6dd" strokeWidth="10" fill="none" />
      <rect x="442" y="288" width="104" height="168" fill="#fff6dd" stroke="#05070d" strokeWidth="10" />
      <rect x="464" y="250" width="84" height="70" fill="#fff6dd" stroke="#05070d" strokeWidth="10" />
      <ellipse cx="494" cy="464" rx="78" ry="30" fill="#fff6dd" stroke="#05070d" strokeWidth="8" />
      <rect x="618" y="218" width="190" height="210" fill="#fff6dd" stroke="#05070d" strokeWidth="10" />
      <rect x="630" y="218" width="166" height="76" fill="#9f237e" />
      <path d="M626 204h180" stroke="#fff6dd" strokeWidth="8" />
      <path d="M744 170v64h54" stroke="#fff6dd" strokeWidth="8" fill="none" />
      <rect x="392" y="108" width="128" height="156" fill="#007987" stroke="#fff6dd" strokeWidth="8" />
      <path d="M418 142h76M418 178h76M418 214h76" stroke="#05070d" strokeWidth="8" />
      <rect x="84" y="244" width="62" height="164" fill="#9f237e" stroke="#05070d" strokeWidth="8" />
      <rect x="330" y="506" width="220" height="70" fill="#9f237e" stroke="#fff6dd" strokeWidth="8" />
    </g>
  );
}

function KitchenArt() {
  return (
    <g>
      <rect x="72" y="96" width="122" height="306" fill="#fff6dd" stroke="#05070d" strokeWidth="10" />
      <path d="M72 238h122M170 156v38M170 278v56" stroke="#05070d" strokeWidth="8" />
      <rect x="238" y="124" width="372" height="90" fill="#007987" stroke="#05070d" strokeWidth="10" />
      <path d="M300 124v90M392 124v90M506 124v90" stroke="#05070d" strokeWidth="8" />
      <rect x="214" y="322" width="484" height="118" fill="#007987" stroke="#05070d" strokeWidth="10" />
      <rect x="214" y="300" width="484" height="34" fill="#fff6dd" />
      <rect x="356" y="270" width="122" height="170" fill="#fff6dd" stroke="#05070d" strokeWidth="10" />
      <circle cx="386" cy="296" r="12" fill="#05070d" />
      <circle cx="448" cy="296" r="12" fill="#05070d" />
      <rect x="382" y="354" width="72" height="48" fill="#9f237e" />
      <rect x="530" y="326" width="128" height="54" fill="#061827" stroke="#fff6dd" strokeWidth="8" />
      <rect x="650" y="110" width="126" height="150" fill="#061827" stroke="#fff6dd" strokeWidth="8" />
      <path d="M668 242h88v-54l-28 22-20-28-40 60Z" fill="#9f237e" />
      <rect x="292" y="496" width="288" height="96" fill="#b0804f" stroke="#05070d" strokeWidth="10" />
      <rect x="316" y="520" width="70" height="42" fill="#00eaff" stroke="#05070d" strokeWidth="6" />
      <rect x="410" y="520" width="70" height="42" fill="#9f237e" stroke="#05070d" strokeWidth="6" />
      <rect x="594" y="166" width="142" height="18" fill="#fff6dd" />
      <circle cx="616" cy="210" r="16" fill="#00a66f" />
      <circle cx="706" cy="210" r="16" fill="#9f237e" />
    </g>
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

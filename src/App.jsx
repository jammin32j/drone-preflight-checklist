import React, { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  Camera,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Download,
  MapPinned,
  Plane,
  Plus,
  Radio,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "gambit_preflight_checklist_app_v1";

const icons = {
  shield: ShieldCheck,
  plane: Plane,
  camera: Camera,
  clipboard: ClipboardCheck,
  battery: BatteryCharging,
  map: MapPinned,
  radio: Radio,
};

const defaultSections = [
  {
    id: "must-do",
    title: "Must-Do Before Every Flight",
    icon: "shield",
    items: [
      "Look over the drone and make sure the props are good",
      "Make sure the SD card is installed and properly formatted",
      "Make sure the camera settings are correct",
      "Make sure you are logged into the Fees360 / B360 app",
    ],
  },
  {
    id: "aircraft",
    title: "Drone Inspection",
    icon: "plane",
    items: [
      "Check frame, arms, landing gear, and body for cracks or loose parts",
      "Check gimbal or camera mount for damage",
      "Make sure all prop screws or prop locks are secure",
      "Check motors for dirt, sand, hair, or rough bearings",
      "Power on drone and confirm there are no startup warnings",
    ],
  },
  {
    id: "camera",
    title: "Camera / Storage",
    icon: "camera",
    items: [
      "Confirm correct photo/video mode for the job",
      "Confirm resolution, aspect ratio, and image format are correct",
      "Check exposure, white balance, focus, and color profile",
      "Take a quick test photo or video clip",
      "Verify the test file saved to the SD card",
    ],
  },
  {
    id: "app",
    title: "App / Mission Setup",
    icon: "clipboard",
    items: [
      "Confirm the correct job or mission is selected",
      "Confirm you are checked in if the app requires it",
      "Confirm upload requirements before starting the flight",
      "Confirm the app can see the needed files/photos if required",
      "Make sure phone/controller/tablet has enough battery",
    ],
  },
  {
    id: "battery",
    title: "Battery / Power",
    icon: "battery",
    items: [
      "Drone battery charged and locked in place",
      "Controller battery charged",
      "Extra batteries charged and ready",
      "Inspect batteries for swelling, cracks, or damage",
      "Confirm battery level is enough for the mission",
    ],
  },
  {
    id: "area",
    title: "Flight Area",
    icon: "map",
    items: [
      "Check wind, weather, and visibility",
      "Look for trees, wires, poles, people, cars, and animals",
      "Confirm takeoff and landing area is clear",
      "Confirm you have permission to fly at the location",
      "Check airspace, LAANC, TFRs, or restrictions if needed",
    ],
  },
  {
    id: "final",
    title: "Final Launch Check",
    icon: "radio",
    items: [
      "Wait for GPS/home point confirmation if using GPS",
      "Confirm return-to-home altitude makes sense for the area",
      "Check live camera feed before takeoff",
      "Do a short hover test before flying away",
      "Confirm controls, braking, GPS stability, and video feed feel normal",
    ],
  },
];

function buildInitialSections() {
  return defaultSections.map((section) => ({
    ...section,
    items: section.items.map((text, index) => ({
      id: `${section.id}-${index}`,
      text,
      checked: false,
    })),
  }));
}

export default function App() {
  const [sections, setSections] = useState(buildInitialSections);
  const [pilotName, setPilotName] = useState("Gambit FPV");
  const [aircraft, setAircraft] = useState("DJI Mini 4 Pro");
  const [jobName, setJobName] = useState("");
  const [newItems, setNewItems] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sections) setSections(parsed.sections);
        if (parsed.pilotName) setPilotName(parsed.pilotName);
        if (parsed.aircraft) setAircraft(parsed.aircraft);
        if (parsed.jobName) setJobName(parsed.jobName);
      }
    } catch (error) {
      console.warn("Could not load saved checklist", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sections, pilotName, aircraft, jobName })
    );
  }, [sections, pilotName, aircraft, jobName, loaded]);

  const totalItems = useMemo(
    () => sections.reduce((total, section) => total + section.items.length, 0),
    [sections]
  );

  const completedItems = useMemo(
    () =>
      sections.reduce(
        (total, section) =>
          total + section.items.filter((item) => item.checked).length,
        0
      ),
    [sections]
  );

  const percent = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
  const mustDoComplete = sections[0]?.items.every((item) => item.checked) ?? false;
  const readyToFly = totalItems > 0 && completedItems === totalItems;

  function toggleItem(sectionId, itemId) {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
          : section
      )
    );
  }

  function resetChecklist() {
    setSections((current) =>
      current.map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item, checked: false })),
      }))
    );
  }

  function restoreDefaults() {
    setSections(buildInitialSections());
    setPilotName("Gambit FPV");
    setAircraft("DJI Mini 4 Pro");
    setJobName("");
    setNewItems({});
  }

  function addItem(sectionId) {
    const text = (newItems[sectionId] || "").trim();
    if (!text) return;

    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: `${sectionId}-${Date.now()}`,
                  text,
                  checked: false,
                },
              ],
            }
          : section
      )
    );

    setNewItems((current) => ({ ...current, [sectionId]: "" }));
  }

  function deleteItem(sectionId, itemId) {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section
      )
    );
  }

  function exportChecklist() {
    const now = new Date();
    const lines = [
      "DRONE PRE-FLIGHT CHECKLIST",
      `Pilot: ${pilotName || "Not entered"}`,
      `Aircraft: ${aircraft || "Not entered"}`,
      `Job / Location: ${jobName || "Not entered"}`,
      `Date: ${now.toLocaleString()}`,
      `Progress: ${completedItems}/${totalItems} complete (${percent}%)`,
      `Must-Do Section Complete: ${mustDoComplete ? "Yes" : "No"}`,
      "",
      ...sections.flatMap((section) => [
        section.title.toUpperCase(),
        ...section.items.map((item) => `${item.checked ? "[x]" : "[ ]"} ${item.text}`),
        "",
      ]),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preflight-checklist-${now.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="pill">
            <ClipboardCheck size={16} />
            Separate Pre-Flight Checklist App
          </div>
          <h1>Drone Pre-Flight Checklist</h1>
          <p>
            Your first four checks stay at the top every time: drone/props, SD
            card, camera settings, and Fees360/B360 login.
          </p>
        </div>

        <div className="progress-card">
          <div className="progress-top">
            <div>
              <span>Progress</span>
              <strong>{percent}%</strong>
            </div>
            <div
              className={
                readyToFly
                  ? "status ready"
                  : mustDoComplete
                  ? "status main-done"
                  : "status not-ready"
              }
            >
              {readyToFly ? "Ready" : mustDoComplete ? "Main Checks Done" : "Not Ready"}
            </div>
          </div>
          <div className="bar">
            <div style={{ width: `${percent}%` }} />
          </div>
          <small>
            {completedItems} of {totalItems} complete
          </small>
        </div>
      </section>

      <section className="details-card">
        <label>
          <span>Pilot</span>
          <input value={pilotName} onChange={(e) => setPilotName(e.target.value)} />
        </label>
        <label>
          <span>Aircraft</span>
          <input value={aircraft} onChange={(e) => setAircraft(e.target.value)} />
        </label>
        <label>
          <span>Job / Location</span>
          <input
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="Job, address, or location"
          />
        </label>
      </section>

      <section className="sections">
        {sections.map((section) => {
          const Icon = icons[section.icon] || ClipboardCheck;
          const complete = section.items.length > 0 && section.items.every((item) => item.checked);
          const count = section.items.filter((item) => item.checked).length;

          return (
            <article
              key={section.id}
              className={section.id === "must-do" ? "card must-do" : "card"}
            >
              <header className="card-header">
                <div className="title-group">
                  <div className="icon-box">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h2>{section.title}</h2>
                    <p>
                      {count} of {section.items.length} checked
                    </p>
                  </div>
                </div>
                {complete && <CheckCircle2 className="complete-icon" size={26} />}
              </header>

              <div className="items">
                {section.items.map((item) => (
                  <div key={item.id} className={item.checked ? "item checked" : "item"}>
                    <button
                      type="button"
                      className="check-button"
                      onClick={() => toggleItem(section.id, item.id)}
                    >
                      {item.checked ? <CheckCircle2 size={25} /> : <Circle size={25} />}
                    </button>
                    <button
                      type="button"
                      className="item-text"
                      onClick={() => toggleItem(section.id, item.id)}
                    >
                      {item.text}
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteItem(section.id, item.id)}
                      title="Delete item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="add-row">
                <input
                  value={newItems[section.id] || ""}
                  onChange={(e) =>
                    setNewItems((current) => ({ ...current, [section.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addItem(section.id);
                  }}
                  placeholder="Add your own checklist item"
                />
                <button type="button" onClick={() => addItem(section.id)}>
                  <Plus size={18} />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="actions">
        <button type="button" className="primary" onClick={exportChecklist}>
          <Download size={18} />
          Export Checklist
        </button>
        <button type="button" onClick={resetChecklist}>
          <RotateCcw size={18} />
          Clear Checkmarks
        </button>
        <button type="button" onClick={restoreDefaults}>Restore Defaults</button>
      </section>
    </main>
  );
}

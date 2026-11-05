import { useState, useEffect, useMemo } from "react";

/* ---------- utils ---------- */
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = isoOf(new Date());
const ms = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const addDays = (s, n) => {
  const d = new Date(ms(s) + n * 864e5);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const diff = (a, b) => Math.round((ms(b) - ms(a)) / 864e5);
const fmtD = (s, o) =>
  new Date(ms(s)).toLocaleDateString("en-GB", { timeZone: "UTC", ...(o || { day: "numeric", month: "short" }) });
const peso = (n) => "₱" + Math.round(n).toLocaleString("en-PH");
const hash = (s) => {
  let x = 5381;
  for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0;
  return x;
};
const rng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

/* ---------- catalogue (fictional hotels) ---------- */
const DEST = {
  "Metro Manila": { kind: "city", line: "Malls, museums and street food" },
  Cebu: { kind: "city", line: "Island hopping from a big-city base" },
  Boracay: { kind: "beach", line: "White sand and sunset sails" },
  "El Nido": { kind: "beach", cliffs: true, line: "Limestone cliffs and lagoons" },
  Baguio: { kind: "mountain", line: "Pine forests and cool mornings" },
  Siargao: { kind: "beach", line: "Surf breaks and palm roads" },
  Singapore: { kind: "city", line: "Skyline views and hawker centres" },
};
const AMEN = {
  wifi: "Free Wi-Fi",
  pool: "Pool",
  breakfast: "Breakfast available",
  parking: "Parking",
  gym: "Gym",
  spa: "Spa",
  beach: "Beachfront",
  ac: "Air conditioning",
  kitchen: "Kitchen",
  shuttle: "Airport shuttle",
};
const TYPES = ["Hotel", "Resort", "Boutique", "Apartment", "Hostel"];

// name, destination, area, type, stars, rating, reviews, price/night, km to centre, facilities, blurb
const HOTELS = [
  ["Sampaguita Tower Hotel", "Metro Manila", "Makati", "Hotel", 5, 9.0, 3214, 7800, 0.8, "wifi pool gym spa breakfast parking ac", "Glass tower above Ayala Avenue with a rooftop pool and city views."],
  ["Intramuros Courtyard Inn", "Metro Manila", "Intramuros", "Boutique", 3, 8.6, 1180, 3600, 1.2, "wifi breakfast ac", "Restored colonial house a short walk from Fort Santiago."],
  ["Bonifacio Stay Suites", "Metro Manila", "BGC", "Apartment", 4, 8.7, 2045, 5400, 0.5, "wifi kitchen gym pool ac parking", "Serviced apartments with full kitchens, steps from the high street."],
  ["Katipunan Garden Lodge", "Metro Manila", "Quezon City", "Hotel", 3, 8.1, 760, 2400, 6.5, "wifi breakfast parking ac", "Quiet rooms near the university belt with free parking."],
  ["Mactan Shoreline Resort", "Cebu", "Lapu-Lapu", "Resort", 5, 9.2, 2890, 9600, 9.0, "wifi pool beach spa breakfast gym shuttle ac", "Beachfront resort with a lagoon pool, ten minutes from the airport."],
  ["Fuente Heritage Hotel", "Cebu", "Cebu City", "Hotel", 4, 8.4, 1530, 4200, 0.6, "wifi pool breakfast gym ac", "Classic city hotel near Fuente Osmeña with a courtyard pool."],
  ["Colon Backpackers House", "Cebu", "Cebu City", "Hostel", 2, 8.2, 960, 900, 0.3, "wifi kitchen ac", "Dorms and private rooms on the oldest street in the country."],
  ["Mandaue Business Inn", "Cebu", "Mandaue", "Hotel", 3, 7.9, 880, 2600, 4.1, "wifi parking ac breakfast", "Practical rooms close to the bridge to Mactan."],
  ["White Beach Palms Resort", "Boracay", "Station 2", "Resort", 5, 9.1, 3560, 12400, 0.2, "wifi pool beach spa breakfast gym ac", "Steps from the sand with a pool bar and an on-site spa."],
  ["Bulabog Wind Lodge", "Boracay", "Bulabog", "Hostel", 2, 8.3, 740, 1400, 1.9, "wifi beach ac", "Laid-back lodge on the kite-surfing side of the island."],
  ["Diniwid Cliff Villas", "Boracay", "Diniwid", "Boutique", 4, 9.0, 810, 8800, 1.4, "wifi pool breakfast ac beach", "Private villas on a bluff above a quiet cove."],
  ["Station 3 Garden Hotel", "Boracay", "Station 3", "Hotel", 3, 8.0, 1320, 3900, 0.6, "wifi pool breakfast ac", "Tropical garden hotel two minutes from the beach path."],
  ["Corong Corong Bay Resort", "El Nido", "Corong-Corong", "Resort", 4, 8.9, 1620, 7600, 2.1, "wifi pool beach breakfast ac shuttle", "Sunset-facing rooms on a calm bay with kayaks included."],
  ["Poblacion Hostel Nido", "El Nido", "El Nido Town", "Hostel", 2, 8.5, 1950, 1100, 0.2, "wifi ac kitchen", "Social hostel in town with a shared kitchen and tour desk."],
  ["Lagen Hideaway", "El Nido", "Bacuit Bay", "Resort", 5, 9.4, 980, 18500, 5.8, "wifi pool beach spa breakfast ac shuttle", "Cliffside cottages reached by boat, with all meals on request."],
  ["Caalan Beach Cottages", "El Nido", "Caalan", "Boutique", 3, 8.2, 540, 3300, 3.0, "wifi beach breakfast", "Simple bamboo cottages on a long, quiet beach."],
  ["Pine Ridge Mountain Lodge", "Baguio", "Camp John Hay", "Hotel", 4, 8.8, 1760, 5200, 2.5, "wifi breakfast parking gym spa", "Timber lodge among the pines with a fireplace lounge."],
  ["Session Road Inn", "Baguio", "Session Road", "Hotel", 3, 8.0, 2210, 2300, 0.2, "wifi breakfast", "Walk to the market, cafés and the cathedral from your door."],
  ["Burnham Cabin Rentals", "Baguio", "Burnham Park", "Apartment", 3, 8.4, 430, 2800, 0.7, "wifi kitchen parking", "Self-catering cabins a block from the lake."],
  ["Mines View Boutique", "Baguio", "Mines View", "Boutique", 4, 8.7, 690, 4100, 5.0, "wifi breakfast parking spa", "Eight design-led rooms with valley views and a tea room."],
  ["Cloud 9 Surf Resort", "Siargao", "General Luna", "Resort", 4, 9.0, 1480, 6900, 1.5, "wifi pool beach breakfast ac", "Surf lessons, a pool and a short walk to the boardwalk."],
  ["Tuason Point Hostel", "Siargao", "Tuason", "Hostel", 2, 8.6, 820, 1000, 2.2, "wifi kitchen", "Board storage, bikes for rent and a rooftop hangout."],
  ["Dapa Harbor Hotel", "Siargao", "Dapa", "Hotel", 3, 7.8, 390, 2200, 11, "wifi ac parking", "Easy stop by the port with early ferry transfers."],
  ["Pacifico Palm Villas", "Siargao", "Pacifico", "Boutique", 4, 9.1, 520, 8200, 7.5, "wifi pool beach breakfast ac", "Palm-lined villas by a quiet northern break."],
  ["Marina Quay Hotel", "Singapore", "Marina Bay", "Hotel", 5, 9.1, 5120, 16800, 0.9, "wifi pool gym spa breakfast ac", "Harbour-view rooms with an infinity pool and late checkout."],
  ["Kampong Glam Shophouse", "Singapore", "Kampong Glam", "Boutique", 3, 8.5, 1330, 7400, 1.8, "wifi breakfast ac", "Restored shophouse with courtyard breakfast."],
  ["Lavender Capsule Stay", "Singapore", "Lavender", "Hostel", 2, 8.0, 2690, 2900, 2.4, "wifi ac", "Private capsules with lockers, near the MRT."],
].map(([name, dest, area, type, stars, rating, reviews, price, dist, am, blurb], i) => ({
  id: "h" + (i + 1),
  name,
  dest,
  area,
  type,
  stars,
  rating,
  reviews,
  price,
  dist,
  amen: am.split(" "),
  blurb,
}));

const PROVIDERS = [
  { id: "direct", name: "Hotel website" },
  { id: "roomhub", name: "RoomHub" },
  { id: "tripnest", name: "TripNest" },
  { id: "bookbay", name: "BookBay" },
];

/* ---------- pricing ---------- */
function offerFor(hotel, prov, ci, co, rooms) {
  const n = hash(hotel.id + prov.id);
  const factor = prov.id === "direct" ? 1 : 0.93 + ((n % 1000) / 1000) * 0.2;
  let total = 0;
  for (let d = ci; d < co; d = addDays(d, 1)) {
    const wd = new Date(ms(d)).getUTCDay();
    total += hotel.price * factor * (wd === 5 || wd === 6 ? 1.12 : 1);
  }
  total = Math.round((total * rooms) / 10) * 10;
  return {
    provider: prov,
    total,
    free: prov.id === "direct" || n % 3 !== 0,
    breakfast: hotel.amen.includes("breakfast") && n % 2 === 0,
  };
}
function offersFor(hotel, ci, co, rooms) {
  return PROVIDERS.map((p) => offerFor(hotel, p, ci, co, rooms)).sort((a, b) => a.total - b.total);
}
const label = (r) =>
  r >= 9 ? "Exceptional" : r >= 8.5 ? "Excellent" : r >= 8 ? "Very good" : r >= 7 ? "Good" : "Pleasant";
const roomsLeft = (hotel, ci) => {
  const n = hash(hotel.id + ci) % 9;
  return n < 3 ? n + 2 : 0;
};

/* ---------- artwork (drawn in SVG, no photos needed) ---------- */
const SKY = [
  ["#8FD3F0", "#FDEBC8"],
  ["#F4A261", "#FBE3A5"],
  ["#2F4A7A", "#E8A9B8"],
];
function Art({ hotel, variant = 0 }) {
  const d = DEST[hotel.dest];
  const R = rng(hash(hotel.id) + variant * 977 + 13);
  const sk = SKY[variant % 3];
  const night = variant % 3 === 2;
  const gid = hotel.id + "-" + variant;
  const els = [];

  if (d.kind === "city") {
    let x = -10;
    let i = 0;
    while (x < 330) {
      const w = 22 + R() * 26;
      const hg = 50 + R() * (i % 4 === 3 ? 110 : 80);
      const tone = night
        ? `hsl(215 ${20 + R() * 15}% ${14 + R() * 10}%)`
        : `hsl(${195 + R() * 20} ${18 + R() * 15}% ${32 + R() * 18}%)`;
      els.push(
        <g key={"b" + i}>
          <rect x={x} y={200 - hg} width={w} height={hg + 2} fill={tone} />
          <rect x={x} y={200 - hg} width={w} height={hg + 2} fill={`url(#w${gid})`} />
        </g>
      );
      x += w + 2;
      i++;
    }
  } else if (d.kind === "beach") {
    els.push(<rect key="sea" x="0" y="112" width="320" height="88" fill={`url(#s${gid})`} />);
    if (d.cliffs) {
      els.push(
        <path key="c1" d="M180 118 C185 70 205 60 220 66 C238 72 242 100 250 118 Z" fill={night ? "#27364F" : "#5E7D6C"} />,
        <path key="c2" d="M236 118 C244 88 262 82 276 90 C290 98 296 108 300 118 Z" fill={night ? "#2F4163" : "#78957F"} />
      );
    }
    for (let k = 0; k < 4; k++) {
      els.push(
        <path
          key={"w" + k}
          d={`M${20 + k * 70} ${128 + k * 8} q12 -6 24 0 t24 0`}
          stroke="rgba(255,255,255,.55)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    els.push(<path key="sand" d="M0 168 C80 150 200 158 320 146 L320 200 L0 200 Z" fill={night ? "#6F6A66" : "#F0D9A8"} />);
    const px = 238 + R() * 30;
    els.push(
      <path
        key="trunk"
        d={`M${px} 176 C${px - 6} 150 ${px - 2} 130 ${px + 6} 112`}
        stroke={night ? "#2B2420" : "#7A5A3C"}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    );
    [-50, -15, 20, 55, 90].forEach((a, k) =>
      els.push(
        <ellipse
          key={"l" + k}
          cx={px + 6}
          cy="112"
          rx="26"
          ry="6"
          fill={night ? "#1D4636" : "#2F8F5B"}
          transform={`rotate(${a} ${px + 6} 112) translate(20 0)`}
        />
      )
    );
    const bx = 30 + R() * 30;
    els.push(
      <g key="bld">
        <rect x={bx} y="112" width="96" height="58" fill={night ? "#3A3F4F" : "#F6F1E7"} />
        <rect x={bx - 6} y="106" width="108" height="8" fill={night ? "#222633" : "#C9573A"} />
        <rect x={bx} y="112" width="96" height="58" fill={`url(#w${gid})`} />
      </g>
    );
  } else {
    const c1 = night ? "#283A5E" : "#7FA3B8";
    const c2 = night ? "#1D2B47" : "#4F7A74";
    const ridge = (base, amp, col, key) => {
      let p = `M0 ${base}`;
      for (let x = 0; x <= 320; x += 40) p += ` L${x + 20} ${base - amp * (0.4 + R() * 0.9)} L${x + 40} ${base + 8}`;
      return <path key={key} d={p + " L320 200 L0 200 Z"} fill={col} />;
    };
    els.push(ridge(130, 60, c1, "r1"), ridge(160, 50, c2, "r2"));
    for (let k = 0; k < 11; k++) {
      const x = 8 + k * 30 + R() * 14;
      const hg = 26 + R() * 22;
      els.push(<path key={"p" + k} d={`M${x} 200 L${x + 9} ${200 - hg} L${x + 18} 200 Z`} fill={night ? "#14301F" : "#2B6B45"} />);
    }
    const bx = 120 + R() * 70;
    els.push(
      <g key="lodge">
        <rect x={bx} y="150" width="70" height="40" fill={night ? "#4A3A2C" : "#B98A5A"} />
        <path d={`M${bx - 6} 152 L${bx + 35} 126 L${bx + 76} 152 Z`} fill={night ? "#2A2019" : "#6E4A2B"} />
        <rect x={bx + 28} y="166" width="14" height="24" fill={night ? "#F6D58A" : "#40301F"} />
      </g>
    );
  }

  const stars = [];
  if (night) {
    for (let k = 0; k < 14; k++) {
      stars.push(<circle key={"st" + k} cx={R() * 320} cy={R() * 70} r={0.6 + R() * 1.1} fill="#fff" fillOpacity=".8" />);
    }
  }

  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Illustration of ${hotel.name}`}>
      <defs>
        <linearGradient id={"g" + gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sk[0]} />
          <stop offset="1" stopColor={sk[1]} />
        </linearGradient>
        <linearGradient id={"s" + gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? "#1F3B5E" : "#3AA6B9"} />
          <stop offset="1" stopColor={night ? "#142A45" : "#1E7C94"} />
        </linearGradient>
        <pattern id={"w" + gid} width="9" height="12" patternUnits="userSpaceOnUse">
          <rect x="2" y="3" width="4" height="5" fill={night ? "#F6D58A" : "#FFFFFF"} fillOpacity={night ? ".8" : ".4"} />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#g${gid})`} />
      {stars}
      <circle cx={night ? 70 : 250} cy={night ? 44 : 52} r={night ? 16 : 22} fill={night ? "#F4F0E0" : "#FFF4D0"} fillOpacity={night ? ".95" : ".9"} />
      {els}
    </svg>
  );
}

/* ---------- storage (browser only) ---------- */
const KEY = "lodgewise-v1";
const defaultSearch = () => ({ dest: "Boracay", ci: addDays(TODAY, 10), co: addDays(TODAY, 13), guests: 2, rooms: 1 });
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const s = d.search && d.search.ci >= TODAY && d.search.co > d.search.ci ? d.search : defaultSearch();
      return { search: s, favs: Array.isArray(d.favs) ? d.favs : [], trips: Array.isArray(d.trips) ? d.trips : [] };
    }
  } catch (e) {
    /* storage unavailable, start fresh */
  }
  return { search: defaultSearch(), favs: [], trips: [] };
}

/* ---------- shared bits ---------- */
function Field({ label: text, id, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{text}</label>
      {children}
    </div>
  );
}
function Stars({ n }) {
  return (
    <span className="stars" role="img" aria-label={`${n} stars`}>
      {"★".repeat(n)}
    </span>
  );
}
function Modal({ title, onClose, narrow, children }) {
  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div
        className={"modal" + (narrow ? " narrow" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-h">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}

/* ---------- search bar ---------- */
function SearchBar({ search, onSearch }) {
  const [d, setD] = useState(search);
  const [err, setErr] = useState("");
  useEffect(() => setD(search), [search]);
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));
  const setIn = (v) => setD((s) => ({ ...s, ci: v, co: s.co <= v ? addDays(v, 1) : s.co }));
  const go = (e) => {
    e.preventDefault();
    if (!d.ci || !d.co || diff(d.ci, d.co) < 1) return setErr("Check-out must be after check-in.");
    if (d.ci < TODAY) return setErr("Check-in cannot be in the past.");
    setErr("");
    onSearch({
      ...d,
      guests: Math.max(1, parseInt(d.guests, 10) || 1),
      rooms: Math.max(1, parseInt(d.rooms, 10) || 1),
    });
  };
  return (
    <form onSubmit={go}>
      <div className="sbar">
        <div className="field dest">
          <label htmlFor="s-dest">Where to</label>
          <select id="s-dest" value={d.dest} onChange={(e) => set("dest", e.target.value)}>
            <option value="all">All destinations</option>
            {Object.keys(DEST).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <Field label="Check-in" id="s-in">
          <input id="s-in" type="date" min={TODAY} value={d.ci} onChange={(e) => setIn(e.target.value)} />
        </Field>
        <Field label="Check-out" id="s-out">
          <input id="s-out" type="date" min={addDays(d.ci || TODAY, 1)} value={d.co} onChange={(e) => set("co", e.target.value)} />
        </Field>
        <Field label="Guests" id="s-guests">
          <input id="s-guests" type="number" min="1" max="16" value={d.guests} onChange={(e) => set("guests", e.target.value)} />
        </Field>
        <Field label="Rooms" id="s-rooms">
          <input id="s-rooms" type="number" min="1" max="8" value={d.rooms} onChange={(e) => set("rooms", e.target.value)} />
        </Field>
        <button className="btn btn-primary btn-lg go" type="submit">
          Search
        </button>
      </div>
      {err && (
        <div className="err" role="alert" style={{ marginTop: 10 }}>
          {err}
        </div>
      )}
    </form>
  );
}

/* ---------- filters ---------- */
const DEF_F = { maxPrice: 25000, stars: 0, rating: 0, types: [], amen: [], free: false };
function Filters({ f, setF, open }) {
  const tog = (k, v) =>
    setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const seg = (k, opts) => (
    <div className="seg">
      {opts.map(([v, l]) => (
        <button key={v} aria-pressed={f[k] === v} onClick={() => setF((s) => ({ ...s, [k]: v }))}>
          {l}
        </button>
      ))}
    </div>
  );
  const changed = JSON.stringify(f) !== JSON.stringify(DEF_F);
  return (
    <aside className={"filters" + (open ? " open" : "")} aria-label="Filters">
      <div className="fgroup">
        <h3>Max price per night</h3>
        <div className="val">{f.maxPrice >= 25000 ? "Any price" : "Up to " + peso(f.maxPrice)}</div>
        <input
          type="range"
          id="f-price"
          min="1000"
          max="25000"
          step="500"
          value={f.maxPrice}
          onChange={(e) => setF((s) => ({ ...s, maxPrice: +e.target.value }))}
          aria-label="Maximum price per night"
        />
      </div>
      <div className="fgroup">
        <h3>Star rating</h3>
        {seg("stars", [[0, "Any"], [3, "3+"], [4, "4+"], [5, "5"]])}
      </div>
      <div className="fgroup">
        <h3>Guest rating</h3>
        {seg("rating", [[0, "Any"], [7, "7+"], [8, "8+"], [9, "9+"]])}
      </div>
      <div className="fgroup">
        <h3>Property type</h3>
        {TYPES.map((t) => (
          <label className="chk" key={t}>
            <input type="checkbox" checked={f.types.includes(t)} onChange={() => tog("types", t)} />
            {t}
          </label>
        ))}
      </div>
      <div className="fgroup">
        <h3>Facilities</h3>
        {["pool", "breakfast", "beach", "wifi", "parking", "spa", "gym", "ac", "kitchen", "shuttle"].map((a) => (
          <label className="chk" key={a}>
            <input type="checkbox" checked={f.amen.includes(a)} onChange={() => tog("amen", a)} />
            {AMEN[a]}
          </label>
        ))}
      </div>
      <div className="fgroup">
        <h3>Policy</h3>
        <label className="chk">
          <input type="checkbox" checked={f.free} onChange={(e) => setF((s) => ({ ...s, free: e.target.checked }))} />
          Free cancellation on best price
        </label>
      </div>
      <button className="btn btn-sm" disabled={!changed} onClick={() => setF(DEF_F)}>
        Clear filters
      </button>
    </aside>
  );
}

/* ---------- result card ---------- */
function HotelCard({ r, search, fav, onFav, onOpen }) {
  const { h: ht, offers } = r;
  const best = offers[0];
  const worst = offers[offers.length - 1];
  const nights = diff(search.ci, search.co);
  const per = best.total / (nights * search.rooms);
  const left = roomsLeft(ht, search.ci);
  const savePct = Math.round(((worst.total - best.total) / worst.total) * 100);
  return (
    <article className="card">
      <div className="art">
        <Art hotel={ht} />
        <button className="fav" aria-pressed={fav} onClick={() => onFav(ht.id)}>
          {fav ? "♥ Saved" : "♡ Save"}
        </button>
        <span className="tag-type">{ht.type}</span>
      </div>
      <div className="body">
        <h3>
          <button onClick={() => onOpen(ht.id)}>{ht.name}</button>
        </h3>
        <div className="sub">
          <Stars n={ht.stars} />
          <span>
            {ht.area}, {ht.dest}
          </span>
          <span>{ht.dist} km from centre</span>
        </div>
        <div className="rate">
          <span className="score">{ht.rating.toFixed(1)}</span>
          <span>
            <b>{label(ht.rating)}</b> · {ht.reviews.toLocaleString("en-PH")} reviews
          </span>
        </div>
        <div className="chips">
          {ht.amen.slice(0, 5).map((a) => (
            <span className="chip" key={a}>
              {AMEN[a]}
            </span>
          ))}
          {ht.amen.length > 5 && <span className="chip">+{ht.amen.length - 5}</span>}
        </div>
        <div className="sub">
          {best.free ? (
            <span className="flag good">✓ Free cancellation</span>
          ) : (
            <span className="flag">Non-refundable best price</span>
          )}
          {left > 0 && <span className="flag warn">Only {left} rooms left</span>}
        </div>
      </div>
      <div className="price">
        <span className="from">
          {plural(offers.length, "deal")} · best on {best.provider.name}
        </span>
        {savePct > 0 && <span className="was">{peso(worst.total / (nights * search.rooms))}</span>}
        <span className="big">{peso(per)}</span>
        <small>per night · {peso(best.total)} total</small>
        {savePct > 0 && <span className="save">Save {savePct}%</span>}
        <button className="btn btn-primary" onClick={() => onOpen(ht.id)}>
          Compare prices
        </button>
      </div>
    </article>
  );
}

/* ---------- hotel details, price comparison and checkout ---------- */
function HotelModal({ hotel, search, fav, onFav, onClose, onBook, goTrips }) {
  const [step, setStep] = useState("detail");
  const [offer, setOffer] = useState(null);
  const [done, setDone] = useState(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", requests: "" });
  const [err, setErr] = useState("");
  const nights = diff(search.ci, search.co);
  const offers = useMemo(
    () => offersFor(hotel, search.ci, search.co, search.rooms),
    [hotel, search.ci, search.co, search.rooms]
  );
  const worst = offers[offers.length - 1];
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const stay = `${fmtD(search.ci, { weekday: "short", day: "numeric", month: "short" })} to ${fmtD(search.co, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} · ${plural(nights, "night")} · ${plural(search.guests, "guest")}, ${plural(search.rooms, "room")}`;

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Enter the lead guest name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr("Enter a valid email address.");
    setErr("");
    setDone(
      onBook({
        hotel,
        offer,
        search,
        nights,
        guest: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), requests: f.requests.trim() },
      })
    );
    setStep("done");
  };

  if (step === "done" && done) {
    return (
      <Modal title="Booking confirmed" onClose={onClose} narrow>
        <div className="done">
          <div className="tick" aria-hidden="true">
            ✓
          </div>
          <p>
            {done.hotelName}, {stay}
          </p>
          <div className="ref">{done.ref}</div>
          <p className="note">
            A confirmation would be sent to {done.guest.email}. This is a demo: no payment was taken and no email is sent.
          </p>
        </div>
        <div className="actions">
          <button className="btn" onClick={onClose}>
            Keep searching
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              goTrips();
            }}
          >
            View my trips
          </button>
        </div>
      </Modal>
    );
  }

  if (step === "checkout" && offer) {
    const base = offer.total / 1.12;
    return (
      <Modal title={"Book with " + offer.provider.name} onClose={onClose} narrow>
        <div className="summary">
          <div className="line">
            <b>{hotel.name}</b>
            <span>{hotel.area}</span>
          </div>
          <div className="line" style={{ color: "var(--ink-2)" }}>
            <span>{stay}</span>
          </div>
          <div className="line">
            <span>
              {plural(nights, "night")} × {plural(search.rooms, "room")}
            </span>
            <span>{peso(base)}</span>
          </div>
          <div className="line">
            <span>Taxes and fees (12%)</span>
            <span>{peso(offer.total - base)}</span>
          </div>
          <div className="line tot">
            <span>Total</span>
            <span>{peso(offer.total)}</span>
          </div>
          <span className="note">
            {offer.free ? "Free cancellation until 2 days before check-in." : "Non-refundable rate. Cancelling forfeits the full amount."}
          </span>
        </div>
        <form className="form" onSubmit={submit}>
          {err && (
            <div className="err" role="alert">
              {err}
            </div>
          )}
          <div className="grid2">
            <Field label="Lead guest" id="c-name">
              <input id="c-name" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Phone (optional)" id="c-phone">
              <input id="c-phone" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
          </div>
          <Field label="Email" id="c-email">
            <input id="c-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Special requests (optional)" id="c-req">
            <textarea
              id="c-req"
              value={f.requests}
              onChange={(e) => set("requests", e.target.value)}
              placeholder="Late arrival, quiet room, extra bed"
            />
          </Field>
          <div className="note">Demo site: hotels, providers and prices are fictional. No payment is taken.</div>
          <div className="actions">
            <button type="button" className="btn" onClick={() => setStep("detail")}>
              Back
            </button>
            <button type="submit" className="btn btn-primary btn-lg">
              Confirm booking · {peso(offer.total)}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal title={hotel.name} onClose={onClose}>
      <div className="sub" style={{ marginTop: -10 }}>
        <Stars n={hotel.stars} />
        <span>{hotel.type}</span>
        <span>
          {hotel.area}, {hotel.dest}
        </span>
        <span>{hotel.dist} km from centre</span>
        <button className="btn btn-sm" aria-pressed={fav} onClick={() => onFav(hotel.id)}>
          {fav ? "♥ Saved" : "♡ Save"}
        </button>
      </div>
      <div className="gallery">
        {[0, 1, 2].map((v) => (
          <div className="art" key={v}>
            <Art hotel={hotel} variant={v} />
          </div>
        ))}
      </div>
      <div className="two">
        <div>
          <h4>About this stay</h4>
          <p>
            {hotel.blurb} {DEST[hotel.dest].line}.
          </p>
          <div className="rate" style={{ marginTop: 12 }}>
            <span className="score">{hotel.rating.toFixed(1)}</span>
            <span>
              <b>{label(hotel.rating)}</b> · {hotel.reviews.toLocaleString("en-PH")} reviews
            </span>
          </div>
        </div>
        <div>
          <h4>Facilities</h4>
          <ul className="amen">
            {hotel.amen.map((a) => (
              <li key={a}>{AMEN[a]}</li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h4>Compare prices · {stay}</h4>
        <div className="offers">
          {offers.map((o, i) => (
            <div className={"offer" + (i === 0 ? " best" : "")} key={o.provider.id}>
              <div className="who">
                <b>
                  {o.provider.name}
                  {i === 0 && <span className="badge">Best price</span>}
                </b>
                <span className="note">
                  {o.free ? "✓ Free cancellation" : "Non-refundable"}
                  {o.breakfast ? " · Breakfast included" : ""}
                </span>
              </div>
              <div className="amt">
                <b>{peso(o.total)}</b>
                <small>{peso(o.total / (nights * search.rooms))} per night · taxes incl.</small>
              </div>
              <button
                className={"btn" + (i === 0 ? " btn-primary" : "")}
                onClick={() => {
                  setOffer(o);
                  setStep("checkout");
                }}
              >
                Book
              </button>
            </div>
          ))}
        </div>
        <p className="note" style={{ marginTop: 8 }}>
          You save up to {peso(worst.total - offers[0].total)} by picking the cheapest site. Prices include taxes and fees.
        </p>
      </div>
    </Modal>
  );
}

/* ---------- views ---------- */
function SearchView({ search, onSearch, favs, onFav, onOpen }) {
  const [f, setF] = useState(DEF_F);
  const [sort, setSort] = useState("rec");
  const [showF, setShowF] = useState(false);
  const nights = diff(search.ci, search.co);

  const results = useMemo(() => {
    const out = HOTELS.filter((x) => search.dest === "all" || x.dest === search.dest)
      .map((x) => ({ h: x, offers: offersFor(x, search.ci, search.co, search.rooms) }))
      .filter((r) => {
        const per = r.offers[0].total / (nights * search.rooms);
        const x = r.h;
        return (
          per <= f.maxPrice &&
          x.stars >= f.stars &&
          x.rating >= f.rating &&
          (f.types.length === 0 || f.types.includes(x.type)) &&
          f.amen.every((a) => x.amen.includes(a)) &&
          (!f.free || r.offers[0].free)
        );
      });
    const score = (r) => r.h.rating * 10 + Math.log(r.h.reviews) * 2 - r.h.dist * 0.4;
    const by = {
      rec: (a, b) => score(b) - score(a),
      price: (a, b) => a.offers[0].total - b.offers[0].total,
      rating: (a, b) => b.h.rating - a.h.rating,
      dist: (a, b) => a.h.dist - b.h.dist,
    }[sort];
    return out.sort(by);
  }, [search, f, sort, nights]);

  const title = search.dest === "all" ? "Stays across the Philippines and Singapore" : `Stays in ${search.dest}`;

  return (
    <div>
      <section className="hero">
        <div className="wrap">
          <h1>Compare hotel prices in one search</h1>
          <p>We check four booking sites for every stay and show the cheapest first. Prices include taxes and fees.</p>
          <SearchBar search={search} onSearch={onSearch} />
        </div>
      </section>
      <div className="wrap main">
        <div className="res-head">
          <div>
            <h2>
              {results.length} {results.length === 1 ? "stay" : "stays"} · {title}
            </h2>
            <p>
              {fmtD(search.ci)} to {fmtD(search.co)} · {plural(nights, "night")} · {plural(search.guests, "guest")},{" "}
              {plural(search.rooms, "room")}
              {search.dest !== "all" ? " · " + DEST[search.dest].line : ""}
            </p>
          </div>
          <div className="res-tools">
            <button className="btn only-m" aria-expanded={showF} onClick={() => setShowF(!showF)}>
              {showF ? "Hide filters" : "Filters"}
            </button>
            <label htmlFor="sort" className="note">
              Sort by
            </label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="rec">Our picks</option>
              <option value="price">Lowest price</option>
              <option value="rating">Guest rating</option>
              <option value="dist">Distance to centre</option>
            </select>
          </div>
        </div>
        <div className="cols">
          <Filters f={f} setF={setF} open={showF} />
          <div className="list">
            {results.length ? (
              results.map((r) => (
                <HotelCard key={r.h.id} r={r} search={search} fav={favs.includes(r.h.id)} onFav={onFav} onOpen={onOpen} />
              ))
            ) : (
              <div className="empty">
                <h3>No stays match these filters</h3>
                <p>Try a higher price limit or remove a facility.</p>
                <button className="btn btn-primary" onClick={() => setF(DEF_F)}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedView({ search, favs, onFav, onOpen, goSearch }) {
  const nights = diff(search.ci, search.co);
  const rows = HOTELS.filter((x) => favs.includes(x.id)).map((x) => ({
    h: x,
    offers: offersFor(x, search.ci, search.co, search.rooms),
  }));
  return (
    <div className="wrap main">
      <div className="res-head">
        <div>
          <h2>Saved stays</h2>
          <p>
            {rows.length
              ? `Prices shown for ${fmtD(search.ci)} to ${fmtD(search.co)} · ${plural(nights, "night")}.`
              : "Hotels you save appear here."}
          </p>
        </div>
      </div>
      <div className="list">
        {rows.length ? (
          rows.map((r) => <HotelCard key={r.h.id} r={r} search={search} fav onFav={onFav} onOpen={onOpen} />)
        ) : (
          <div className="empty">
            <h3>Nothing saved yet</h3>
            <p>Tap Save on any stay to keep it for later.</p>
            <button className="btn btn-primary" onClick={goSearch}>
              Find a stay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TripsView({ trips, onCancel, goSearch }) {
  const [ask, setAsk] = useState(null);
  const sorted = [...trips].sort((a, b) => b.createdAt - a.createdAt);
  const upcoming = trips.filter((t) => t.status === "confirmed").length;
  return (
    <div className="wrap main">
      <div className="res-head">
        <div>
          <h2>My trips</h2>
          <p>{trips.length ? plural(upcoming, "upcoming booking") + "." : "Your bookings appear here."}</p>
        </div>
      </div>
      <div className="list">
        {sorted.length ? (
          sorted.map((t) => {
            const ht = HOTELS.find((x) => x.id === t.hotelId);
            return (
              <article className={"trip" + (t.status === "cancelled" ? " cancelled" : "")} key={t.id}>
                <div className="art">{ht && <Art hotel={ht} variant={1} />}</div>
                <div className="body">
                  <h3>{t.hotelName}</h3>
                  <div className="sub">
                    <span>
                      {t.area}, {t.dest}
                    </span>
                    <span>Ref {t.ref}</span>
                  </div>
                  <div>
                    {fmtD(t.ci, { weekday: "short", day: "numeric", month: "short" })} to{" "}
                    {fmtD(t.co, { weekday: "short", day: "numeric", month: "short" })} · {plural(t.nights, "night")} ·{" "}
                    {plural(t.guests, "guest")}, {plural(t.rooms, "room")}
                  </div>
                  <div className="sub">
                    <span>Booked with {t.provider}</span>
                    <span>{t.free ? "Free cancellation" : "Non-refundable"}</span>
                    <span>Lead guest {t.guest.name}</span>
                  </div>
                </div>
                <div className="side">
                  <span className={"status" + (t.status === "cancelled" ? " x" : "")}>
                    {t.status === "cancelled" ? "Cancelled" : "Confirmed"}
                  </span>
                  <b style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{peso(t.total)}</b>
                  {t.status === "confirmed" &&
                    (ask === t.id ? (
                      <div className="confirm">
                        <span>
                          <b>Cancel this booking?</b> {t.free ? "You get a full refund." : "This rate is non-refundable."}
                        </span>
                        <div className="actions">
                          <button className="btn btn-sm" onClick={() => setAsk(null)}>
                            Keep it
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              onCancel(t.id);
                              setAsk(null);
                            }}
                          >
                            Cancel booking
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-sm" onClick={() => setAsk(t.id)}>
                        Cancel booking
                      </button>
                    ))}
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty">
            <h3>No trips yet</h3>
            <p>Compare prices, pick the best deal and your booking shows up here.</p>
            <button className="btn btn-primary" onClick={goSearch}>
              Find a stay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- app ---------- */
const VIEWS = ["search", "saved", "trips"];
const viewFromHash = () => {
  const v = (window.location.hash || "").slice(1);
  return VIEWS.includes(v) ? v : "search";
};

export default function App() {
  const [st, setSt] = useState(load);
  const [view, setView] = useState(viewFromHash);
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (e) {
      /* storage unavailable */
    }
  }, [st]);

  useEffect(() => {
    const on = () => {
      setView(viewFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const nav = (v) => {
    window.location.hash = v;
    setView(v);
    window.scrollTo(0, 0);
  };
  const flash = (m) => setToast({ m, k: Date.now() });
  const onSearch = (s) => setSt((x) => ({ ...x, search: s }));
  const toggleFav = (id) => {
    const on = st.favs.includes(id);
    setSt((x) => ({ ...x, favs: on ? x.favs.filter((f) => f !== id) : [...x.favs, id] }));
    flash(on ? "Removed from saved." : "Saved for later.");
  };
  const onBook = ({ hotel, offer, search, nights, guest }) => {
    const ref = "LW-" + ((hash(hotel.id + Date.now() + guest.email) % 900000) + 100000);
    const trip = {
      id: "t" + Date.now().toString(36),
      ref,
      hotelId: hotel.id,
      hotelName: hotel.name,
      area: hotel.area,
      dest: hotel.dest,
      ci: search.ci,
      co: search.co,
      nights,
      guests: search.guests,
      rooms: search.rooms,
      provider: offer.provider.name,
      total: offer.total,
      free: offer.free,
      guest,
      status: "confirmed",
      createdAt: Date.now(),
    };
    setSt((x) => ({ ...x, trips: [...x.trips, trip] }));
    return trip;
  };
  const onCancel = (id) => {
    setSt((x) => ({ ...x, trips: x.trips.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t)) }));
    flash("Booking cancelled.");
  };

  const hotel = openId ? HOTELS.find((x) => x.id === openId) : null;
  const upcoming = st.trips.filter((t) => t.status === "confirmed").length;

  let body;
  if (view === "saved") {
    body = <SavedView search={st.search} favs={st.favs} onFav={toggleFav} onOpen={setOpenId} goSearch={() => nav("search")} />;
  } else if (view === "trips") {
    body = <TripsView trips={st.trips} onCancel={onCancel} goSearch={() => nav("search")} />;
  } else {
    body = <SearchView search={st.search} onSearch={onSearch} favs={st.favs} onFav={toggleFav} onOpen={setOpenId} />;
  }

  return (
    <div>
      <header className="top">
        <div className="wrap">
          <button className="logo" onClick={() => nav("search")} aria-label="Lodgewise home">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <rect width="28" height="28" rx="8" fill="#FF8461" />
              <path d="M7 20V11l7-5 7 5v9h-5v-5h-4v5z" fill="#0A3140" />
            </svg>
            Lodgewise
          </button>
          <nav className="nav" aria-label="Main">
            <button aria-current={view === "search" ? "page" : undefined} onClick={() => nav("search")}>
              Search
            </button>
            <button aria-current={view === "saved" ? "page" : undefined} onClick={() => nav("saved")}>
              Saved{st.favs.length > 0 && <span className="n">{st.favs.length}</span>}
            </button>
            <button aria-current={view === "trips" ? "page" : undefined} onClick={() => nav("trips")}>
              My trips{upcoming > 0 && <span className="n">{upcoming}</span>}
            </button>
          </nav>
        </div>
      </header>
      {body}
      <p className="foot wrap">
        Demo site. Hotels, booking sites and prices are fictional and no payment is taken. Your saves and trips stay in
        this browser.
      </p>
      {hotel && (
        <HotelModal
          key={hotel.id}
          hotel={hotel}
          search={st.search}
          fav={st.favs.includes(hotel.id)}
          onFav={toggleFav}
          onClose={() => setOpenId(null)}
          onBook={onBook}
          goTrips={() => nav("trips")}
        />
      )}
      {toast && (
        <div className="toast" role="status" key={toast.k}>
          {toast.m}
        </div>
      )}
    </div>
  );
}

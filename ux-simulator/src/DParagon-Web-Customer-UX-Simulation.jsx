import React, { useState, useReducer, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  X,
  AlertTriangle,
  Tag,
  Clock,
  FileText,
  Ticket,
  QrCode,
  Menu,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const KOTA = [
  "Jakarta",
  "Semarang",
  "Malang",
  "Yogyakarta",
  "Surabaya",
  "Solo",
  "Banjarmasin",
  "Palembang",
];

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE + API MAPPERS
// ═══════════════════════════════════════════════════════════════
const EMPTY_STATE = {
  stories: [],
  events: [],
  komunitas: [],
  myTickets: [],
  reviews: [],
  headBanners: [],
  kategoriKomunitas: [],
};

// Mappers: API (English) → component state (Indonesian field names)
const fromApiEvent = e => ({
  id: e.id,
  nama: e.name,
  deskripsi: e.description,
  kategori: e.kategori_name ?? '',
  venue: e.venue_name ?? '',
  kota: e.venue_city ?? '',
  alamatVenue: e.venue_address ?? '',
  tanggal: e.start_date,
  jamMulai: e.start_time,
  kuota: Number(e.quota),
  pendaftar: Number(e.pendaftar ?? 0),
  harga: Number(e.price),
  stage: e.status,
  coverImage: e.cover_image ?? '',
  komunitasId: e.community_id,
  communityName: e.community_name ?? '',
  fasilitas: e.facilities ?? [],
  rules: e.rules ?? [],
  organizers: e.organizers ?? [],
  sponsors: e.sponsors ?? [],
  agenda: e.agenda ?? [],
});
const fromApiKomunitas = c => ({
  id: c.id,
  nama: c.name,
  deskripsi: c.description,
  kategori: c.kategori_name ?? '',
  kota: c.city,
  tipe: c.type,
  linkWA: c.wa_link,
  jumlahMember: Number(c.jumlah_member ?? 0),
  coverImage: c.cover_image ?? '',
  admin: c.admin,
  rules: c.rules ?? [],
});
const fromApiStory = s => ({
  id: s.id,
  judul: s.title,
  tipeRelasi: s.type === 'event' ? 'Event' : s.type === 'community' ? 'Komunitas' : 'Umum',
  relatedEventId: s.event_id,
  relatedKomunitasId: s.community_id,
  kategori: s.category,
  tanggal: s.published_at,
  coverImage: s.cover_image ?? '',
  status: s.status === 'published' ? 'Published' : 'Draft',
  penulis: s.author ?? '',
  ringkasan: '',
  isi: s.content ?? '',
  images: s.images ?? [],
});
const fromApiReview = r => ({
  id: r.id,
  eventId: r.event_id,
  userId: r.user_email ?? '',
  userName: r.user_name ?? '',
  rating: r.rating,
  komentar: r.comment ?? '',
  status: r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending',
  tanggalSubmit: r.submitted_at,
});
const fromApiBanner = b => ({
  id: b.id,
  sumber: b.type === 'event' ? 'Event' : b.type === 'story' ? 'Artikel' : 'Komunitas',
  relatedId: b.info_id,
  judul: b.title ?? '',
  gambar: b.image ?? '',
  aktif: b.status === 'active',
  urutan: Number(b.order ?? 0),
});
const fromApiTicket = p => {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: p.id,
    eventId: p.event_id,
    eventNama: p.event_name ?? '',
    venue: p.venue_name ?? '',
    tanggal: p.start_date ?? '',
    coverImage: p.cover_image ?? '',
    nama: p.name,
    email: p.email,
    noHp: p.phone,
    status: p.start_date && p.start_date < today ? 'Selesai' : 'Aktif',
    statusBayar: p.payment_status,
    statusCheckIn: p.checkin_status,
    harga: Number(p.price ?? 0),
    peserta: { nama: p.name },
  };
};

async function apiCall(url, method = 'GET', body = null) {
  const opts = { method, headers: {} };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(url, opts);
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  return method === 'DELETE' ? null : res.json();
}

// ═══════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const fmt = (n) => Number(n).toLocaleString("id-ID");
const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const fmtShortDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm min-w-72 ${t.type === "success" ? "bg-green-600" : "bg-blue-600"}`}
        >
          <CheckCircle size={16} />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Modal({ open, children, size = "md" }) {
  if (!open) return null;
  const sz =
    { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size] || "max-w-lg";
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sz} max-h-[90vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Aktif: "bg-green-100 text-green-700",
    Selesai: "bg-gray-100 text-gray-500",
    Dibatalkan: "bg-red-100 text-red-600",
    Lunas: "bg-green-100 text-green-700",
    Gratis: "bg-blue-100 text-blue-700",
    Pending: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 group"
    >
      <ArrowLeft
        size={16}
        className="group-hover:-translate-x-0.5 transition-transform"
      />{" "}
      Kembali
    </button>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
function FInput(props) {
  return (
    <input {...props} className={`${inputCls} ${props.className || ""}`} />
  );
}

// ═══════════════════════════════════════════════════════════════
// MOCK QR CODE VISUAL
// ═══════════════════════════════════════════════════════════════
function QRCodeVisual({ value }) {
  const seed = String(value)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const size = 9;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    // Corner finder patterns
    const isCorner =
      (x < 3 && y < 3) || (x >= size - 3 && y < 3) || (x < 3 && y >= size - 3);
    const isCornerInner =
      (x === 1 && y === 1) ||
      (x === size - 2 && y === 1) ||
      (x === 1 && y === size - 2);
    if (isCorner) return true;
    if (isCornerInner) return false;
    // Pseudo-random data
    const hash = (seed * (i + 7) * 31 + i * 13) % 100;
    return hash < 45;
  });
  return (
    <div className="inline-block p-2 bg-white border border-gray-200 rounded-xl">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gap: 1,
        }}
      >
        {cells.map((filled, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              backgroundColor: filled ? "#1a1a2e" : "white",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOPNAV
// ═══════════════════════════════════════════════════════════════
function TopNav({ currentSection, onNav, ticketCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { key: "home", label: "Community" },
    { key: "stories", label: "Stories" },
    { key: "events", label: "Event" },
    { key: "clubs", label: "Komunitas" },
    { key: "collaborate", label: "Collab" },
    { key: "my-pass", label: "My Pass" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNav("home")}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            DP
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm">D'Paragon</span>
            <span className="text-xs text-gray-400 ml-1">Community</span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onNav(key)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors relative ${currentSection === key ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              {label}
              {key === "my-pass" && ticketCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {ticketCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Simulated user */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              BS
            </div>
            <span className="font-medium">Budi Santoso</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                onNav(key);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-sm rounded-lg font-medium mt-1 ${currentSection === key ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {label}
            </button>
          ))}
          <div className="flex items-center gap-2 px-3 py-2.5 mt-1 text-sm text-gray-700 border-t border-gray-100 mt-2 pt-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              BS
            </div>
            Budi Santoso
          </div>
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════
// BANNER CAROUSEL
// ═══════════════════════════════════════════════════════════════
const CAROUSEL_GRADIENTS = [
  "from-blue-600 to-indigo-800",
  "from-purple-600 to-blue-700",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-700",
];

function BannerCarousel({ banners, onNav }) {
  const activeBanners = [...(banners || [])]
    .filter((b) => b.aktif)
    .sort((a, b) => a.urutan - b.urutan);

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const count = activeBanners.length;

  // Clamp current when active banners decrease (guards out-of-bounds crash)
  useEffect(() => {
    if (count > 0 && current >= count) setCurrent(count - 1);
  }, [count, current]);

  // Auto-slide — consolidated cleanup always runs on unmount/re-run
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (count < 2 || paused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % count);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [count, paused]);

  if (count === 0) return null;

  const handleClick = (banner) => {
    const lt = banner.linkTujuan || "";
    if (lt.startsWith("nav:")) {
      const parts = lt.slice(4).split(":");
      const [section, subPage, subParamStr] = parts;
      const rawParam = subParamStr ? Number(subParamStr) : null;
      const subParam =
        rawParam !== null && !Number.isNaN(rawParam) ? rawParam : null;
      onNav(section, subPage || null, subParam);
    } else if (lt.startsWith("http")) {
      window.open(lt, "_blank", "noopener,noreferrer");
    }
  };

  const prev = () => setCurrent((c) => (c - 1 + count) % count);
  const next = () => setCurrent((c) => (c + 1) % count);

  // Safe index: prevent out-of-bounds between count change and clamping effect
  const safeIdx = Math.min(current, count - 1);
  const banner = activeBanners[safeIdx];
  const gradient = CAROUSEL_GRADIENTS[safeIdx % CAROUSEL_GRADIENTS.length];

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide */}
      <div
        onClick={() => handleClick(banner)}
        className={`relative h-52 md:h-64 bg-gradient-to-br ${banner.gambar ? "" : gradient} cursor-pointer group`}
        style={
          banner.gambar
            ? {
                backgroundImage: `url(${banner.gambar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      >
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0 mr-4">
              {banner.sumber !== "Custom" && (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90 mb-2">
                  {banner.sumber}
                </span>
              )}
              <h2 className="text-white font-bold text-lg md:text-2xl leading-snug line-clamp-2 group-hover:underline">
                {banner.judul}
              </h2>
            </div>
            <ChevronRight
              size={20}
              className="text-white/60 shrink-0 group-hover:text-white transition-colors"
            />
          </div>
        </div>

        {/* Sumber badge top-right */}
        {banner.sumber === "Custom" && (
          <div className="absolute top-4 right-4">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/80">
              Promo
            </span>
          </div>
        )}
      </div>

      {/* Prev/Next buttons (only if >1 banner) */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {activeBanners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              className={`rounded-full transition-all ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: HOME
// ═══════════════════════════════════════════════════════════════
function HomeSection({ state, onNav }) {
  const upcomingEvents = state.events
    .filter((ev) => ev.stage !== "Recap Published")
    .slice(0, 3);
  const activeMembers = state.komunitas.reduce(
    (total, item) => total + item.jumlahMember,
    0,
  );
  const latestRecap =
    state.stories.find(
      (s) => s.status === "Published" && s.kategori === "Rekap Event",
    ) || state.stories.find((s) => s.status === "Published");
  const featuredReviews = (state.reviews || [])
    .filter((r) => r.status === "Approved")
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <BannerCarousel banners={state.headBanners} onNav={onNav} />
      <section className="bg-gray-900 rounded-2xl overflow-hidden text-white">
        <div className="grid md:grid-cols-2">
          <div className="p-7 md:p-9">
            <p className="text-blue-300 text-sm font-medium mb-2">
              D'Paragon Community Hub
            </p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              Tempat penghuni bertemu, bergerak, dan bikin cerita.
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Temukan komunitas aktif, daftar event, simpan QR pass, dan baca
              recap keseruan event D'Paragon dalam satu pengalaman.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNav("events")}
                className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-xl font-medium hover:bg-blue-700"
              >
                Lihat Event
              </button>
              <button
                onClick={() => onNav("collaborate")}
                className="px-4 py-2.5 bg-white/10 text-white text-sm rounded-xl font-medium hover:bg-white/15"
              >
                Ajukan Collab
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-7 flex flex-col justify-end min-h-72">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Komunitas", value: state.komunitas.length },
                { label: "Member", value: activeMembers },
                { label: "Event aktif", value: upcomingEvents.length },
              ].map((item) => (
                <div key={item.label} className="bg-white/12 rounded-xl p-4">
                  <div className="text-2xl font-bold">{fmt(item.value)}</div>
                  <div className="text-xs text-blue-100 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: "Socialize",
            desc: "Bertemu penghuni dan komunitas sekitar melalui gathering, club meetup, dan networking.",
          },
          {
            title: "Energize",
            desc: "Ikut olahraga, turnamen, dan aktivitas rutin yang membuat hunian terasa lebih hidup.",
          },
          {
            title: "Create Stories",
            desc: "Setiap event selesai menjadi cerita, dokumentasi, dan inspirasi untuk event berikutnya.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl border border-gray-200 p-5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Users size={18} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Event Terdekat</h2>
            <button
              onClick={() => onNav("events")}
              className="text-sm text-blue-600 font-medium"
            >
              Lihat semua
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {upcomingEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onNav("events", "detail", ev.id)}
                className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:shadow-md transition-all"
              >
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {ev.stage}
                </span>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mt-3 mb-2">
                  {ev.nama}
                </h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>{fmtShortDate(ev.tanggalMulai)}</div>
                  <div>{ev.venue}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {latestRecap && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Recap Terbaru
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              {fmtShortDate(latestRecap.tanggal)}
            </p>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2">
              {latestRecap.judul}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-3 mb-4">
              {latestRecap.ringkasan}
            </p>
            <button
              onClick={() => onNav("stories", "detail", latestRecap.id)}
              className="text-sm text-blue-600 font-medium"
            >
              Baca recap
            </button>
          </div>
        )}
      </section>

      {/* ── TESTIMONIALS BAND ── */}
      {featuredReviews.length > 0 && (
        <section>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Apa Kata Peserta?
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review langsung dari penghuni yang sudah ikut event D'Paragon
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredReviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <div className="text-yellow-400 text-lg mb-3">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-4">
                  &ldquo;{r.komentar}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {r.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {r.userName}
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-1">
                      {r.eventNama}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StoriesSection({ state, subPage, subParam, onNav }) {
  if (subPage === "detail") {
    const story = state.stories.find((s) => s.id === subParam);
    if (!story)
      return (
        <div className="text-gray-400 text-sm py-10 text-center">
          Artikel tidak ditemukan
        </div>
      );

    const readingTime = Math.max(
      1,
      Math.round((story.isi || story.konten || "").split(" ").length / 200),
    );
    const relatedEvent =
      story.tipeRelasi === "Event"
        ? state.events.find((e) => e.id === story.relatedEventId)
        : null;
    const relatedKomunitas =
      story.tipeRelasi === "Komunitas"
        ? state.komunitas.find((k) => k.id === story.relatedKomunitasId)
        : null;
    const otherPublished = state.stories.filter(
      (s) => s.status === "Published" && s.id !== story.id,
    );

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <BackButton onClick={() => onNav("stories")} />
        <div className="grid gap-6">
          {/* ── Kolom kiri: konten utama ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {story.coverImage ? (
                <img
                  src={story.coverImage}
                  alt={story.judul}
                  className="w-full h-52 object-cover"
                />
              ) : (
                <div className="h-52 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-4xl opacity-50">📰</span>
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {story.kategori}
                  </span>
                  {story.tipeRelasi !== "Umum" && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${story.tipeRelasi === "Event" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}
                    >
                      {story.tipeRelasi}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap">
                  <span>{fmtDate(story.tanggal)}</span>
                  {story.penulis && (
                    <>
                      <span>·</span>
                      <span>oleh {story.penulis}</span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                  {story.judul}
                </h1>
                <div className="prose text-gray-600 text-sm leading-relaxed">
                  {(story.isi || story.konten || "")
                    .split("\n")
                    .map((para, i) =>
                      para.trim() ? (
                        <p key={i} className="mb-3">
                          {para.replace(/\*\*(.*?)\*\*/g, "$1")}
                        </p>
                      ) : null,
                    )}
                </div>
              </div>
            </div>

            {/* ── Baca Juga ── */}
            {otherPublished.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Baca Juga</h3>
                <div className="space-y-3">
                  {otherPublished.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onNav("stories", "detail", s.id)}
                      className="w-full flex items-start gap-3 text-left hover:bg-gray-50 rounded-xl p-2 -mx-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium shrink-0">
                            {s.kategori}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {fmtShortDate(s.tanggal)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                          {s.judul}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Kolom kanan: sidebar ── */}
          <div className="space-y-4">
            {relatedEvent && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Event Terkait
                </h3>
                <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">
                  {relatedEvent.nama}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {fmtShortDate(relatedEvent.tanggalMulai)}
                </p>
                <button
                  onClick={() => onNav("events", "detail", relatedEvent.id)}
                  className="w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Lihat Event
                </button>
              </div>
            )}

            {relatedKomunitas && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Komunitas Terkait
                </h3>
                <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">
                  {relatedKomunitas.nama}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {relatedKomunitas.jumlahMember} member
                </p>
                <button
                  onClick={() => onNav("clubs", "detail", relatedKomunitas.id)}
                  className="w-full py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Lihat Komunitas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const publishedStories = state.stories.filter(
    (s) => s.status === "Published",
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-7 mb-8 text-white">
        <div className="max-w-lg">
          <p className="text-blue-200 text-sm font-medium mb-2">
            D'Paragon Stories
          </p>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            Cerita & Inspirasi dari Komunitas
          </h1>
          <p className="text-blue-100 text-sm">
            Rekap event, tips hidup aktif, dan kisah inspiratif penghuni
            D'Paragon.
          </p>
        </div>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Artikel Terbaru</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {publishedStories.map((story) => (
          <div
            key={story.id}
            onClick={() => onNav("stories", "detail", story.id)}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="h-36 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center group-hover:from-blue-500 group-hover:to-indigo-600 transition-all">
              <span className="text-white text-3xl opacity-60">📰</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {story.kategori}
                </span>
                <span className="text-xs text-gray-400">
                  {fmtShortDate(story.tanggal)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {story.judul}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {story.ringkasan}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: EVENTS
// ═══════════════════════════════════════════════════════════════
function EventsSection({ state, dispatch, loadData, subPage, subParam, onNav, toast }) {
  const [bookingModal, setBookingModal] = useState(null);
  const [bookForm, setBookForm] = useState({ nama: "", email: "", noHp: "" });
  const [bookErrors, setBookErrors] = useState({});
  const [bookSuccess, setBookSuccess] = useState(null);
  const [viewDate, setViewDate] = useState(new Date(2026, 3, 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("Semua");
  const [filterKota, setFilterKota] = useState("Semua Kota");
  const [activeTab, setActiveTab] = useState("upcoming");
  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHovered, setReviewHovered] = useState(0);
  const [reviewKomentar, setReviewKomentar] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewDone, setReviewDone] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const isPastEvent = (ev) =>
    ev.tanggalSelesai < today || ev.stage === "Recap Published";

  const openBooking = (event) => {
    setBookForm({
      nama: "Budi Santoso",
      email: "budi@email.com",
      noHp: "081234567890",
    });
    setBookErrors({});
    setBookSuccess(null);
    setBookingModal(event);
  };

  const validateBook = () => {
    const e = {};
    if (!bookForm.nama.trim()) e.nama = "Nama wajib diisi";
    if (!bookForm.email.trim() || !bookForm.email.includes("@"))
      e.email = "Email tidak valid";
    if (!bookForm.noHp.trim()) e.noHp = "Nomor HP wajib diisi";
    return e;
  };

  const handleBook = async () => {
    const e = validateBook();
    if (Object.keys(e).length) {
      setBookErrors(e);
      return;
    }
    try {
      await apiCall('/api/participants', 'POST', {
        user_id: null,
        name: bookForm.nama,
        email: bookForm.email,
        phone: bookForm.noHp,
        event_id: bookingModal.id,
        payment_status: bookingModal.harga > 0 ? 'Pending' : 'Gratis',
        price: bookingModal.harga,
      });
      await loadData();
      setBookSuccess({ eventNama: bookingModal.nama, harga: bookingModal.harga });
    } catch (err) {
      const msg = err?.message ? (() => { try { return JSON.parse(err.message).error; } catch { return err.message; } })() : 'Gagal mendaftar. Coba lagi.';
      setBookErrors({ _api: msg });
    }
  };

  const alreadyBooked = (eventId) =>
    state.myTickets.some((t) => t.eventId === eventId);

  if (subPage === "calendar") {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const MONTHS = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const getEventsForDay = (day) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return state.events.filter(
        (ev) => ev.tanggalMulai <= dateStr && ev.tanggalSelesai >= dateStr,
      );
    };

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <BackButton onClick={() => onNav("events")} />
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Kalender Event
        </h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-bold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-gray-400 py-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }, (_, i) => (
              <div key={`p-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const evs = getEventsForDay(day);
              const isSelected = selectedDay === day;
              const isToday = day === 1 && month === 3 && year === 2026;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-14 p-1.5 rounded-xl border text-left transition-all ${isSelected ? "border-blue-500 bg-blue-50" : isToday ? "border-blue-200 bg-blue-50/40" : "border-transparent hover:border-gray-200 hover:bg-gray-50"}`}
                >
                  <span
                    className={`text-xs font-medium block mb-1 ${isToday ? "text-blue-600 font-bold" : "text-gray-700"}`}
                  >
                    {day}
                  </span>
                  {evs.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="h-1.5 w-full rounded-full mb-0.5 bg-blue-500"
                      title={ev.nama}
                    />
                  ))}
                  {evs.length > 2 && (
                    <span className="text-xs text-gray-400">
                      +{evs.length - 2}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {selectedDay && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">
              Event {selectedDay} {MONTHS[month]} {year}
            </h3>
            {getEventsForDay(selectedDay).length === 0 ? (
              <p className="text-sm text-gray-400">
                Tidak ada event di tanggal ini
              </p>
            ) : (
              getEventsForDay(selectedDay).map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onNav("events", "detail", ev.id)}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-2 cursor-pointer hover:shadow-sm"
                >
                  <h4 className="font-medium text-gray-900 hover:text-blue-600">
                    {ev.nama}
                  </h4>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>📍 {ev.venue}</span>
                    <span>🕐 {ev.jamMulai} WIB</span>
                    <span>
                      💰 {ev.harga === 0 ? "Gratis" : `Rp ${fmt(ev.harga)}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  if (subPage === "detail") {
    const event = state.events.find((e) => e.id === subParam);
    if (!event)
      return (
        <div className="py-10 text-center text-gray-400">
          Event tidak ditemukan
        </div>
      );
    const booked = alreadyBooked(event.id);
    const sisaKuota = event.kuota - event.pendaftar;
    const eventStory = state.stories?.find(
      (s) =>
        s.tipeRelasi === "Event" &&
        s.relatedEventId === event.id &&
        s.status === "Published",
    );
    // Review helpers
    const isCompleted = isPastEvent(event);
    const isParticipant = state.myTickets.some((t) => t.eventId === event.id);
    const CURRENT_USER = { userId: "budi@email.com", userName: "Budi Santoso" };
    const myReview = (state.reviews || []).find(
      (r) => r.eventId === event.id && r.userId === CURRENT_USER.userId,
    );
    const approvedReviews = (state.reviews || []).filter(
      (r) => r.eventId === event.id && r.status === "Approved",
    );
    const handleSubmitReview = async () => {
      if (!reviewRating) {
        setReviewError("Pilih rating bintang terlebih dahulu");
        return;
      }
      if (!reviewKomentar.trim()) {
        setReviewError("Komentar tidak boleh kosong");
        return;
      }
      setReviewError("");
      await apiCall('/api/reviews', 'POST', {
        event_id: event.id,
        user_id: null,
        rating: reviewRating,
        comment: reviewKomentar.trim(),
      });
      await loadData();
      setReviewDone(true);
      if (toast)
        toast("success", "Review terkirim! Menunggu verifikasi admin.");
    };

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <BackButton onClick={() => onNav("events")} />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
              {event.coverImage ? (
                <img
                  src={event.coverImage}
                  alt={event.nama}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="h-52 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
                  <span className="text-white text-5xl opacity-40">🎪</span>
                </div>
              )}
              <div className="p-6">
                <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {event.kategori}
                </span>
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium ml-2">
                  {event.stage || "Registration Open"}
                </span>
                <h1 className="text-xl font-bold text-gray-900 mt-3 mb-3">
                  {event.nama}
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {event.deskripsi}
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Organizer</div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {event.organizer || "D'Paragon Community Team"}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">
                      Sponsor / Partner
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {event.sponsor || "Internal DParagon"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Aturan Event</h3>
              <div className="space-y-2">
                {(event.rules || []).map((rule) => (
                  <div
                    key={rule}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle
                      size={15}
                      className="text-green-600 mt-0.5 flex-shrink-0"
                    />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
            {(event.agenda || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Rundown Acara
                </h3>
                <div className="space-y-2">
                  {event.agenda.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <Clock
                        size={14}
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                      />
                      <span className="font-semibold w-12 flex-shrink-0">
                        {item.jam}
                      </span>
                      <span>{item.kegiatan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(event.fasilitas || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Yang Kamu Dapatkan
                </h3>
                <div className="space-y-2">
                  {event.fasilitas.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle
                        size={15}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {event.stage === "Recap Published" && eventStory && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Story Terkait Tersedia
                </h3>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  {eventStory.judul}
                </p>
                <p className="text-sm text-blue-700 mb-4">
                  Lihat cerita, dokumentasi, dan highlight dari event ini di
                  D'Paragon Stories.
                </p>
                <button
                  onClick={() => onNav("stories", "detail", eventStory.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700"
                >
                  Baca Recap
                </button>
              </div>
            )}

            {/* ── REVIEW FORM ── */}
            {isCompleted && isParticipant && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Bagaimana Pengalamanmu?
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Kamu terdaftar sebagai peserta event ini. Bagikan review untuk
                  membantu komunitas.
                </p>
                {myReview || reviewDone ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    <span>
                      Review kamu sudah terkirim dan sedang menunggu verifikasi
                      admin.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Rating *</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewRating(i)}
                            onMouseEnter={() => setReviewHovered(i)}
                            onMouseLeave={() => setReviewHovered(0)}
                            className={`text-2xl leading-none transition-colors ${i <= (reviewHovered || reviewRating) ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="text-xs text-gray-500 self-center ml-2">
                            {
                              [
                                "",
                                "Sangat Buruk",
                                "Buruk",
                                "Cukup",
                                "Baik",
                                "Sangat Baik",
                              ][reviewRating]
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">
                        Komentar *
                      </div>
                      <textarea
                        rows={3}
                        value={reviewKomentar}
                        onChange={(e) => setReviewKomentar(e.target.value)}
                        placeholder="Ceritakan pengalamanmu di event ini..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    {reviewError && (
                      <p className="text-xs text-red-500">{reviewError}</p>
                    )}
                    <button
                      onClick={handleSubmitReview}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Kirim Review
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── APPROVED REVIEWS ── */}
            {approvedReviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Testimoni Peserta{" "}
                  <span className="text-gray-400 font-normal text-sm">
                    ({approvedReviews.length})
                  </span>
                </h3>
                <div className="space-y-4">
                  {approvedReviews.map((r) => (
                    <div
                      key={r.id}
                      className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-medium text-gray-900 text-sm">
                          {r.userName}
                        </div>
                        <div className="text-yellow-400 text-sm flex-shrink-0">
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {r.komentar}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {fmtShortDate(r.tanggalSubmit)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(() => {
              const related = state.events
                .filter(
                  (e) => e.kategori === event.kategori && e.id !== event.id,
                )
                .slice(0, 3);
              if (!related.length) return null;
              return (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Event Lainnya
                  </h3>
                  <div className="space-y-3">
                    {related.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => onNav("events", "detail", e.id)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {e.nama}
                          </div>
                          <div className="text-xs text-gray-500">
                            {e.kategori} · {fmtDate(e.tanggalMulai)}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {e.harga === 0 ? "Gratis" : `Rp ${fmt(e.harga)}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Info Event</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar
                    size={16}
                    className="text-blue-600 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {fmtDate(event.tanggalMulai)}
                    </div>
                    {event.tanggalMulai !== event.tanggalSelesai && (
                      <div className="text-gray-500 text-xs">
                        s/d {fmtDate(event.tanggalSelesai)}
                      </div>
                    )}
                    <div className="text-gray-500 text-xs">
                      {event.jamMulai}
                      {event.jamSelesai ? ` – ${event.jamSelesai}` : ""} WIB
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin
                    size={16}
                    className="text-blue-600 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {event.venue}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {event.alamatVenue}
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.alamatVenue)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-0.5 inline-block"
                    >
                      Lihat di Maps
                    </a>
                  </div>
                </div>
                {event.kota && (
                  <div className="flex items-start gap-3">
                    <Tag
                      size={16}
                      className="text-blue-600 mt-0.5 flex-shrink-0"
                    />
                    <div className="font-medium text-gray-900">
                      {event.kota}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Users
                    size={16}
                    className="text-blue-600 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {sisaKuota} sisa kuota
                    </div>
                    <div className="text-gray-500 text-xs">
                      {event.pendaftar} / {event.kuota} terdaftar
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {event.harga === 0 ? "GRATIS" : `Rp ${fmt(event.harga)}`}
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {event.harga > 0 ? "per peserta" : ""}
                </div>
                {event.stage === "Recap Published" ? (
                  eventStory ? (
                    <button
                      onClick={() => onNav("stories", "detail", eventStory.id)}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Lihat Recap Event
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-gray-100 text-gray-400 text-sm rounded-xl text-center">
                      Recap Belum Tersedia
                    </div>
                  )
                ) : booked ? (
                  <div className="w-full py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-xl text-center border border-green-200">
                    ✓ Sudah Terdaftar
                  </div>
                ) : sisaKuota === 0 ? (
                  <div className="w-full py-2.5 bg-gray-100 text-gray-500 text-sm rounded-xl text-center">
                    Kuota Penuh
                  </div>
                ) : (
                  <button
                    onClick={() => openBooking(event)}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Daftar Sekarang
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <Modal
          open={!!bookingModal}
          onClose={() => {
            setBookingModal(null);
            setBookSuccess(null);
          }}
        >
          {bookSuccess ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Pendaftaran Berhasil!
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                {bookSuccess.eventNama}
              </p>
              <p className="text-sm text-gray-500 mb-5">
                {bookSuccess.harga === 0
                  ? "Event gratis, tidak ada pembayaran diperlukan."
                  : `Silakan lakukan pembayaran sebesar Rp ${fmt(bookSuccess.harga)}.`}
              </p>
              <p className="text-xs text-gray-400 mb-5">
                Tiket kamu tersedia di halaman <strong>My Pass</strong>.
              </p>
              <button
                onClick={() => {
                  setBookingModal(null);
                  setBookSuccess(null);
                  onNav("my-pass");
                }}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
              >
                Lihat Tiket Saya
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Daftar Event</h3>
                <button
                  onClick={() => setBookingModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5">
                <div className="bg-blue-50 rounded-xl p-3 mb-5">
                  <p className="text-sm font-medium text-blue-900">
                    {bookingModal?.nama}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {fmtDate(bookingModal?.tanggalMulai)} ·{" "}
                    {bookingModal?.venue}
                  </p>
                </div>
                <div className="space-y-4">
                  <Field label="Nama Lengkap *" error={bookErrors.nama}>
                    <FInput
                      value={bookForm.nama}
                      onChange={(e) =>
                        setBookForm((p) => ({ ...p, nama: e.target.value }))
                      }
                      placeholder="Nama lengkap"
                    />
                  </Field>
                  <Field label="Email *" error={bookErrors.email}>
                    <FInput
                      type="email"
                      value={bookForm.email}
                      onChange={(e) =>
                        setBookForm((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="email@contoh.com"
                    />
                  </Field>
                  <Field label="Nomor HP *" error={bookErrors.noHp}>
                    <FInput
                      value={bookForm.noHp}
                      onChange={(e) =>
                        setBookForm((p) => ({ ...p, noHp: e.target.value }))
                      }
                      placeholder="08xxxxxxxxxx"
                    />
                  </Field>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  {bookErrors._api && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{bookErrors._api}</div>
                  )}
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span className="text-gray-600">Total Pembayaran</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {bookingModal?.harga === 0
                        ? "GRATIS"
                        : `Rp ${fmt(bookingModal?.harga)}`}
                    </span>
                  </div>
                  <button
                    onClick={handleBook}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    {bookingModal?.harga === 0
                      ? "Konfirmasi Pendaftaran"
                      : "Bayar & Daftar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // Event list (default)
  const categories = ["Semua", ...new Set(state.events.map((e) => e.kategori))];
  const filtered = state.events.filter((ev) => {
    const matchTab =
      activeTab === "upcoming" ? !isPastEvent(ev) : isPastEvent(ev);
    const matchSearch = ev.nama.toLowerCase().includes(search.toLowerCase());
    const matchKat = filterKat === "Semua" || ev.kategori === filterKat;
    const matchKota = filterKota === "Semua Kota" || ev.kota === filterKota;
    return matchTab && matchSearch && matchKat && matchKota;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Discovery</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Temukan dan ikuti event komunitas D'Paragon
          </p>
        </div>
        <button
          onClick={() => onNav("events", "calendar")}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-xl hover:bg-gray-50"
        >
          <Calendar size={16} /> Lihat Kalender
        </button>
      </div>
      {/* Tab navigation */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "upcoming" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "past" ? "bg-white text-gray-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Wrapped
        </button>
      </div>
      <div className="flex gap-3 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari event..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((k) => (
            <button
              key={k}
              onClick={() => setFilterKat(k)}
              className={`px-3 py-2 text-sm rounded-xl border transition-colors ${filterKat === k ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["Semua Kota", ...KOTA].map((k) => (
          <button
            key={k}
            onClick={() => setFilterKota(k)}
            className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${filterKota === k ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            {k}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🎪</div>
          <p className="font-medium">
            {activeTab === "upcoming"
              ? "Tidak ada event mendatang ditemukan"
              : "Tidak ada event lampau ditemukan"}
          </p>
          <p className="text-sm mt-1">Coba kata kunci atau filter lain</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ev) => {
            const booked = alreadyBooked(ev.id);
            const sisaKuota = ev.kuota - ev.pendaftar;
            const isPast = isPastEvent(ev);
            const eventStory = state.stories?.find(
              (s) =>
                s.tipeRelasi === "Event" &&
                s.relatedEventId === ev.id &&
                s.status === "Published",
            );
            return (
              <div
                key={ev.id}
                className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all group cursor-pointer ${isPast ? "border-gray-200 opacity-90" : "border-gray-200"}`}
                onClick={() => onNav("events", "detail", ev.id)}
              >
                <div
                  className={`h-40 relative flex items-center justify-center ${isPast ? "bg-gradient-to-br from-gray-400 to-gray-500" : "bg-gradient-to-br from-blue-400 to-indigo-600"}`}
                >
                  <span className="text-white text-4xl opacity-40">🎪</span>
                  <div className="absolute top-3 left-3">
                    <span className="text-xs px-2.5 py-1 bg-white/90 text-gray-700 rounded-full font-medium">
                      {ev.kategori}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    {isPast ? (
                      <span className="text-xs px-2.5 py-1 bg-gray-900/75 text-gray-300 rounded-full font-medium">
                        Selesai
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 bg-gray-900/75 text-white rounded-full font-medium">
                        {ev.stage || "Registration Open"}
                      </span>
                    )}
                  </div>
                  {booked && !isPast && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-full font-medium">
                        ✓ Terdaftar
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3
                    className={`font-semibold text-sm leading-snug mb-3 line-clamp-2 transition-colors ${isPast ? "text-gray-500 group-hover:text-gray-700" : "text-gray-900 group-hover:text-blue-600"}`}
                  >
                    {ev.nama}
                  </h3>
                  <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-gray-400" />
                      {fmtShortDate(ev.tanggalMulai)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-gray-400" />
                      {ev.venue}
                    </div>
                    {!isPast && (
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-gray-400" />
                        {sisaKuota > 0
                          ? `${sisaKuota} sisa kuota`
                          : "Kuota penuh"}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span
                      className={`font-bold text-sm ${isPast ? "text-gray-400" : "text-gray-900"}`}
                    >
                      {ev.harga === 0 ? (
                        <span
                          className={
                            isPast ? "text-gray-400" : "text-green-600"
                          }
                        >
                          GRATIS
                        </span>
                      ) : (
                        `Rp ${fmt(ev.harga)}`
                      )}
                    </span>
                    {isPast ? (
                      eventStory ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onNav("stories", "detail", eventStory.id);
                          }}
                          className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                        >
                          Baca Recap →
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          Event Selesai
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-blue-600 font-medium">
                        Lihat Detail →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: CLUBS
// ═══════════════════════════════════════════════════════════════
function ClubsSection({ state, subPage, subParam, onNav, toast }) {
  const [requestModal, setRequestModal] = useState(false);
  const [reqForm, setReqForm] = useState({
    namaKlub: "",
    deskripsi: "",
    kategori: "",
    namaPIC: "",
    emailPIC: "",
    noHpPIC: "",
  });
  const [reqErrors, setReqErrors] = useState({});
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("Semua");
  const [filterKota, setFilterKota] = useState("Semua Kota");

  const validateReq = () => {
    const e = {};
    if (!reqForm.namaKlub.trim()) e.namaKlub = "Nama komunitas wajib diisi";
    if (!reqForm.namaPIC.trim()) e.namaPIC = "Nama PIC wajib diisi";
    if (!reqForm.emailPIC.trim() || !reqForm.emailPIC.includes("@"))
      e.emailPIC = "Email tidak valid";
    if (!reqForm.noHpPIC.trim()) e.noHpPIC = "Nomor HP wajib diisi";
    return e;
  };

  const handleSubmitReq = async () => {
    const e = validateReq();
    if (Object.keys(e).length) {
      setReqErrors(e);
      return;
    }
    setReqSubmitting(true);
    try {
      await apiCall("/api/communities", "POST", {
        name: reqForm.namaKlub,
        description: reqForm.deskripsi,
        category_id: reqForm.kategori ? Number(reqForm.kategori) : null,
        status: "pending",
        pic_name: reqForm.namaPIC,
        pic_email: reqForm.emailPIC,
        pic_phone: reqForm.noHpPIC,
        submitted_at: new Date().toISOString().slice(0, 10),
      });
      setReqSuccess(true);
      toast("success", "Pengajuan komunitas berhasil dikirim!");
    } catch (e) {
      toast("info", "Gagal mengirim pengajuan. Coba lagi.");
    } finally {
      setReqSubmitting(false);
    }
  };

  const openRequest = () => {
    setReqForm({
      namaKlub: "",
      deskripsi: "",
      kategori: state.kategoriKomunitas[0]?.id ?? "",
      namaPIC: "",
      emailPIC: "",
      noHpPIC: "",
    });
    setReqErrors({});
    setReqSuccess(false);
    setRequestModal(true);
  };

  if (subPage === "detail") {
    const klub = state.komunitas.find((k) => k.id === subParam);
    if (!klub)
      return (
        <div className="py-10 text-center text-gray-400">
          Komunitas tidak ditemukan
        </div>
      );
    const clubEvents = state.events.filter((ev) => ev.communityId === klub.id);
    const upcomingEvents = clubEvents
      .filter((ev) => ev.stage !== "Recap Published")
      .slice(0, 3);
    const doneEvents = clubEvents
      .filter((ev) => ev.stage === "Recap Published")
      .slice(0, 2);
    const relatedStory = state.stories?.find(
      (s) =>
        s.tipeRelasi === "Komunitas" &&
        s.relatedKomunitasId === klub.id &&
        s.status === "Published",
    );
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <BackButton onClick={() => onNav("clubs")} />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {klub.coverImage ? (
              <img
                src={klub.coverImage}
                alt={klub.nama}
                className="w-full h-40 object-cover rounded-2xl mb-4"
              />
            ) : (
              <div className="w-full h-40 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                <span className="text-white text-5xl font-bold opacity-80">
                  {klub.nama[0]}
                </span>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl flex-shrink-0">
                  {klub.nama[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {klub.kategori}
                    </span>
                    {klub.kota && (
                      <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium flex items-center gap-1">
                        <MapPin size={10} />
                        {klub.kota}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mt-1">
                    {klub.nama}
                  </h1>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">
                {klub.deskripsi}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {klub.jumlahMember}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Total Member
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {klub.admin}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Admin</div>
                </div>
              </div>
            </div>

            {klub.galeri && klub.galeri.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Galeri Kegiatan
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {klub.galeri.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`galeri-${i}`}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Aturan Komunitas
              </h3>
              <div className="space-y-2">
                {(klub.rules || []).map((rule) => (
                  <div
                    key={rule}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle
                      size={15}
                      className="text-green-600 mt-0.5 flex-shrink-0"
                    />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Bergabung</h3>
              <p className="text-sm text-gray-500 mb-4">
                Klik tombol di bawah untuk langsung bergabung ke grup WhatsApp
                komunitas ini.
              </p>
              <a
                href={klub.linkWA}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  toast("success", `Membuka grup WhatsApp ${klub.nama}`);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <ExternalLink size={16} /> Gabung via WhatsApp
              </a>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Event Komunitas
              </h3>
              {clubEvents.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Belum ada event terdaftar
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Event Mendatang
                      </p>
                      <div className="space-y-2">
                        {upcomingEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {ev.nama}
                              </p>
                              <p className="text-xs text-gray-400">
                                {ev.tanggalMulai}
                              </p>
                            </div>
                            <button
                              onClick={() => onNav("events", "detail", ev.id)}
                              className="shrink-0 text-xs px-2.5 py-1 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                            >
                              Lihat
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {doneEvents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Event Selesai
                      </p>
                      <div className="space-y-2">
                        {doneEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs text-gray-600 truncate">
                                {ev.nama}
                              </p>
                              <p className="text-xs text-gray-400">
                                {ev.tanggalMulai}
                              </p>
                            </div>
                            <button
                              onClick={() => onNav("events", "detail", ev.id)}
                              className="shrink-0 text-xs px-2 py-0.5 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50"
                            >
                              Lihat
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {relatedStory && (
              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5 mt-4">
                <h3 className="font-semibold text-indigo-900 mb-2">
                  Story Terkait
                </h3>
                <p className="text-sm font-medium text-indigo-800 mb-1 line-clamp-2">
                  {relatedStory.judul}
                </p>
                <p className="text-xs text-indigo-600 mb-3 line-clamp-2">
                  {relatedStory.ringkasan}
                </p>
                <button
                  onClick={() => onNav("stories", "detail", relatedStory.id)}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  Baca Artikel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const categories = [
    "Semua",
    ...new Set(state.komunitas.map((k) => k.kategori)),
  ];
  const filtered = state.komunitas.filter((k) => {
    const matchSearch = k.nama.toLowerCase().includes(search.toLowerCase());
    const matchKat = filterKat === "Semua" || k.kategori === filterKat;
    const matchKota = filterKota === "Semua Kota" || k.kota === filterKota;
    return matchSearch && matchKat && matchKota;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Komunitas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Temukan dan bergabung dengan komunitas D'Paragon
          </p>
        </div>
        <button
          onClick={openRequest}
          className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded-xl hover:bg-blue-50 transition-colors"
        >
          + Ajukan Komunitas Baru
        </button>
      </div>
      <div className="flex gap-3 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari komunitas..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((k) => (
            <button
              key={k}
              onClick={() => setFilterKat(k)}
              className={`px-3 py-2 text-sm rounded-xl border ${filterKat === k ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["Semua Kota", ...KOTA].map((k) => (
          <button
            key={k}
            onClick={() => setFilterKota(k)}
            className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${filterKota === k ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            {k}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium">Tidak ada komunitas ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((klub) => (
            <div
              key={klub.id}
              onClick={() => onNav("clubs", "detail", klub.id)}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  {klub.nama[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {klub.kategori}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${klub.tipe === "Internal" ? "bg-gray-100 text-gray-600" : "bg-purple-100 text-purple-700"}`}
                    >
                      {klub.tipe}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {klub.nama}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {klub.deskripsi}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {klub.jumlahMember} member
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal */}
      <Modal
        open={requestModal}
        onClose={() => setRequestModal(false)}
        size="lg"
      >
        {reqSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Pengajuan Terkirim!
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Tim D'Paragon akan meninjau pengajuan komunitas kamu dalam 3-5
              hari kerja. Kami akan menghubungi kamu via email atau WhatsApp.
            </p>
            <button
              onClick={() => setRequestModal(false)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Ajukan Komunitas Baru</h3>
              <button
                onClick={() => setRequestModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500 bg-blue-50 rounded-xl p-3">
                Punya komunitas yang ingin berkolaborasi dengan D'Paragon? Isi
                form ini dan tim kami akan segera menghubungimu.
              </p>
              <Field label="Nama Komunitas *" error={reqErrors.namaKlub}>
                <FInput
                  value={reqForm.namaKlub}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, namaKlub: e.target.value }))
                  }
                  placeholder="Nama komunitas kamu"
                />
              </Field>
              <Field label="Deskripsi Singkat">
                <textarea
                  value={reqForm.deskripsi}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, deskripsi: e.target.value }))
                  }
                  rows={3}
                  placeholder="Ceritakan tentang komunitas kamu..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </Field>
              <Field label="Kategori">
                <select
                  value={reqForm.kategori}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, kategori: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {state.kategoriKomunitas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Data Penanggung Jawab (PIC)
                </p>
                <div className="space-y-3">
                  <Field label="Nama PIC *" error={reqErrors.namaPIC}>
                    <FInput
                      value={reqForm.namaPIC}
                      onChange={(e) =>
                        setReqForm((p) => ({ ...p, namaPIC: e.target.value }))
                      }
                      placeholder="Nama lengkap"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email *" error={reqErrors.emailPIC}>
                      <FInput
                        type="email"
                        value={reqForm.emailPIC}
                        onChange={(e) =>
                          setReqForm((p) => ({
                            ...p,
                            emailPIC: e.target.value,
                          }))
                        }
                        placeholder="email@contoh.com"
                      />
                    </Field>
                    <Field label="No. HP *" error={reqErrors.noHpPIC}>
                      <FInput
                        value={reqForm.noHpPIC}
                        onChange={(e) =>
                          setReqForm((p) => ({ ...p, noHpPIC: e.target.value }))
                        }
                        placeholder="08xxxxxxxxxx"
                      />
                    </Field>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setRequestModal(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitReq}
                  disabled={reqSubmitting}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {reqSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: MY PASS
// ═══════════════════════════════════════════════════════════════
function CollaborateSection({ toast }) {
  const [type, setType] = useState("EO");
  const [form, setForm] = useState({
    nama: "",
    organisasi: "",
    email: "",
    noHp: "",
    kebutuhan: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.nama.trim() || !form.email.includes("@") || !form.noHp.trim()) {
      toast("info", "Lengkapi nama, email, dan nomor HP terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      await apiCall(type === "EO" ? "/api/organizers" : "/api/sponsors", "POST", {
        name: form.organisasi.trim() || form.nama.trim(),
        description: form.kebutuhan,
        email: form.email,
        phone: form.noHp,
        pic: form.nama,
        submitted_at: new Date().toISOString().slice(0, 10),
      });
      setSubmitted(true);
      toast("success", "Pengajuan kerja sama berhasil dikirim.");
    } catch (e) {
      toast("info", "Gagal mengirim pengajuan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Collab dengan D'Paragon
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Untuk event organizer, sponsor, dan brand partner
          yang ingin masuk ke ekosistem D'Paragon Community.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-7">
        {[
          {
            title: "EO / Event Partner",
            desc: "Ajukan konsep event, kebutuhan venue, target peserta, dan format ticketing.",
          },
          {
            title: "Sponsor / Brand",
            desc: "Masuk sebagai sponsor event dengan exposure di event page, QR pass, dan recap article.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl border border-gray-200 p-5"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <FileText size={18} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5">
          {submitted ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} />
              </div>
              <h2 className="font-bold text-gray-900 mb-2">
                Pengajuan diterima
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Tim D'Paragon akan meninjau kebutuhan kerja sama dan menghubungi
                PIC untuk tahap kurasi konsep.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    nama: "",
                    organisasi: "",
                    email: "",
                    noHp: "",
                    kebutuhan: "",
                  });
                }}
                className="mt-5 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700"
              >
                Kirim Pengajuan Lain
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {["EO", "Sponsor"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setType(item)}
                    className={`px-3 py-2 text-sm rounded-xl border ${type === item ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Nama PIC *">
                  <FInput
                    value={form.nama}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nama: e.target.value }))
                    }
                    placeholder="Nama lengkap"
                  />
                </Field>
                <Field label="Organisasi / Brand">
                  <FInput
                    value={form.organisasi}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, organisasi: e.target.value }))
                    }
                    placeholder="Nama organisasi"
                  />
                </Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Email *">
                  <FInput
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="email@contoh.com"
                  />
                </Field>
                <Field label="No. HP *">
                  <FInput
                    value={form.noHp}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, noHp: e.target.value }))
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </Field>
              </div>
              <Field label={`Kebutuhan ${type}`}>
                <textarea
                  value={form.kebutuhan}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, kebutuhan: e.target.value }))
                  }
                  rows={4}
                  placeholder="Ceritakan konsep, target peserta, kebutuhan venue, atau bentuk sponsor yang diinginkan."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </Field>
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Kirim Pengajuan Collab"}
              </button>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-5 text-white">
          <h2 className="font-bold mb-4">Sponsor package mencakup</h2>
          <div className="space-y-3">
            {[
              "Logo di event page dan materi check-in",
              "Brand mention saat event berlangsung",
              "Booth atau sampling area sesuai venue",
              "Mention di artikel recap pasca-event",
              "Rekap leads dan attendance untuk evaluasi",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 text-sm text-gray-200"
              >
                <CheckCircle
                  size={15}
                  className="text-blue-300 mt-0.5 flex-shrink-0"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-white/10 p-4">
            <div className="text-xs text-gray-300 mb-1">
              Catatan operasional
            </div>
            <p className="text-sm text-gray-100">
              Semua konsep event tetap melalui kurasi D'Paragon untuk menjaga
              kualitas komunitas, keamanan peserta, dan kesesuaian venue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyPassSection({ state, subPage, subParam, onNav }) {
  if (subPage === "detail") {
    const ticket = state.myTickets.find((t) => t.id === subParam);
    if (!ticket)
      return (
        <div className="py-10 text-center text-gray-400">
          Tiket tidak ditemukan
        </div>
      );
    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <BackButton onClick={() => onNav("my-pass")} />
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
          {/* Ticket header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Ticket size={16} className="opacity-75" />
              <span className="text-xs text-blue-200 font-medium uppercase tracking-wider">
                D'Paragon Community
              </span>
            </div>
            <h2 className="text-lg font-bold leading-tight">
              {ticket.eventNama}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-blue-200 text-xs">Tanggal</div>
                <div className="font-medium">
                  {fmtShortDate(ticket.tanggal)}
                </div>
              </div>
              <div>
                <div className="text-blue-200 text-xs">Lokasi</div>
                <div className="font-medium">{ticket.venue}</div>
              </div>
            </div>
          </div>
          {/* Dashed separator */}
          <div className="relative flex items-center px-4">
            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex-shrink-0 -ml-7" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2" />
            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex-shrink-0 -mr-7" />
          </div>
          {/* Ticket body */}
          <div className="p-6">
            <div className="flex flex-col items-center mb-5">
              <QRCodeVisual value={ticket.id} />
              <p className="text-xs text-gray-400 mt-2 font-mono">
                {ticket.id}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Nama Peserta</div>
                <div className="font-medium text-gray-900">
                  {ticket.peserta?.nama || "Budi Santoso"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Status Tiket</div>
                <StatusBadge status={ticket.status} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Pembayaran</div>
                <StatusBadge status={ticket.statusBayar} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Nominal</div>
                <div className="font-medium text-gray-900">
                  {ticket.harga === 0 ? "Gratis" : `Rp ${fmt(ticket.harga)}`}
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
              <strong>Perhatian:</strong> Tunjukkan QR Code ini ke petugas saat
              check-in. Jangan bagikan kepada siapapun.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const active = state.myTickets.filter((t) => t.status === "Aktif");
  const others = state.myTickets.filter((t) => t.status !== "Aktif");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Pass</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Riwayat pendaftaran event dan tiket kamu
        </p>
      </div>

      {state.myTickets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎫</div>
          <p className="font-medium text-gray-700 mb-1">Belum ada tiket</p>
          <p className="text-sm text-gray-400 mb-5">
            Daftar ke event D'Paragon dan tiket kamu akan muncul di sini.
          </p>
          <button
            onClick={() => onNav("events")}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700"
          >
            Lihat Event
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tiket Aktif
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onNav("my-pass", "detail", ticket.id)}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3">
                      <p className="text-xs text-blue-200">D'Paragon Event</p>
                      <h3 className="text-white font-semibold text-sm leading-tight line-clamp-1">
                        {ticket.eventNama}
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div>
                          <div className="text-gray-400 mb-0.5">Tanggal</div>
                          <div className="font-medium text-gray-900">
                            {fmtShortDate(ticket.tanggal)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-0.5">Venue</div>
                          <div className="font-medium text-gray-900 truncate">
                            {ticket.venue}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-0.5">
                            Status Bayar
                          </div>
                          <StatusBadge status={ticket.statusBayar} />
                        </div>
                        <div>
                          <div className="text-gray-400 mb-0.5">Tiket</div>
                          <div className="font-mono text-gray-500 text-xs">
                            {ticket.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-blue-600 text-xs">
                          <QrCode size={12} /> Tampilkan QR
                        </div>
                        <span className="text-xs text-blue-600 group-hover:underline">
                          Lihat Tiket →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Riwayat
              </h2>
              <div className="space-y-3">
                {others.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onNav("my-pass", "detail", ticket.id)}
                    className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Ticket size={18} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-700 text-sm line-clamp-1">
                        {ticket.eventNama}
                      </h3>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {fmtShortDate(ticket.tanggal)} · {ticket.venue}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════
let _toastId = 0;

export default function App() {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [loading, setLoading] = useState(false);
  const [nav, setNav] = useState({
    section: "home",
    subPage: null,
    subParam: null,
  });
  const [toasts, setToasts] = useState([]);

  const CURRENT_USER = { userId: "budi@email.com", userName: "Budi Santoso" };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/data');
      // Only load published content for customer view
      const activeEvents = data.events.filter(e => e.status !== 'Draft' && e.status !== 'Cancelled');
      const publishedStories = data.stories.filter(s => s.status === 'published');
      const activeKomunitas = data.komunitas.filter(c => c.status === 'active');
      const approvedReviews = data.reviews.filter(r => r.status === 'approved');
      const activeBanners = data.banners.filter(b => b.status === 'active').sort((a, b) => a.order - b.order);

      // Load my tickets for current user
      let myTickets = [];
      try {
        const tickets = await apiCall(`/api/participants?email=${CURRENT_USER.userId}`);
        myTickets = tickets.map(fromApiTicket);
      } catch (_) {}

      dispatch({
        type: 'LOAD_DATA',
        payload: {
          events: activeEvents.map(fromApiEvent),
          stories: publishedStories.map(fromApiStory),
          komunitas: activeKomunitas.map(fromApiKomunitas),
          reviews: approvedReviews.map(fromApiReview),
          headBanners: activeBanners.map(fromApiBanner),
          kategoriKomunitas: data.kategoriKomunitas.map(c => ({ id: c.id, nama: c.name })),
          myTickets,
        },
      });
    } catch (e) {
      console.error('loadData failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addToast = (type, message) => {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  const handleNav = (section, subPage = null, subParam = null) => {
    setNav({ section, subPage, subParam });
    window.scrollTo(0, 0);
  };

  const sharedProps = {
    state,
    dispatch,
    loadData,
    toast: addToast,
    onNav: handleNav,
    subPage: nav.subPage,
    subParam: nav.subParam,
  };

  const sections = {
    home: <HomeSection {...sharedProps} />,
    stories: <StoriesSection {...sharedProps} />,
    events: <EventsSection {...sharedProps} />,
    clubs: <ClubsSection {...sharedProps} />,
    collaborate: <CollaborateSection {...sharedProps} />,
    "my-pass": <MyPassSection {...sharedProps} />,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {loading && (
        <div className="fixed inset-0 bg-white/70 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
        </div>
      )}
      <TopNav
        currentSection={nav.section}
        onNav={(s) => handleNav(s)}
        ticketCount={state.myTickets.filter((t) => t.status === "Aktif").length}
      />
      <div className="pb-12">
        {sections[nav.section] ?? (
          <div className="text-center py-16 text-gray-400">
            Halaman tidak ditemukan
          </div>
        )}
      </div>
      <Toast
        toasts={toasts}
        onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
    </div>
  );
}

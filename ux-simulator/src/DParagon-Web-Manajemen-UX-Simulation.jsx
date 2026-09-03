import React, { useState, useReducer, useEffect, useRef } from 'react';
import {
  Tag, MapPin, Building2, Calendar, Users, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Search, Download, X, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronDown, Layers, FileText, BarChart2, Eye, ArrowLeft,
  GripVertical, Image, ToggleLeft, ToggleRight, Star, Handshake
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE + API MAPPERS
// ═══════════════════════════════════════════════════════════════
const EMPTY_STATE = {
  kategoriKomunitas: [],
  kategoriEvent: [],
  venue: [],
  komunitas: [],
  events: [],
  partisipan: [],
  pengajuanKlub: [],
  partnershipLeads: [],
  stories: [],
  headBanners: [],
  reviews: [],
};

// Mappers: API (English) → component state (Indonesian field names)
const fromApiCateg = c => ({ id: c.id, nama: c.name, deskripsi: c.description });
const fromApiVenue = v => ({ id: v.id, nama: v.name, alamat: v.address, kapasitas: Number(v.capacity), kota: v.city, mapsLink: v.maps_link });
const fromApiEvent = e => ({
  id: e.id,
  nama: e.name,
  deskripsi: e.description,
  kategoriEventId: e.category_id,
  venueId: e.venue_id,
  tanggalMulai: e.start_date,
  tanggalSelesai: e.end_date,
  jamMulai: e.start_time,
  jamSelesai: e.end_time,
  kuota: Number(e.quota),
  harga: Number(e.price),
  status: e.status,
  coverImage: e.cover_image ?? '',
  komunitasId: e.community_id,
  fasilitas: e.facilities ?? [],
  rules: e.rules ?? [],
  organizer: e.organizers?.[0]?.organizer_name ?? '',
  sponsor: e.sponsors?.[0]?.sponsor_name ?? '',
  organizers: e.organizers ?? [],
  sponsors: e.sponsors ?? [],
  agenda: e.agenda ?? [],
  pendaftar: Number(e.pendaftar ?? 0),
});
const fromApiKomunitas = c => ({
  id: c.id,
  nama: c.name,
  deskripsi: c.description,
  kategoriId: c.category_id,
  tipe: c.type,
  linkWA: c.wa_link,
  status: c.status === 'active' ? 'Aktif' : c.status === 'inactive' ? 'Nonaktif' : c.status,
  jumlahMember: Number(c.jumlah_member ?? 0),
  kota: c.city,
  admin: c.admin,
  coverImage: c.cover_image ?? '',
  rules: c.rules ?? [],
});
const fromApiPengajuan = c => ({
  id: c.id,
  namaKlub: c.name,
  deskripsi: c.description,
  kategori: c.kategori_name ?? '',
  namaPIC: c.pic_name,
  emailPIC: c.pic_email,
  noHpPIC: c.pic_phone,
  status: c.status === 'active' ? 'Approved' : c.status === 'rejected' ? 'Rejected' : 'Pending',
  catatan: c.notes ?? '',
  tanggalAjuan: c.submitted_at,
});
const LEAD_STATUS_LABELS = { pending: 'Pending Review', contacted: 'Contacted', rejected: 'Rejected' };
const fromApiOrgLead = o => ({
  id: o.id, _source: 'organizer', tipe: 'EO',
  organisasi: o.name, pic: o.pic, email: o.email, noHp: o.phone,
  kebutuhan: o.description ?? '', status: LEAD_STATUS_LABELS[o.status] ?? o.status,
  tanggalAjuan: o.submitted_at,
  eventDate: o.event_date ?? '', eventDesc: o.event_description ?? '', website: o.website ?? '',
  attachment: o.attachment ?? '', attachmentName: o.attachment_name ?? '',
  catatan: o.notes ?? '',
});
const fromApiSponsorLead = s => ({
  id: s.id, _source: 'sponsor', tipe: 'Sponsor',
  organisasi: s.name, pic: s.pic, email: s.email, noHp: s.phone,
  kebutuhan: s.description ?? '', status: LEAD_STATUS_LABELS[s.status] ?? s.status,
  tanggalAjuan: s.submitted_at,
  subTipe: s.sub_type === 'penawaran' ? 'Penawaran' : 'Pengajuan',
  sponsorStart: s.sponsorship_start ?? '', sponsorEnd: s.sponsorship_end ?? '',
  benefit: s.benefit ?? '', eventDesc: s.event_description ?? '', website: s.website ?? '',
  attachment: s.attachment ?? '', attachmentName: s.attachment_name ?? '',
  catatan: s.notes ?? '',
});
const fromApiStory = s => ({
  id: s.id,
  judul: s.title,
  tipeRelasi: s.type === 'event' ? 'Event' : s.type === 'community' ? 'Komunitas' : 'Umum',
  relatedEventId: s.event_id,
  relatedKomunitasId: s.community_id,
  kategori: s.category,
  tags: Array.isArray(s.tags) ? s.tags.join(',') : (s.tags ?? ''),
  coverImage: s.cover_image ?? '',
  konten: s.content ?? '',
  penulis: s.author ?? '',
  tanggalPublish: s.published_at,
  tayangSelesai: s.publish_end_date ?? '',
  submitterEmail: s.submitter_email ?? '',
  submitterPhone: s.submitter_phone ?? '',
  status: s.status === 'published' ? 'Published' : s.status === 'pending' ? 'Pending Approval' : s.status === 'rejected' ? 'Rejected' : 'Draft',
  images: s.images ?? [],
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
const fromApiReview = r => ({
  id: r.id,
  eventId: r.event_id,
  eventNama: r.event_name ?? '',
  userId: r.user_email ?? '',
  userName: r.user_name ?? '',
  rating: r.rating,
  komentar: r.comment ?? '',
  status: r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending',
  tanggalSubmit: r.submitted_at,
  catatan: '',
});
const fromApiPartisipan = p => ({
  id: p.id,
  eventId: p.event_id,
  nama: p.name,
  email: p.email,
  noHp: p.phone,
  statusBayar: p.payment_status,
  statusCheckIn: p.checkin_status,
});

// Mappers: component form data (Indonesian) → API request (English)
const toApiEvent = f => ({
  name: f.nama, description: f.deskripsi,
  category_id: f.kategoriEventId ? Number(f.kategoriEventId) : null,
  venue_id: f.venueId ? Number(f.venueId) : null,
  start_date: f.tanggalMulai || null, end_date: f.tanggalSelesai || null,
  start_time: f.jamMulai || null, end_time: f.jamSelesai || null,
  quota: Number(f.kuota) || 0, price: Number(f.harga) || 0,
  cover_image: f.coverImage || '', status: f.status || 'Draft',
  community_id: f.komunitasId ? Number(f.komunitasId) : null,
  facilities: f.fasilitas ?? [], rules: f.rules ?? [],
});
const toApiVenue = f => ({ name: f.nama, address: f.alamat, capacity: Number(f.kapasitas) || 0, city: f.kota, maps_link: f.mapsLink || null });
const toApiKomunitas = f => ({ name: f.nama, description: f.deskripsi, category_id: f.kategoriId ? Number(f.kategoriId) : null, type: f.tipe, city: f.kota || null, status: f.status === 'Aktif' ? 'active' : f.status === 'Nonaktif' ? 'inactive' : 'active', wa_link: f.linkWA, admin: f.admin, cover_image: f.coverImage || '', rules: f.rules ?? [] });
const toApiStory = f => ({ title: f.judul, type: f.tipeRelasi === 'Event' ? 'event' : f.tipeRelasi === 'Komunitas' ? 'community' : 'general', event_id: f.relatedEventId ? Number(f.relatedEventId) : null, community_id: f.relatedKomunitasId ? Number(f.relatedKomunitasId) : null, category: f.kategori, tags: f.tags ? f.tags.split(',').map(t => t.trim()).filter(Boolean) : [], cover_image: f.coverImage || '', content: f.konten, author: f.penulis, published_at: f.tanggalPublish || null, publish_end_date: f.tayangSelesai || null, status: f.status === 'Published' ? 'published' : f.status === 'Pending Approval' ? 'pending' : f.status === 'Rejected' ? 'rejected' : 'draft' });
const toApiBanner = f => ({ type: f.sumber === 'Event' ? 'event' : f.sumber === 'Artikel' ? 'story' : 'community', info_id: Number(f.relatedId), status: f.aktif ? 'active' : 'inactive', order: Number(f.urutan ?? 0) });

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
    case 'ADD':
      return { ...state, [action.entity]: [...state[action.entity], { ...action.data, id: Date.now() }] };
    case 'UPDATE':
      return { ...state, [action.entity]: state[action.entity].map(item => item.id === action.data.id ? action.data : item) };
    case 'DELETE':
      return { ...state, [action.entity]: state[action.entity].filter(item => item.id !== action.id) };
    case 'SET_EVENT_STATUS':
      return { ...state, events: state.events.map(e => e.id === action.id ? { ...e, status: action.status } : e) };
    case 'SET_PENGAJUAN_STATUS':
      return { ...state, pengajuanKlub: state.pengajuanKlub.map(p => p.id === action.id ? { ...p, status: action.status, catatan: action.catatan !== undefined ? action.catatan : p.catatan } : p) };
    case 'SET_REVIEW_STATUS':
      return { ...state, reviews: state.reviews.map(r => r.id === action.id ? { ...r, status: action.status, catatan: action.catatan !== undefined ? action.catatan : r.catatan } : r) };
    case 'APPROVE_AND_CREATE_KLUB': {
      const pengajuan = state.pengajuanKlub.find(p => p.id === action.id);
      if (!pengajuan) return state;
      const kategori = state.kategoriKomunitas.find(k => k.nama === pengajuan.kategori) || state.kategoriKomunitas[0];
      const newClub = {
        id: Date.now(),
        nama: pengajuan.namaKlub,
        deskripsi: pengajuan.deskripsi,
        kategoriId: kategori?.id || 1,
        tipe: 'Eksternal',
        linkWA: '#',
        status: 'Aktif',
        jumlahMember: 0,
      };
      return {
        ...state,
        komunitas: [...state.komunitas, newClub],
        pengajuanKlub: state.pengajuanKlub.map(p => p.id === action.id ? { ...p, status: 'Approved', catatan: action.catatan || 'Approved and created as master komunitas.' } : p),
      };
    }
    case 'SET_PARTNERSHIP_STATUS':
      return { ...state, partnershipLeads: state.partnershipLeads.map(p => p.id === action.id ? { ...p, status: action.status } : p) };
    case 'REORDER_BANNERS': {
      const bannersById = Object.fromEntries(state.headBanners.map(b => [b.id, b]));
      const ordered = action.orderedIds
        .filter(id => bannersById[id])  // guard: skip missing IDs
        .map((id, index) => ({ ...bannersById[id], urutan: index }));
      return { ...state, headBanners: ordered };
    }
    case 'TOGGLE_BANNER':
      return { ...state, headBanners: state.headBanners.map(b => b.id === action.id ? { ...b, aktif: !b.aktif } : b) };
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const fmt = (n) => Number(n).toLocaleString('id-ID');
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ status }) {
  const map = {
    'Aktif': 'bg-green-100 text-green-700', 'Nonaktif': 'bg-gray-100 text-gray-500',
    'Published': 'bg-green-100 text-green-700', 'Draft': 'bg-gray-100 text-gray-600',
    'Selesai': 'bg-blue-100 text-blue-700', 'Cancelled': 'bg-red-100 text-red-600',
    'Registration Open': 'bg-green-100 text-green-700', 'Sold Out': 'bg-orange-100 text-orange-700',
    'Check-in': 'bg-indigo-100 text-indigo-700', 'Recap Pending': 'bg-yellow-100 text-yellow-700',
    'Recap Published': 'bg-blue-100 text-blue-700', 'New': 'bg-blue-100 text-blue-700',
    'In Review': 'bg-yellow-100 text-yellow-700', 'Qualified': 'bg-green-100 text-green-700',
    'Pending': 'bg-yellow-100 text-yellow-700', 'Pending Approval': 'bg-yellow-100 text-yellow-700', 'Approved': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-600', 'Lunas': 'bg-green-100 text-green-700',
    'Gratis': 'bg-blue-100 text-blue-700', 'Belum': 'bg-gray-100 text-gray-500',
    'Sudah': 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm min-w-72 ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          {t.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Hapus', confirmClass = 'bg-red-600 hover:bg-red-700' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm text-white rounded-lg ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, size = 'md' }) {
  if (!open) return null;
  const sz = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size] || 'max-w-lg';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${sz} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText size={28} className="text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{desc}</p>
      {action}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
function FInput(props) { return <input {...props} className={`${inputCls} ${props.className || ''}`} />; }
function FSelect({ children, ...props }) { return <select {...props} className={`${inputCls} ${props.className || ''}`}>{children}</select>; }
function FTextarea(props) { return <textarea {...props} className={`${inputCls} resize-none ${props.className || ''}`} />; }
function ImageUploadField({ value, onChange }) {
  const ref = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      if (!window.confirm(`Ukuran file ${(file.size / 1024 / 1024).toFixed(1)}MB melebihi 2MB. Lanjutkan?`)) {
        e.target.value = '';
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.onerror = () => alert('Gagal membaca file. Coba pilih file lain.');
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="flex items-center gap-3">
          <img
            src={value}
            alt="preview"
            className="h-16 w-auto rounded-lg border border-gray-200 object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => { onChange(''); if (ref.current) ref.current.value = ''; }}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >Hapus</button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => { if (ref.current) ref.current.value = ''; ref.current?.click(); }}
        className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Image size={14} /> {value ? 'Ganti Gambar' : 'Pilih Gambar'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
const NAV_STRUCTURE = [
  {
    section: 'Master', icon: <Layers size={15} />,
    items: [
      { key: 'master-kat-komunitas', label: 'Kategori Komunitas', icon: <Tag size={15} /> },
      { key: 'master-kat-event', label: 'Kategori Event', icon: <Tag size={15} /> },
      { key: 'master-venue', label: 'Venue', icon: <MapPin size={15} /> },
      { key: 'master-komunitas', label: 'Komunitas', icon: <Building2 size={15} /> },
    ],
  },
  {
    section: 'Manajemen Event', icon: <Calendar size={15} />,
    items: [
      { key: 'event-list', label: 'List Event', icon: <FileText size={15} /> },
      { key: 'event-kalender', label: 'Kalender Event', icon: <Calendar size={15} /> },
      { key: 'event-partisipan', label: 'Partisipan Event', icon: <Users size={15} /> },
    ],
  },
  {
    section: 'Manajemen Klub', icon: <Users size={15} />,
    items: [
      { key: 'klub-list', label: 'List Klub', icon: <BarChart2 size={15} /> },
      { key: 'klub-pengajuan', label: 'Pengajuan Klub', icon: <FileText size={15} /> },
      { key: 'verifikasi-review', label: 'Verifikasi Review', icon: <Star size={15} /> },
    ],
  },
  {
    section: 'Kemitraan', icon: <Handshake size={15} />,
    items: [
      { key: 'partnership-leads', label: 'Pengajuan EO & Sponsor', icon: <Handshake size={15} /> },
    ],
  },
  {
    section: 'Manajemen Stories', icon: <FileText size={15} />,
    items: [
      { key: 'stories-list', label: 'List Stories', icon: <FileText size={15} /> },
    ],
  },
  {
    section: 'Konten', icon: <Image size={15} />,
    items: [
      { key: 'banner-community', label: 'Head Banner Community', icon: <Image size={15} /> },
    ],
  },
];

function Sidebar({ currentPage, onNav, pendingPengajuan, pendingReviews, pendingLeads, pendingStories }) {
  const [collapsed, setCollapsed] = useState({});
  return (
    <div className="w-60 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-40">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">DP</div>
          <div>
            <div className="font-semibold text-sm leading-tight">D'Paragon</div>
            <div className="text-xs text-gray-400">Web Manajemen</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_STRUCTURE.map(({ section, icon, items }) => (
          <div key={section}>
            <button
              onClick={() => setCollapsed(p => ({ ...p, [section]: !p[section] }))}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 rounded-lg hover:bg-gray-800"
            >
              <span className="flex items-center gap-2">{icon}{section}</span>
              <ChevronDown size={13} className={`transition-transform ${collapsed[section] ? '-rotate-90' : ''}`} />
            </button>
            {!collapsed[section] && (
              <div className="mt-0.5 space-y-0.5">
                {items.map(({ key, label, icon: itemIcon }) => (
                  <button
                    key={key}
                    onClick={() => onNav(key)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-colors ${currentPage === key ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2">{itemIcon}{label}</span>
                    {key === 'klub-pengajuan' && pendingPengajuan > 0 && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingPengajuan}</span>
                    )}
                    {key === 'verifikasi-review' && pendingReviews > 0 && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingReviews}</span>
                    )}
                    {key === 'partnership-leads' && pendingLeads > 0 && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingLeads}</span>
                    )}
                    {key === 'stories-list' && pendingStories > 0 && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingStories}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">Simulasi UX · v1.0</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: KATEGORI KOMUNITAS
// ═══════════════════════════════════════════════════════════════
function KategoriKomunitasPage({ state, dispatch, toast, loadData }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nama: '', deskripsi: '' });
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => { setForm({ nama: '', deskripsi: '' }); setErrors({}); setModal({ mode: 'add' }); };
  const openEdit = (item) => { setForm({ nama: item.nama, deskripsi: item.deskripsi }); setErrors({}); setModal({ mode: 'edit', data: item }); };

  const handleSubmit = async () => {
    if (!form.nama.trim()) { setErrors({ nama: 'Nama wajib diisi' }); return; }
    if (modal.mode === 'add') {
      await apiCall(`/api/master?type=community-categories`, 'POST', { name: form.nama, description: form.deskripsi });
      await loadData();
      toast('success', 'Kategori berhasil ditambahkan');
    } else {
      await apiCall(`/api/master?type=community-categories&id=${modal.data.id}`, 'PATCH', { name: form.nama, description: form.deskripsi });
      await loadData();
      toast('success', 'Kategori berhasil diperbarui');
    }
    setModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kategori Komunitas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola label kategori untuk komunitas</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Tambah
        </button>
      </div>
      {state.kategoriKomunitas.length === 0 ? (
        <EmptyState title="Belum ada kategori" desc="Tambahkan kategori komunitas pertama" action={<button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Tambah</button>} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nama</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Deskripsi</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {state.kategoriKomunitas.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 text-sm">{item.nama}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm">{item.deskripsi || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Tambah Kategori Komunitas' : 'Edit Kategori Komunitas'} onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Nama Kategori *" error={errors.nama}>
            <FInput value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Contoh: Olahraga" />
          </Field>
          <Field label="Deskripsi">
            <FTextarea value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} rows={3} placeholder="Deskripsi singkat kategori ini" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget} title="Hapus Kategori?"
        message={`Yakin ingin menghapus kategori "${deleteTarget?.nama}"?`}
        onConfirm={async () => { await apiCall(`/api/master?type=community-categories&id=${deleteTarget.id}`, 'DELETE'); await loadData(); toast('success', 'Kategori dihapus'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: KATEGORI EVENT
// ═══════════════════════════════════════════════════════════════
function KategoriEventPage({ state, dispatch, toast, loadData }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nama: '', deskripsi: '' });
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => { setForm({ nama: '', deskripsi: '' }); setErrors({}); setModal({ mode: 'add' }); };
  const openEdit = (item) => { setForm({ nama: item.nama, deskripsi: item.deskripsi }); setErrors({}); setModal({ mode: 'edit', data: item }); };

  const handleSubmit = async () => {
    if (!form.nama.trim()) { setErrors({ nama: 'Nama wajib diisi' }); return; }
    if (modal.mode === 'add') { await apiCall(`/api/master?type=event-categories`, 'POST', { name: form.nama, description: form.deskripsi }); await loadData(); toast('success', 'Kategori event ditambahkan'); }
    else { await apiCall(`/api/master?type=event-categories&id=${modal.data.id}`, 'PATCH', { name: form.nama, description: form.deskripsi }); await loadData(); toast('success', 'Kategori event diperbarui'); }
    setModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kategori Event</h1>
          <p className="text-sm text-gray-500">Kelola jenis event untuk standarisasi pelaporan</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah</button>
      </div>
      {state.kategoriEvent.length === 0 ? (
        <EmptyState title="Belum ada kategori event" desc="Tambahkan kategori event pertama" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nama</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Deskripsi</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {state.kategoriEvent.map(item => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 text-sm">{item.nama}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm">{item.deskripsi || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Tambah Kategori Event' : 'Edit Kategori Event'} onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Nama Kategori *" error={errors.nama}>
            <FInput value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Contoh: Workshop" />
          </Field>
          <Field label="Deskripsi">
            <FTextarea value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} rows={3} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget} title="Hapus Kategori?" message={`Yakin hapus "${deleteTarget?.nama}"?`}
        onConfirm={async () => { await apiCall(`/api/master?type=event-categories&id=${deleteTarget.id}`, 'DELETE'); await loadData(); toast('success', 'Kategori dihapus'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: VENUE
// ═══════════════════════════════════════════════════════════════
const KOTA_LIST = ['Jakarta', 'Semarang', 'Malang', 'Yogyakarta', 'Surabaya', 'Solo', 'Banjarmasin', 'Palembang'];

function VenuePage({ state, dispatch, toast, loadData }) {
  const blank = { nama: '', alamat: '', kapasitas: '', kota: '', mapsLink: '' };
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterKota, setFilterKota] = useState('Semua');

  const activeFilterCount = [search.trim() !== '', filterKota !== 'Semua'].filter(Boolean).length;
  const resetFilters = () => { setSearch(''); setFilterKota('Semua'); };
  const filteredVenue = state.venue.filter(v =>
    (search.trim() === '' || v.nama.toLowerCase().includes(search.trim().toLowerCase())) &&
    (filterKota === 'Semua' || v.kota === filterKota)
  );

  const openAdd = () => { setForm(blank); setErrors({}); setModal({ mode: 'add' }); };
  const openEdit = (v) => { setForm({ nama: v.nama, alamat: v.alamat, kapasitas: String(v.kapasitas), kota: v.kota || '', mapsLink: v.mapsLink || '' }); setErrors({}); setModal({ mode: 'edit', data: v }); };

  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = 'Nama venue wajib diisi';
    if (!form.alamat.trim()) e.alamat = 'Alamat wajib diisi';
    if (!form.kapasitas || isNaN(Number(form.kapasitas)) || Number(form.kapasitas) <= 0) e.kapasitas = 'Kapasitas harus berupa angka positif';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const data = { ...form, kapasitas: Number(form.kapasitas) };
    if (modal.mode === 'add') { await apiCall(`/api/master?type=venues`, 'POST', toApiVenue(data)); await loadData(); toast('success', 'Venue berhasil ditambahkan'); }
    else {
      const updated = { ...modal.data, ...data };
      await apiCall(`/api/master?type=venues&id=${updated.id}`, 'PATCH', toApiVenue(updated)); await loadData();
      if (detail?.id === modal.data.id) setDetail(updated);
      toast('success', 'Venue berhasil diperbarui');
    }
    setModal(null);
  };

  if (detail) {
    const v = state.venue.find(x => x.id === detail.id) || detail;
    return (
      <div>
        <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Kembali ke List Venue
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-lg font-bold text-gray-900">Detail Venue</h1>
            <div className="flex gap-1">
              <button onClick={() => openEdit(v)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 size={13} /> Edit</button>
              <button onClick={() => setDeleteTarget(v)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={13} /> Hapus</button>
            </div>
          </div>
          <div className="space-y-4">
            <div><p className="text-xs text-gray-400 mb-0.5">Nama Venue</p><p className="font-semibold text-gray-900">{v.nama}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Alamat</p><p className="text-sm text-gray-700">{v.alamat}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Kapasitas</p><p className="text-sm font-semibold text-gray-900">{fmt(v.kapasitas)} orang</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Kota</p><p className="text-sm text-gray-700">{v.kota || '—'}</p></div>
            {v.mapsLink && <div><p className="text-xs text-gray-400 mb-0.5">Google Maps</p><a href={v.mapsLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{v.mapsLink}</a></div>}
          </div>
        </div>
        <Modal open={!!modal} title="Edit Venue" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Nama Venue *" error={errors.nama}><FInput value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} /></Field>
            <Field label="Alamat *" error={errors.alamat}><FTextarea value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} rows={2} /></Field>
            <Field label="Kota"><FSelect value={form.kota} onChange={e => setForm(p => ({ ...p, kota: e.target.value }))}><option value="">-- Pilih Kota --</option>{KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}</FSelect></Field>
            <Field label="Kapasitas (orang) *" error={errors.kapasitas}><FInput type="number" value={form.kapasitas} onChange={e => setForm(p => ({ ...p, kapasitas: e.target.value }))} /></Field>
            <Field label="Link Google Maps (opsional)"><FInput value={form.mapsLink} onChange={e => setForm(p => ({ ...p, mapsLink: e.target.value }))} placeholder="https://maps.google.com/..." /></Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </Modal>
        <ConfirmDialog
          open={!!deleteTarget} title="Hapus Venue?" message={`Yakin hapus venue "${deleteTarget?.nama}"?`}
          onConfirm={async () => { await apiCall(`/api/master?type=venues&id=${deleteTarget.id}`, 'DELETE'); await loadData(); toast('success', 'Venue dihapus'); setDeleteTarget(null); setDetail(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Venue</h1>
          <p className="text-sm text-gray-500">Database lokasi penyelenggaraan acara</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah Venue</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
        <button onClick={() => setFilterOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <span className="flex items-center gap-2">
            Filter Lanjutan
            {activeFilterCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </span>
          <ChevronDown size={15} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Cari Nama Venue">
                <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama venue..." />
              </Field>
              <Field label="Kota">
                <FSelect value={filterKota} onChange={e => setFilterKota(e.target.value)}>
                  <option value="Semua">Semua Kota</option>
                  {KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </FSelect>
              </Field>
            </div>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
      </div>

      {filteredVenue.length === 0 ? (
        <EmptyState title="Tidak ada venue" desc={activeFilterCount > 0 ? 'Tidak ada venue yang cocok dengan filter.' : 'Tambahkan venue pertama'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Venue</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Alamat</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kota</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kapasitas</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredVenue.map(v => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 text-sm">{v.nama}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm max-w-xs truncate">{v.alamat}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 font-medium">{v.kota || '—'}</td>
                  <td className="px-5 py-3 text-right text-sm text-gray-700 font-medium">{fmt(v.kapasitas)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setDetail(v)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                      <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteTarget(v)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Tambah Venue' : 'Edit Venue'} onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Nama Venue *" error={errors.nama}>
            <FInput value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Nama venue" />
          </Field>
          <Field label="Alamat *" error={errors.alamat}>
            <FTextarea value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} rows={2} placeholder="Alamat lengkap" />
          </Field>
          <Field label="Kota">
            <FSelect value={form.kota} onChange={e => setForm(p => ({ ...p, kota: e.target.value }))}>
              <option value="">-- Pilih Kota --</option>
              {KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
            </FSelect>
          </Field>
          <Field label="Kapasitas (orang) *" error={errors.kapasitas}>
            <FInput type="number" value={form.kapasitas} onChange={e => setForm(p => ({ ...p, kapasitas: e.target.value }))} placeholder="200" />
          </Field>
          <Field label="Link Google Maps (opsional)">
            <FInput value={form.mapsLink} onChange={e => setForm(p => ({ ...p, mapsLink: e.target.value }))} placeholder="https://maps.google.com/..." />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget} title="Hapus Venue?" message={`Yakin hapus venue "${deleteTarget?.nama}"?`}
        onConfirm={async () => { await apiCall(`/api/master?type=venues&id=${deleteTarget.id}`, 'DELETE'); await loadData(); toast('success', 'Venue dihapus'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: KOMUNITAS
// ═══════════════════════════════════════════════════════════════
function KomunitasPage({ state, dispatch, toast, loadData }) {
  const blankForm = () => ({ nama: '', deskripsi: '', kategoriId: String(state.kategoriKomunitas[0]?.id || ''), tipe: 'Internal', kota: '', linkWA: '', status: 'Aktif', coverImage: '', galeri: [], admin: '', rules: [] });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterKota, setFilterKota] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterTipe, setFilterTipe] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const activeFilterCount = [search.trim() !== '', filterKota !== 'Semua', filterKategori !== 'Semua', filterTipe !== 'Semua', filterStatus !== 'Semua'].filter(Boolean).length;
  const resetFilters = () => { setSearch(''); setFilterKota('Semua'); setFilterKategori('Semua'); setFilterTipe('Semua'); setFilterStatus('Semua'); };
  const filtered = state.komunitas.filter(k =>
    (search.trim() === '' || k.nama.toLowerCase().includes(search.trim().toLowerCase())) &&
    (filterKota === 'Semua' || k.kota === filterKota) &&
    (filterKategori === 'Semua' || String(k.kategoriId) === filterKategori) &&
    (filterTipe === 'Semua' || k.tipe === filterTipe) &&
    (filterStatus === 'Semua' || k.status === filterStatus)
  );
  const getKat = (id) => state.kategoriKomunitas.find(k => k.id === Number(id));

  const openAdd = () => { setForm(blankForm()); setErrors({}); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    setForm({ nama: item.nama, deskripsi: item.deskripsi, kategoriId: String(item.kategoriId), tipe: item.tipe, kota: item.kota || '', linkWA: item.linkWA, status: item.status, coverImage: item.coverImage || '', galeri: item.galeri || [], admin: item.admin || '', rules: item.rules || [] });
    setErrors({});
    setModal({ mode: 'edit', data: item });
  };

  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = 'Nama komunitas wajib diisi';
    if (!form.linkWA.trim()) e.linkWA = 'Link grup WA wajib diisi';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const galeriArr = Array.isArray(form.galeri) ? form.galeri : (form.galeri || '').split('\n').filter(Boolean);
    const payload = { ...form, kategoriId: Number(form.kategoriId), galeri: galeriArr };
    if (modal.mode === 'add') {
      await apiCall(`/api/communities`, 'POST', toApiKomunitas(payload)); await loadData();
      toast('success', 'Komunitas berhasil ditambahkan');
    } else {
      await apiCall(`/api/communities?id=${modal.data.id}`, 'PATCH', toApiKomunitas(payload)); await loadData();
      toast('success', 'Komunitas berhasil diperbarui');
    }
    setModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Komunitas</h1>
          <p className="text-sm text-gray-500">Database induk partner komunitas</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah Komunitas</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
        <button onClick={() => setFilterOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <span className="flex items-center gap-2">
            Filter Lanjutan
            {activeFilterCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </span>
          <ChevronDown size={15} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Cari Komunitas">
                <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama komunitas..." />
              </Field>
              <Field label="Kota">
                <FSelect value={filterKota} onChange={e => setFilterKota(e.target.value)}>
                  <option value="Semua">Semua Kota</option>
                  {KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </FSelect>
              </Field>
              <Field label="Kategori">
                <FSelect value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
                  <option value="Semua">Semua Kategori</option>
                  {state.kategoriKomunitas.map(k => <option key={k.id} value={String(k.id)}>{k.nama}</option>)}
                </FSelect>
              </Field>
              <Field label="Tipe">
                <FSelect value={filterTipe} onChange={e => setFilterTipe(e.target.value)}>
                  <option value="Semua">Semua Tipe</option>
                  <option value="Internal">Internal</option>
                  <option value="Eksternal">Eksternal</option>
                </FSelect>
              </Field>
              <Field label="Status">
                <FSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </FSelect>
              </Field>
            </div>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada komunitas" desc={activeFilterCount > 0 ? 'Tidak ada komunitas yang cocok dengan filter.' : 'Tambahkan komunitas pertama'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Komunitas</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kota</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">{item.nama[0]}</div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{item.nama}</div>
                        <div className="text-xs text-gray-400 max-w-48 truncate">{item.deskripsi}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 font-medium">{item.kota || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{getKat(item.kategoriId)?.nama || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.tipe === 'Internal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{item.tipe}</span>
                  </td>
                  <td className="px-5 py-3 text-center font-semibold text-gray-900 text-sm">{item.jumlahMember}</td>
                  <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Tambah Komunitas' : 'Edit Komunitas'} onClose={() => setModal(null)} size="lg">
        <div className="space-y-4">
          <Field label="Nama Komunitas *" error={errors.nama}>
            <FInput value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Nama komunitas" />
          </Field>
          <Field label="Deskripsi">
            <FTextarea value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} rows={3} placeholder="Deskripsi komunitas" />
          </Field>
          <Field label="Foto Komunitas">
            <ImageUploadField value={form.coverImage} onChange={v => setForm(p => ({ ...p, coverImage: v }))} />
          </Field>
          <Field label="Galeri Foto (URL, satu per baris)">
            <FTextarea
              value={Array.isArray(form.galeri) ? form.galeri.join('\n') : form.galeri}
              onChange={e => setForm(p => ({ ...p, galeri: e.target.value.split('\n').filter(Boolean) }))}
              rows={3}
              placeholder={"https://...\nhttps://..."}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori">
              <FSelect value={form.kategoriId} onChange={e => setForm(p => ({ ...p, kategoriId: e.target.value }))}>
                {state.kategoriKomunitas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </FSelect>
            </Field>
            <Field label="Tipe">
              <FSelect value={form.tipe} onChange={e => setForm(p => ({ ...p, tipe: e.target.value }))}>
                <option>Internal</option>
                <option>Eksternal</option>
              </FSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kota">
              <FSelect value={form.kota} onChange={e => setForm(p => ({ ...p, kota: e.target.value }))}>
                <option value="">-- Pilih Kota --</option>
                {form.kota && !KOTA_LIST.includes(form.kota) && <option value={form.kota}>{form.kota}</option>}
                {KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
              </FSelect>
            </Field>
            <Field label="Admin">
              <FInput value={form.admin} onChange={e => setForm(p => ({ ...p, admin: e.target.value }))} placeholder="Nama admin komunitas" />
            </Field>
          </div>
          <Field label="Link Grup WhatsApp *" error={errors.linkWA}>
            <FInput value={form.linkWA} onChange={e => setForm(p => ({ ...p, linkWA: e.target.value }))} placeholder="https://chat.whatsapp.com/..." />
          </Field>
          <Field label="Status">
            <FSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option>Aktif</option>
              <option>Nonaktif</option>
            </FSelect>
          </Field>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Rules</label>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, rules: [...(p.rules || []), ''] }))}
                className="text-xs px-2.5 py-1 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >+ Tambah Aturan</button>
            </div>
            <div className="space-y-2">
              {(form.rules || []).map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <FInput
                    value={rule}
                    onChange={e => setForm(p => ({ ...p, rules: p.rules.map((r, idx) => idx === i ? e.target.value : r) }))}
                    placeholder="Aturan komunitas..."
                  />
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, rules: p.rules.filter((_, idx) => idx !== i) }))}
                    className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  ><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget} title="Hapus Komunitas?" message={`Yakin hapus komunitas "${deleteTarget?.nama}"?`}
        onConfirm={async () => { await apiCall(`/api/communities?id=${deleteTarget.id}`, 'DELETE'); await loadData(); toast('success', 'Komunitas dihapus'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: LIST EVENT
// ═══════════════════════════════════════════════════════════════
function ListEventPage({ state, dispatch, toast, onNav, loadData }) {
  const blankForm = () => ({
    nama: '', deskripsi: '', kategoriEventId: String(state.kategoriEvent[0]?.id || ''),
    venueId: String(state.venue[0]?.id || ''), tanggalMulai: '', tanggalSelesai: '', kuota: '', harga: '',
    coverImage: '', jamMulai: '', jamSelesai: '', organizer: '', sponsor: '', agenda: [], fasilitas: [],
  });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [detail, setDetail] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterKategoriEvent, setFilterKategoriEvent] = useState('Semua');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const getKatEvent = (id) => state.kategoriEvent.find(k => k.id === Number(id));
  const getVenue = (id) => state.venue.find(v => v.id === Number(id));
  const activeFilterCount = [search.trim() !== '', filterKategoriEvent !== 'Semua', dateFrom !== '', dateTo !== ''].filter(Boolean).length;
  const resetFilters = () => { setSearch(''); setFilterKategoriEvent('Semua'); setDateFrom(''); setDateTo(''); };
  const filtered = state.events.filter(e =>
    (filterStatus === 'Semua' || e.status === filterStatus) &&
    (search.trim() === '' || e.nama.toLowerCase().includes(search.trim().toLowerCase())) &&
    (filterKategoriEvent === 'Semua' || String(e.kategoriEventId) === filterKategoriEvent) &&
    (dateFrom === '' || e.tanggalMulai >= dateFrom) &&
    (dateTo === '' || e.tanggalMulai <= dateTo)
  );

  const openAdd = () => { setForm(blankForm()); setErrors({}); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    setForm({
      nama: item.nama, deskripsi: item.deskripsi, kategoriEventId: String(item.kategoriEventId),
      venueId: String(item.venueId), tanggalMulai: item.tanggalMulai, tanggalSelesai: item.tanggalSelesai,
      kuota: String(item.kuota), harga: String(item.harga),
      coverImage: item.coverImage || '', jamMulai: item.jamMulai || '', jamSelesai: item.jamSelesai || '',
      organizer: item.organizer || '', sponsor: item.sponsor || '',
      agenda: item.agenda || [], fasilitas: item.fasilitas || [],
    });
    setErrors({});
    setModal({ mode: 'edit', data: item });
  };

  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = 'Nama event wajib diisi';
    if (!form.tanggalMulai) e.tanggalMulai = 'Tanggal mulai wajib diisi';
    if (!form.tanggalSelesai) e.tanggalSelesai = 'Tanggal selesai wajib diisi';
    if (!form.kuota || isNaN(Number(form.kuota)) || Number(form.kuota) <= 0) e.kuota = 'Kuota harus berupa angka positif';
    if (form.harga === '' || isNaN(Number(form.harga)) || Number(form.harga) < 0) e.harga = 'Harga tidak valid (0 untuk gratis)';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const data = {
      ...form,
      kategoriEventId: Number(form.kategoriEventId), venueId: Number(form.venueId),
      kuota: Number(form.kuota), harga: Number(form.harga),
      agenda: form.agenda, fasilitas: form.fasilitas,
    };
    if (modal.mode === 'add') { await apiCall(`/api/events`, 'POST', toApiEvent({ ...data, status: 'Draft' })); await loadData(); toast('success', 'Event berhasil dibuat'); }
    else {
      const updated = { ...modal.data, ...data };
      await apiCall(`/api/events?id=${updated.id}`, 'PATCH', toApiEvent(updated)); await loadData();
      if (detail?.id === modal.data.id) setDetail(updated);
      toast('success', 'Event berhasil diperbarui');
    }
    setModal(null);
  };

  const handleStatusChange = async (ev, newStatus) => {
    await apiCall(`/api/events?id=${ev.id}&action=status`, 'PATCH', { status: newStatus }); await loadData();
    if (detail?.id === ev.id) setDetail(prev => ({ ...prev, status: newStatus }));
    const msg = {
      'Registration Open': 'Event dibuka untuk pendaftaran',
      'Check-in': 'Event masuk tahap check-in',
      'Recap Pending': 'Event selesai, menunggu recap',
      'Recap Published': 'Recap event dipublikasikan',
      Cancelled: 'Event berhasil dibatalkan',
    }[newStatus] || 'Status diperbarui';
    toast('success', msg);
    setStatusAction(null);
  };

  // Detail view
  if (detail) {
    const ev = state.events.find(x => x.id === detail.id) || detail;
    return (
      <div>
        <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Kembali ke List Event
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1"><StatusBadge status={ev.status} /><span className="text-xs text-gray-400">{getKatEvent(ev.kategoriEventId)?.nama}</span></div>
              <h1 className="text-lg font-bold text-gray-900">{ev.nama}</h1>
            </div>
            <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
              {ev.status === 'Draft' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Registration Open' })} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">Open Registration</button>}
              {ev.status === 'Registration Open' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Check-in' })} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Start Check-in</button>}
              {ev.status === 'Check-in' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Recap Pending' })} className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600">Close Event</button>}
              {ev.status === 'Recap Pending' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Recap Published' })} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Publish Recap</button>}
              {ev.status === 'Registration Open' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Cancelled' })} className="px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200">Cancel</button>}
              {(ev.status === 'Draft' || ev.status === 'Registration Open') && <button onClick={() => openEdit(ev)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 size={13} /> Edit</button>}
              <button onClick={() => onNav('event-partisipan', ev.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Users size={13} /> Partisipan</button>
              {ev.status === 'Draft' && <button onClick={() => setDeleteTarget(ev)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={13} /> Hapus</button>}
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Deskripsi</p><p className="text-gray-700 leading-relaxed">{ev.deskripsi}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400 mb-0.5">Tanggal</p><p className="font-medium text-gray-900">{fmtDate(ev.tanggalMulai)}{ev.tanggalMulai !== ev.tanggalSelesai ? ` – ${fmtDate(ev.tanggalSelesai)}` : ''}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Venue</p><p className="font-medium text-gray-900">{getVenue(ev.venueId)?.nama}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Kuota</p><p className="font-medium text-gray-900">{fmt(ev.kuota)} orang</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Harga</p><p className="font-medium text-gray-900">{ev.harga === 0 ? 'Gratis' : `Rp ${fmt(ev.harga)}`}</p></div>
            </div>
          </div>
        </div>
        <Modal open={!!modal} title="Edit Event" onClose={() => setModal(null)} size="lg">
          <div className="space-y-4">
            <Field label="Nama Event *" error={errors.nama}><FInput value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} /></Field>
            <Field label="Deskripsi"><FTextarea value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} rows={3} /></Field>
            <Field label="Foto Event"><ImageUploadField value={form.coverImage} onChange={v => setForm(p => ({ ...p, coverImage: v }))} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kategori"><FSelect value={form.kategoriEventId} onChange={e => setForm(p => ({ ...p, kategoriEventId: e.target.value }))}>{state.kategoriEvent.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</FSelect></Field>
              <Field label="Venue"><FSelect value={form.venueId} onChange={e => setForm(p => ({ ...p, venueId: e.target.value }))}>{state.venue.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}</FSelect></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Mulai *" error={errors.tanggalMulai}><FInput type="date" value={form.tanggalMulai} onChange={e => setForm(p => ({ ...p, tanggalMulai: e.target.value }))} /></Field>
              <Field label="Tanggal Selesai *" error={errors.tanggalSelesai}><FInput type="date" value={form.tanggalSelesai} onChange={e => setForm(p => ({ ...p, tanggalSelesai: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jam Mulai *"><FInput type="time" value={form.jamMulai} onChange={e => setForm(p => ({ ...p, jamMulai: e.target.value }))} /></Field>
              <Field label="Jam Selesai"><FInput type="time" value={form.jamSelesai} onChange={e => setForm(p => ({ ...p, jamSelesai: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Organizer"><FInput value={form.organizer} onChange={e => setForm(p => ({ ...p, organizer: e.target.value }))} /></Field>
              <Field label="Sponsor / Partner"><FInput value={form.sponsor} onChange={e => setForm(p => ({ ...p, sponsor: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kuota *" error={errors.kuota}><FInput type="number" value={form.kuota} onChange={e => setForm(p => ({ ...p, kuota: e.target.value }))} /></Field>
              <Field label="Harga (0 = gratis) *" error={errors.harga}><FInput type="number" value={form.harga} onChange={e => setForm(p => ({ ...p, harga: e.target.value }))} /></Field>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Agenda Acara</div>
              <div className="space-y-2 mb-2">
                {form.agenda.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <FInput type="time" value={row.jam} style={{ width: 100 }} onChange={e => setForm(p => ({ ...p, agenda: p.agenda.map((r, j) => j === i ? { ...r, jam: e.target.value } : r) }))} />
                    <FInput className="flex-1" value={row.kegiatan} placeholder="Kegiatan..." onChange={e => setForm(p => ({ ...p, agenda: p.agenda.map((r, j) => j === i ? { ...r, kegiatan: e.target.value } : r) }))} />
                    <button type="button" onClick={() => setForm(p => ({ ...p, agenda: p.agenda.filter((_, j) => j !== i) }))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, agenda: [...p.agenda, { jam: '', kegiatan: '' }] }))} className="text-xs text-blue-600 hover:underline">+ Tambah Sesi</button>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Fasilitas yang Didapat</div>
              <div className="space-y-2 mb-2">
                {form.fasilitas.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <FInput className="flex-1" value={item} placeholder="Fasilitas..." onChange={e => setForm(p => ({ ...p, fasilitas: p.fasilitas.map((f, j) => j === i ? e.target.value : f) }))} />
                    <button type="button" onClick={() => setForm(p => ({ ...p, fasilitas: p.fasilitas.filter((_, j) => j !== i) }))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, fasilitas: [...p.fasilitas, ''] }))} className="text-xs text-blue-600 hover:underline">+ Tambah Fasilitas</button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </Modal>
        <ConfirmDialog
          open={!!statusAction}
          title="Ubah Status Event?"
          message={`Event "${statusAction?.event?.nama}" akan dipindahkan ke status ${statusAction?.newStatus}.`}
          confirmLabel="Ubah Status"
          confirmClass={statusAction?.newStatus === 'Cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          onConfirm={() => handleStatusChange(statusAction.event, statusAction.newStatus)}
          onCancel={() => setStatusAction(null)}
        />
        <ConfirmDialog
          open={!!deleteTarget} title="Hapus Event?" message={`Yakin hapus event "${deleteTarget?.nama}"?`}
          onConfirm={async () => { await apiCall(`/api/events?id=${deleteTarget.id}`, 'DELETE'); await loadData(); toast('success', 'Event dihapus'); setDeleteTarget(null); setDetail(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">List Event</h1>
          <p className="text-sm text-gray-500">Dashboard pengelolaan siklus hidup event</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Buat Event</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['Semua', 'Draft', 'Registration Open', 'Check-in', 'Recap Pending', 'Recap Published', 'Cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
        <button onClick={() => setFilterOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <span className="flex items-center gap-2">
            Filter Lanjutan
            {activeFilterCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </span>
          <ChevronDown size={15} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Cari Nama Event">
                <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama event..." />
              </Field>
              <Field label="Kategori">
                <FSelect value={filterKategoriEvent} onChange={e => setFilterKategoriEvent(e.target.value)}>
                  <option value="Semua">Semua Kategori</option>
                  {state.kategoriEvent.map(k => <option key={k.id} value={String(k.id)}>{k.nama}</option>)}
                </FSelect>
              </Field>
              <Field label="Tanggal Event Dari">
                <FInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </Field>
              <Field label="Tanggal Event Sampai">
                <FInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </Field>
            </div>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada event" desc={filterStatus !== 'Semua' || activeFilterCount > 0 ? 'Tidak ada event yang cocok dengan filter.' : 'Buat event pertama'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Venue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kuota</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => (
                <tr key={ev.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm max-w-48 truncate">{ev.nama}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{getKatEvent(ev.kategoriEventId)?.nama}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">{fmtDate(ev.tanggalMulai)}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm max-w-36 truncate">{getVenue(ev.venueId)?.nama}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{fmt(ev.kuota)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700 whitespace-nowrap">{ev.harga === 0 ? <span className="text-green-600 font-medium">Gratis</span> : `Rp ${fmt(ev.harga)}`}</td>
                  <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setDetail(ev)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                      {(ev.status === 'Draft' || ev.status === 'Registration Open') && <button onClick={() => openEdit(ev)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={14} /></button>}
                      {ev.status === 'Draft' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Registration Open' })} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Open Registration"><CheckCircle size={14} /></button>}
                      {ev.status === 'Registration Open' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Check-in' })} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Start Check-in"><CheckCircle size={14} /></button>}
                      {ev.status === 'Check-in' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Recap Pending' })} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Close Event"><CheckCircle size={14} /></button>}
                      {ev.status === 'Recap Pending' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Recap Published' })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Publish Recap"><FileText size={14} /></button>}
                      {ev.status === 'Registration Open' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Cancelled' })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Cancel"><XCircle size={14} /></button>}
                      <button onClick={() => onNav('event-partisipan', ev.id)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Partisipan"><Users size={14} /></button>
                      {ev.status === 'Draft' && <button onClick={() => setDeleteTarget(ev)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Buat Event Baru' : 'Edit Event'} onClose={() => setModal(null)} size="lg">
        <div className="space-y-4">
          <Field label="Nama Event *" error={errors.nama}><FInput value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Nama event" /></Field>
          <Field label="Deskripsi"><FTextarea value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} rows={3} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori Event"><FSelect value={form.kategoriEventId} onChange={e => setForm(p => ({ ...p, kategoriEventId: e.target.value }))}>{state.kategoriEvent.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</FSelect></Field>
            <Field label="Venue"><FSelect value={form.venueId} onChange={e => setForm(p => ({ ...p, venueId: e.target.value }))}>{state.venue.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}</FSelect></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal Mulai *" error={errors.tanggalMulai}><FInput type="date" value={form.tanggalMulai} onChange={e => setForm(p => ({ ...p, tanggalMulai: e.target.value }))} /></Field>
            <Field label="Tanggal Selesai *" error={errors.tanggalSelesai}><FInput type="date" value={form.tanggalSelesai} onChange={e => setForm(p => ({ ...p, tanggalSelesai: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kuota (orang) *" error={errors.kuota}><FInput type="number" value={form.kuota} onChange={e => setForm(p => ({ ...p, kuota: e.target.value }))} placeholder="100" /></Field>
            <Field label="Harga (0 = gratis) *" error={errors.harga}><FInput type="number" value={form.harga} onChange={e => setForm(p => ({ ...p, harga: e.target.value }))} placeholder="75000" /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!statusAction}
        title="Ubah Status Event?"
        message={`Event "${statusAction?.event?.nama}" akan dipindahkan ke status ${statusAction?.newStatus}.`}
        confirmLabel="Ubah Status"
        confirmClass={statusAction?.newStatus === 'Cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
        onConfirm={() => handleStatusChange(statusAction.event, statusAction.newStatus)}
        onCancel={() => setStatusAction(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget} title="Hapus Event?" message={`Yakin hapus event "${deleteTarget?.nama}"?`}
        onConfirm={async () => { await apiCall(`/api/events?id=${deleteTarget.id}`, 'DELETE'); await loadData(); toast('success', 'Event dihapus'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: KALENDER EVENT
// ═══════════════════════════════════════════════════════════════
function KalenderEventPage({ state }) {
  const [viewDate, setViewDate] = useState(new Date(2026, 3, 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return state.events.filter(ev => ev.status !== 'Cancelled' && ev.tanggalMulai <= dateStr && ev.tanggalSelesai >= dateStr);
  };

  const dotColor = { 'Registration Open': 'bg-green-500', Draft: 'bg-gray-400', 'Check-in': 'bg-indigo-500', 'Recap Pending': 'bg-yellow-500', 'Recap Published': 'bg-blue-500' };
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Kalender Event</h1>
        <p className="text-sm text-gray-500">Visual jadwal seluruh event dalam satu tampilan</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <h2 className="font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const evs = getEventsForDay(day);
            const isSelected = selectedDay === day;
            const isToday = day === 1 && month === 3 && year === 2026;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`min-h-14 p-1.5 rounded-lg border text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : isToday ? 'border-blue-200 bg-blue-50/40' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>{day}</span>
                {evs.slice(0, 2).map(ev => (
                  <div key={ev.id} className={`h-1.5 rounded-full mb-0.5 ${dotColor[ev.status] || 'bg-gray-300'}`} title={ev.nama} />
                ))}
                {evs.length > 2 && <span className="text-xs text-gray-400">+{evs.length - 2}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-5 mt-4 pt-4 border-t border-gray-100">
          {Object.entries(dotColor).map(([label, cls]) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${cls}`} />{label}
            </div>
          ))}
        </div>
      </div>
      {selectedDay && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">
            Event {selectedDay} {MONTHS[month]} {year}
            {selectedEvents.length === 0 && <span className="font-normal text-gray-400 ml-2">— Tidak ada event</span>}
          </h3>
          {selectedEvents.map(ev => (
            <div key={ev.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 mb-1"><StatusBadge status={ev.status} /></div>
              <h4 className="font-medium text-gray-900">{ev.nama}</h4>
              <p className="text-sm text-gray-500 mt-1">{ev.deskripsi}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: PARTISIPAN EVENT
// ═══════════════════════════════════════════════════════════════
function PartisipanEventPage({ state, initialEventId }) {
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || null);
  const [search, setSearch] = useState('');

  const partisipan = state.partisipan.filter(p => p.eventId === Number(selectedEventId));
  const filtered = partisipan.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: partisipan.length,
    lunas: partisipan.filter(p => ['Lunas', 'Gratis'].includes(p.statusBayar)).length,
    pending: partisipan.filter(p => p.statusBayar === 'Pending').length,
    checkin: partisipan.filter(p => p.statusCheckIn === 'Sudah').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Partisipan Event</h1>
        <p className="text-sm text-gray-500">Data rekapitulasi pendaftar per event</p>
      </div>
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Event</label>
        <FSelect value={selectedEventId || ''} onChange={e => { setSelectedEventId(e.target.value); setSearch(''); }} className="max-w-lg">
          <option value="">— Pilih event —</option>
          {state.events.map(ev => <option key={ev.id} value={ev.id}>{ev.nama} ({ev.status})</option>)}
        </FSelect>
      </div>
      {!selectedEventId ? (
        <EmptyState title="Pilih event dahulu" desc="Pilih event dari dropdown di atas untuk melihat daftar partisipan" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total Pendaftar', value: stats.total, cls: 'text-gray-900' },
              { label: 'Pembayaran OK', value: stats.lunas, cls: 'text-green-600' },
              { label: 'Menunggu Bayar', value: stats.pending, cls: 'text-yellow-600' },
              { label: 'Sudah Check-In', value: stats.checkin, cls: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 shrink-0">
              <Download size={15} /> Export CSV
            </button>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="Tidak ada partisipan" desc={search ? 'Coba kata kunci lain' : 'Belum ada yang mendaftar untuk event ini'} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">No. HP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status Bayar</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{p.nama}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{p.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{p.noHp}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.statusBayar} /></td>
                      <td className="px-4 py-3"><StatusBadge status={p.statusCheckIn} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: LIST KLUB
// ═══════════════════════════════════════════════════════════════
function ListKlubPage({ state }) {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterKota, setFilterKota] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterTipe, setFilterTipe] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const getKat = (id) => state.kategoriKomunitas.find(k => k.id === Number(id));
  const activeFilterCount = [search.trim() !== '', filterKota !== 'Semua', filterKategori !== 'Semua', filterTipe !== 'Semua', filterStatus !== 'Semua'].filter(Boolean).length;
  const resetFilters = () => { setSearch(''); setFilterKota('Semua'); setFilterKategori('Semua'); setFilterTipe('Semua'); setFilterStatus('Semua'); };
  const filtered = state.komunitas.filter(k =>
    (search.trim() === '' || k.nama.toLowerCase().includes(search.trim().toLowerCase())) &&
    (filterKota === 'Semua' || k.kota === filterKota) &&
    (filterKategori === 'Semua' || String(k.kategoriId) === filterKategori) &&
    (filterTipe === 'Semua' || k.tipe === filterTipe) &&
    (filterStatus === 'Semua' || k.status === filterStatus)
  );
  const totalMember = state.komunitas.reduce((a, k) => a + k.jumlahMember, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">List Klub</h1>
        <p className="text-sm text-gray-500">Monitoring anggota per klub/komunitas</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Klub Aktif', value: state.komunitas.filter(k => k.status === 'Aktif').length, cls: 'text-green-600' },
          { label: 'Total Klub', value: state.komunitas.length, cls: 'text-gray-900' },
          { label: 'Total Member', value: totalMember, cls: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
        <button onClick={() => setFilterOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <span className="flex items-center gap-2">
            Filter Lanjutan
            {activeFilterCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </span>
          <ChevronDown size={15} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Cari Komunitas">
                <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama komunitas..." />
              </Field>
              <Field label="Kota">
                <FSelect value={filterKota} onChange={e => setFilterKota(e.target.value)}>
                  <option value="Semua">Semua Kota</option>
                  {KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </FSelect>
              </Field>
              <Field label="Kategori">
                <FSelect value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
                  <option value="Semua">Semua Kategori</option>
                  {state.kategoriKomunitas.map(k => <option key={k.id} value={String(k.id)}>{k.nama}</option>)}
                </FSelect>
              </Field>
              <Field label="Tipe">
                <FSelect value={filterTipe} onChange={e => setFilterTipe(e.target.value)}>
                  <option value="Semua">Semua Tipe</option>
                  <option value="Internal">Internal</option>
                  <option value="Eksternal">Eksternal</option>
                </FSelect>
              </Field>
              <Field label="Status">
                <FSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </FSelect>
              </Field>
            </div>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada klub" desc={activeFilterCount > 0 ? 'Tidak ada klub yang cocok dengan filter.' : 'Belum ada klub terdaftar'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Komunitas</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kota</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(klub => (
                <tr key={klub.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">{klub.nama[0]}</div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{klub.nama}</div>
                        <div className="text-xs text-gray-400 max-w-48 truncate">{klub.deskripsi}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 font-medium">{klub.kota || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{getKat(klub.kategoriId)?.nama || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${klub.tipe === 'Internal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{klub.tipe}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-900 text-lg leading-tight">{klub.jumlahMember}</span>
                      <span className="text-xs text-gray-400">member</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={klub.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: PENGAJUAN KLUB
// ═══════════════════════════════════════════════════════════════
function PengajuanKlubPage({ state, dispatch, toast, loadData }) {
  const [actionModal, setActionModal] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [catatanError, setCatatanError] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [detail, setDetail] = useState(null);

  const filtered = state.pengajuanKlub.filter(p => filterStatus === 'Semua' || p.status === filterStatus);
  const pendingCount = state.pengajuanKlub.filter(p => p.status === 'Pending').length;

  const handleAction = async () => {
    if (actionModal.action === 'reject' && !catatan.trim()) { setCatatanError('Alasan penolakan wajib diisi'); return; }
    const newStatus = actionModal.action === 'approve' ? 'Approved' : 'Rejected';
    if (actionModal.action === 'approve') {
      await apiCall(`/api/communities?id=${actionModal.pengajuan.id}`, 'PATCH', { status: 'active', notes: catatan }); await loadData();
      if (detail?.id === actionModal.pengajuan.id) setDetail(prev => ({ ...prev, status: newStatus, catatan: catatan || 'Approved and created as master komunitas.' }));
      toast('success', 'Pengajuan disetujui dan komunitas dibuat');
    } else {
      const apiStatus = newStatus === 'Approved' ? 'active' : newStatus === 'Rejected' ? 'rejected' : 'pending';
      await apiCall(`/api/communities?id=${actionModal.pengajuan.id}`, 'PATCH', { status: apiStatus, notes: catatan }); await loadData();
      if (detail?.id === actionModal.pengajuan.id) setDetail(prev => ({ ...prev, status: newStatus, catatan }));
      toast('success', 'Pengajuan ditolak');
    }
    setActionModal(null); setCatatan(''); setCatatanError('');
  };

  const openAction = (p, action) => { setActionModal({ pengajuan: p, action }); setCatatan(''); setCatatanError(''); };

  // Detail view
  if (detail) {
    const p = state.pengajuanKlub.find(x => x.id === detail.id) || detail;
    const statusBorder = { Pending: 'border-l-yellow-400', Approved: 'border-l-green-500', Rejected: 'border-l-red-400' };
    return (
      <div>
        <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Pengajuan Klub
        </button>
        <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${statusBorder[p.status]} p-6 max-w-2xl`}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1"><StatusBadge status={p.status} /><span className="text-xs text-gray-400">{p.kategori}</span></div>
              <h1 className="text-lg font-bold text-gray-900">{p.namaKlub}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Diajukan: {fmtDate(p.tanggalAjuan)}</p>
            </div>
            {p.status === 'Pending' && (
              <div className="flex gap-2">
                <button onClick={() => openAction(p, 'approve')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"><CheckCircle size={12} /> Approve</button>
                <button onClick={() => openAction(p, 'reject')} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200"><XCircle size={12} /> Reject</button>
              </div>
            )}
          </div>
          <div className="space-y-4 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Deskripsi</p><p className="text-gray-700 leading-relaxed">{p.deskripsi}</p></div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Data PIC</p>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-400 mb-0.5">Nama</p><p className="font-medium text-gray-900">{p.namaPIC}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Email</p><p className="text-gray-700">{p.emailPIC}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">No. HP</p><p className="text-gray-700">{p.noHpPIC}</p></div>
              </div>
            </div>
            {p.catatan && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1 font-semibold uppercase">Catatan Admin</p>
                <p className="text-gray-700">{p.catatan}</p>
              </div>
            )}
          </div>
        </div>
        <Modal
          open={!!actionModal}
          title={actionModal?.action === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
          onClose={() => { setActionModal(null); setCatatan(''); setCatatanError(''); }}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{actionModal?.pengajuan?.namaKlub}</p>
              <p className="text-xs text-gray-500 mt-0.5">PIC: {actionModal?.pengajuan?.namaPIC}</p>
            </div>
            {actionModal?.action === 'approve' ? (
              <>
                <p className="text-sm text-gray-600">Komunitas ini akan disetujui dan langsung dibuat sebagai master komunitas aktif.</p>
                <Field label="Catatan (opsional)"><FTextarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} placeholder="Catatan untuk pengaju..." /></Field>
              </>
            ) : (
              <Field label="Alasan Penolakan *" error={catatanError}>
                <FTextarea value={catatan} onChange={e => { setCatatan(e.target.value); setCatatanError(''); }} rows={3} placeholder="Contoh: Dokumen belum lengkap..." />
              </Field>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setActionModal(null); setCatatan(''); setCatatanError(''); }} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleAction} className={`flex-1 text-white rounded-lg py-2 text-sm ${actionModal?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {actionModal?.action === 'approve' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengajuan Klub</h1>
          <p className="text-sm text-gray-500">Review proposal komunitas baru dari pihak eksternal</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">{pendingCount} menunggu review</span>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        {['Semua', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada pengajuan" desc={filterStatus !== 'Semua' ? `Tidak ada pengajuan dengan status ${filterStatus}` : 'Belum ada pengajuan masuk'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Klub</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">PIC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tgl Ajuan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 text-sm">{p.namaKlub}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm">{p.kategori}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm">{p.namaPIC}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm whitespace-nowrap">{fmtDate(p.tanggalAjuan)}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setDetail(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                      {p.status === 'Pending' && (
                        <>
                          <button onClick={() => openAction(p, 'approve')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><CheckCircle size={14} /></button>
                          <button onClick={() => openAction(p, 'reject')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Reject"><XCircle size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={!!actionModal}
        title={actionModal?.action === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
        onClose={() => { setActionModal(null); setCatatan(''); setCatatanError(''); }}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{actionModal?.pengajuan?.namaKlub}</p>
            <p className="text-xs text-gray-500 mt-0.5">PIC: {actionModal?.pengajuan?.namaPIC}</p>
          </div>
          {actionModal?.action === 'approve' ? (
            <>
              <p className="text-sm text-gray-600">Komunitas ini akan disetujui dan langsung dibuat sebagai master komunitas aktif.</p>
              <Field label="Catatan (opsional)"><FTextarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} placeholder="Catatan untuk pengaju..." /></Field>
            </>
          ) : (
            <Field label="Alasan Penolakan *" error={catatanError}>
              <FTextarea value={catatan} onChange={e => { setCatatan(e.target.value); setCatatanError(''); }} rows={3} placeholder="Contoh: Dokumen belum lengkap..." />
            </Field>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setActionModal(null); setCatatan(''); setCatatanError(''); }} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleAction} className={`flex-1 text-white rounded-lg py-2 text-sm ${actionModal?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {actionModal?.action === 'approve' ? 'Setujui' : 'Tolak'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORIES MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════
const STORY_KATEGORI = ['Rekap Event', 'Komunitas', 'Lifestyle', 'Berita', 'Inspirasi', 'Umum'];

const EMPTY_STORY_FORM = {
  judul: '', tipeRelasi: 'Umum', relatedEventId: '', relatedKomunitasId: '',
  kategori: 'Umum', tags: '', penulis: '', coverImage: '', konten: '', tanggalPublish: '', tayangSelesai: '', status: 'Draft',
};

function StoriesListPage({ state, dispatch, toast, loadData }) {
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [formModal, setFormModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', story }
  const [form, setForm] = useState(EMPTY_STORY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // story being rejected
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');

  const pendingCount = state.stories.filter(s => s.status === 'Pending Approval').length;

  const openReject = (story) => { setRejectModal(story); setRejectReason(''); setRejectReasonError(''); };
  const closeReject = () => { setRejectModal(null); setRejectReason(''); setRejectReasonError(''); };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setRejectReasonError('Alasan penolakan wajib diisi'); return; }
    await apiCall(`/api/stories?id=${rejectModal.id}`, 'PATCH', { status: 'rejected' }); await loadData();
    toast('success', 'Story ditolak.');
    closeReject();
  };

  // Prefill helpers — called explicitly from onChange handlers (no stale closure risk)
  const applyEventPrefill = (evId, currentForm) => {
    if (!evId) return currentForm;
    const ev = state.events.find(e => e.id === Number(evId));
    if (!ev) return currentForm;
    const judulPrefix = 'Recap: ';
    return {
      ...currentForm,
      judul: currentForm.judul === '' || currentForm.judul.startsWith(judulPrefix) ? `${judulPrefix}${ev.nama}` : currentForm.judul,
      tanggalPublish: currentForm.tanggalPublish === '' ? ev.tanggalSelesai : currentForm.tanggalPublish,
      kategori: currentForm.kategori === 'Umum' ? 'Rekap Event' : currentForm.kategori,
    };
  };

  const applyKomunitasPrefill = (komId, currentForm) => {
    if (!komId) return currentForm;
    const kom = state.komunitas.find(k => k.id === Number(komId));
    if (!kom) return currentForm;
    const judulPrefix = 'Spotlight: ';
    return {
      ...currentForm,
      judul: currentForm.judul === '' || currentForm.judul.startsWith(judulPrefix) ? `${judulPrefix}${kom.nama}` : currentForm.judul,
      kategori: currentForm.kategori === 'Umum' ? 'Komunitas' : currentForm.kategori,
    };
  };

  const openAdd = () => {
    setForm(EMPTY_STORY_FORM);
    setFormErrors({});
    setFormModal({ mode: 'add' });
  };

  const openEdit = (story) => {
    setForm({
      judul: story.judul,
      tipeRelasi: story.tipeRelasi,
      relatedEventId: story.relatedEventId ? String(story.relatedEventId) : '',
      relatedKomunitasId: story.relatedKomunitasId ? String(story.relatedKomunitasId) : '',
      kategori: story.kategori,
      tags: story.tags || '',
      penulis: story.penulis || '',
      coverImage: story.coverImage || '',
      konten: story.konten || '',
      tanggalPublish: story.tanggalPublish || '',
      tayangSelesai: story.tayangSelesai || '',
      status: story.status,
    });
    setFormErrors({});
    setFormModal({ mode: 'edit', story });
  };

  const closeModal = () => { setFormModal(null); setFormErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.judul.trim()) e.judul = 'Judul wajib diisi';
    if (form.tipeRelasi === 'Event' && !form.relatedEventId) e.relatedEventId = 'Pilih event terkait';
    if (form.tipeRelasi === 'Komunitas' && !form.relatedKomunitasId) e.relatedKomunitasId = 'Pilih komunitas terkait';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    const data = {
      ...form,
      relatedEventId: form.relatedEventId ? Number(form.relatedEventId) : null,
      relatedKomunitasId: form.relatedKomunitasId ? Number(form.relatedKomunitasId) : null,
    };
    if (formModal.mode === 'add') {
      await apiCall(`/api/stories`, 'POST', toApiStory(data)); await loadData();
      toast('success', 'Story berhasil ditambahkan!');
    } else {
      await apiCall(`/api/stories?id=${formModal.story.id}`, 'PATCH', toApiStory(data)); await loadData();
      toast('success', 'Story berhasil diperbarui!');
    }
    closeModal();
  };

  const handleDelete = async () => {
    await apiCall(`/api/stories?id=${deleteConfirm.id}`, 'DELETE'); await loadData();
    toast('success', 'Story berhasil dihapus.');
    setDeleteConfirm(null);
  };

  const getRelasiLabel = (story) => {
    if (story.tipeRelasi === 'Event') {
      const ev = state.events.find(e => e.id === story.relatedEventId);
      return ev ? ev.nama : `Event #${story.relatedEventId}`;
    }
    if (story.tipeRelasi === 'Komunitas') {
      const kom = state.komunitas.find(k => k.id === story.relatedKomunitasId);
      return kom ? kom.nama : `Komunitas #${story.relatedKomunitasId}`;
    }
    return '—';
  };

  const filtered = state.stories.filter(s => filterStatus === 'Semua' || s.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Stories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola artikel, recap event, dan spotlight komunitas</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">{pendingCount} menunggu review</span>
          )}
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus size={15} /> Tambah Story
          </button>
        </div>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['Semua', 'Draft', 'Pending Approval', 'Published', 'Rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
          >{s}</button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} story</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada story"
          desc={filterStatus === 'Semua' ? 'Mulai buat story pertama Anda.' : `Tidak ada story dengan status ${filterStatus}.`}
          action={<button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Tambah Story</button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Judul</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Relasi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Periode Tayang</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(story => (
                <tr key={story.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{story.judul}</div>
                      {story.submitterEmail && (
                        <span className="shrink-0 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Dari Web</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{story.kategori}{story.tags ? ` · ${story.tags}` : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${story.tipeRelasi === 'Event' ? 'bg-purple-100 text-purple-700' : story.tipeRelasi === 'Komunitas' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {story.tipeRelasi}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{getRelasiLabel(story)}</td>
                  <td className="px-4 py-3"><StatusBadge status={story.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {story.tanggalPublish ? fmtDate(story.tanggalPublish) : '—'}
                    {story.tayangSelesai ? ` s/d ${fmtDate(story.tayangSelesai)}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {story.status === 'Pending Approval' && (
                        <button onClick={() => openReject(story)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Reject"><XCircle size={14} /></button>
                      )}
                      <button onClick={() => openEdit(story)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title={story.status === 'Pending Approval' ? 'Tinjau & Publish' : 'Edit'}><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(story)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={!!formModal}
        title={formModal?.mode === 'add' ? 'Tambah Story Baru' : 'Edit Story'}
        onClose={closeModal}
        size="lg"
      >
        <div className="space-y-4">
          <Field label="Tipe Relasi *">
            <FSelect value={form.tipeRelasi} onChange={e => {
              const newTipe = e.target.value;
              setForm(f => ({ ...f, tipeRelasi: newTipe, relatedEventId: '', relatedKomunitasId: '', tanggalPublish: newTipe !== f.tipeRelasi ? '' : f.tanggalPublish }));
            }}>
              <option value="Event">Event</option>
              <option value="Komunitas">Komunitas</option>
              <option value="Umum">Umum (artikel biasa)</option>
            </FSelect>
          </Field>

          {form.tipeRelasi === 'Event' && (
            <Field label="Event Terkait *" error={formErrors.relatedEventId}>
              <FSelect value={form.relatedEventId} onChange={e => {
                const evId = e.target.value;
                setForm(f => applyEventPrefill(evId, { ...f, relatedEventId: evId }));
              }}>
                <option value="">— Pilih Event —</option>
                {state.events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.nama} ({ev.status})</option>
                ))}
              </FSelect>
            </Field>
          )}

          {form.tipeRelasi === 'Komunitas' && (
            <Field label="Komunitas Terkait *" error={formErrors.relatedKomunitasId}>
              <FSelect value={form.relatedKomunitasId} onChange={e => {
                const komId = e.target.value;
                setForm(f => applyKomunitasPrefill(komId, { ...f, relatedKomunitasId: komId }));
              }}>
                <option value="">— Pilih Komunitas —</option>
                {state.komunitas.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.kota})</option>
                ))}
              </FSelect>
            </Field>
          )}

          <Field label="Judul *" error={formErrors.judul}>
            <FInput value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} placeholder="Judul artikel / recap / spotlight" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori">
              <FSelect value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}>
                {STORY_KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
              </FSelect>
            </Field>
            <Field label="Tags (pisah koma)">
              <FInput value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="bisnis, networking, recap" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Penulis">
              <FInput value={form.penulis} onChange={e => setForm(f => ({ ...f, penulis: e.target.value }))} placeholder="Nama penulis atau tim redaksi" />
            </Field>
            <Field label="Cover Image">
              <ImageUploadField value={form.coverImage} onChange={v => setForm(f => ({ ...f, coverImage: v }))} />
            </Field>
          </div>

          <Field label="Konten">
            <FTextarea value={form.konten} onChange={e => setForm(f => ({ ...f, konten: e.target.value }))} rows={6} placeholder="Tulis isi artikel di sini..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Periode Tayang (Mulai)">
              <FInput type="date" value={form.tanggalPublish} onChange={e => setForm(f => ({ ...f, tanggalPublish: e.target.value }))} />
            </Field>
            <Field label="Periode Tayang (Selesai)">
              <FInput type="date" value={form.tayangSelesai} onChange={e => setForm(f => ({ ...f, tayangSelesai: e.target.value }))} />
            </Field>
          </div>

          <Field label="Status">
            <FSelect value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {form.status === 'Pending Approval' && <option value="Pending Approval">Pending Approval (dari pengajuan web)</option>}
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Rejected">Rejected</option>
            </FSelect>
            {form.status === 'Pending Approval' && (
              <p className="mt-1.5 text-xs text-gray-400">Pilih Published atau Rejected untuk menindaklanjuti pengajuan ini.</p>
            )}
          </Field>

          {formModal?.story && (formModal.story.submitterEmail || formModal.story.submitterPhone) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">Kontak Pengaju (via Ajukan Story)</p>
              <p className="text-sm text-blue-700">{formModal.story.submitterEmail || '-'} · {formModal.story.submitterPhone || '-'}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
              {formModal?.mode === 'add' ? 'Simpan Story' : 'Perbarui Story'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Hapus Story"
        message={`Yakin ingin menghapus "${deleteConfirm?.judul}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        title="Tolak Story"
        onClose={closeReject}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{rejectModal?.judul}</p>
            <p className="text-xs text-gray-500 mt-0.5">Penulis: {rejectModal?.penulis || '-'}</p>
          </div>
          <Field label="Alasan Penolakan *" error={rejectReasonError}>
            <FTextarea value={rejectReason} onChange={e => { setRejectReason(e.target.value); setRejectReasonError(''); }} rows={3} placeholder="Contoh: Konten belum sesuai pedoman komunitas..." />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={closeReject} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleReject} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700">Tolak</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: HEAD BANNER COMMUNITY
// ═══════════════════════════════════════════════════════════════
const SUMBER_COLORS = {
  'Artikel': 'bg-purple-100 text-purple-700',
  'Event': 'bg-blue-100 text-blue-700',
  'Komunitas': 'bg-green-100 text-green-700',
  'Custom': 'bg-orange-100 text-orange-700',
};

const BLANK_BANNER_FORM = { sumber: 'Artikel', relatedId: '', judul: '', gambar: '', linkTujuan: '', aktif: true };

function BannerCommunityPage({ state, dispatch, toast, loadData }) {
  const [formModal, setFormModal] = useState(null);
  const [form, setForm] = useState(BLANK_BANNER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const sortedBanners = [...state.headBanners].sort((a, b) => a.urutan - b.urutan);

  const openAdd = () => {
    setForm(BLANK_BANNER_FORM);
    setFormErrors({});
    setFormModal({ mode: 'add', banner: null });
  };

  const openEdit = (banner) => {
    setForm({ ...banner, relatedId: banner.relatedId ? String(banner.relatedId) : '' });
    setFormErrors({});
    setFormModal({ mode: 'edit', banner });
  };

  const closeModal = () => { setFormModal(null); setFormErrors({}); };

  const handleSumberChange = (sumber) => {
    setForm(f => ({ ...f, sumber, relatedId: '', judul: '', gambar: '', linkTujuan: '' }));
  };

  const handleRelatedChange = (relatedId) => {
    if (!relatedId) { setForm(f => ({ ...f, relatedId: '', linkTujuan: '' })); return; }
    const id = Number(relatedId);
    let update = { relatedId };
    if (form.sumber === 'Artikel') {
      const story = state.stories.find(s => s.id === id);
      if (story) update = { ...update, judul: story.judul, gambar: story.coverImage || '', linkTujuan: `nav:stories:detail:${id}` };
    } else if (form.sumber === 'Event') {
      const ev = state.events.find(e => e.id === id);
      if (ev) update = { ...update, judul: ev.nama, gambar: '', linkTujuan: `nav:events:detail:${id}` };
    } else if (form.sumber === 'Komunitas') {
      const kom = state.komunitas.find(k => k.id === id);
      if (kom) update = { ...update, judul: kom.nama, gambar: '', linkTujuan: `nav:clubs:detail:${id}` };
    }
    setForm(f => ({ ...f, ...update }));
  };

  const validate = () => {
    const e = {};
    if (!form.judul.trim()) e.judul = 'Judul wajib diisi';
    if (form.sumber !== 'Custom' && !form.linkTujuan) e.relatedId = `Pilih ${form.sumber} terlebih dahulu`;
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    const data = {
      ...form,
      relatedId: form.relatedId ? Number(form.relatedId) : null,
      urutan: formModal.mode === 'add'
        ? (state.headBanners.length === 0 ? 0 : Math.max(...state.headBanners.map(b => b.urutan)) + 1)
        : form.urutan,
    };
    if (formModal.mode === 'add') {
      await apiCall(`/api/banners`, 'POST', toApiBanner(data)); await loadData();
      toast('success', 'Banner berhasil ditambahkan!');
    } else {
      await apiCall(`/api/banners?id=${formModal.banner.id}`, 'PATCH', toApiBanner(data)); await loadData();
      toast('success', 'Banner berhasil diperbarui!');
    }
    closeModal();
  };

  const handleDelete = async () => {
    await apiCall(`/api/banners?id=${deleteConfirm.id}`, 'DELETE'); await loadData();
    toast('success', 'Banner berhasil dihapus.');
    setDeleteConfirm(null);
  };

  const handleToggle = async (banner) => {
    const b = state.headBanners.find(x => x.id === banner.id);
    await apiCall(`/api/banners?id=${banner.id}`, 'PATCH', { status: b?.aktif ? 'inactive' : 'active' }); await loadData();
  };

  const handleDragStart = (e, banner) => {
    e.dataTransfer.setData('bannerId', String(banner.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, bannerId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(bannerId);
  };

  const handleDrop = async (e, targetBanner) => {
    e.preventDefault();
    setDragOverId(null);
    const fromId = Number(e.dataTransfer.getData('bannerId'));
    if (fromId === targetBanner.id) return;
    const arr = [...sortedBanners];
    const fromIdx = arr.findIndex(b => b.id === fromId);
    const toIdx = arr.findIndex(b => b.id === targetBanner.id);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    await apiCall(`/api/banners?action=reorder`, 'PATCH', { items: arr.map((b, i) => ({ id: b.id, order: i })) }); await loadData();
    toast('success', 'Urutan banner diperbarui!');
  };

  const handleDragEnd = () => setDragOverId(null);

  const getEntityOptions = () => {
    if (form.sumber === 'Artikel') return state.stories.filter(s => s.status === 'Published');
    if (form.sumber === 'Event') return state.events;
    if (form.sumber === 'Komunitas') return state.komunitas.filter(k => k.status === 'Aktif');
    return [];
  };

  const getEntityLabel = (banner) => {
    if (banner.sumber === 'Artikel') {
      const s = state.stories.find(s => s.id === banner.relatedId);
      return s?.judul || `Story #${banner.relatedId}`;
    }
    if (banner.sumber === 'Event') {
      const ev = state.events.find(e => e.id === banner.relatedId);
      return ev?.nama || `Event #${banner.relatedId}`;
    }
    if (banner.sumber === 'Komunitas') {
      const k = state.komunitas.find(k => k.id === banner.relatedId);
      return k?.nama || `Komunitas #${banner.relatedId}`;
    }
    return '—';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Head Banner Community</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola banner carousel di halaman utama Web Community</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Tambah Banner
        </button>
      </div>

      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg p-3.5 mb-5 text-sm text-blue-700">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-blue-500" />
        <span>Seret baris untuk mengubah urutan. Banner aktif ditampilkan di carousel halaman utama sesuai urutan ini.</span>
      </div>

      {sortedBanners.length === 0 ? (
        <EmptyState
          title="Belum ada banner"
          desc="Tambah banner pertama untuk ditampilkan di carousel halaman utama."
          action={
            <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5 mx-auto">
              <Plus size={14} /> Tambah Banner
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {sortedBanners.map((banner, idx) => (
            <div
              key={banner.id}
              draggable
              onDragStart={(e) => handleDragStart(e, banner)}
              onDragOver={(e) => handleDragOver(e, banner.id)}
              onDrop={(e) => handleDrop(e, banner)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 transition-colors cursor-grab active:cursor-grabbing ${dragOverId === banner.id ? 'bg-blue-50 border-l-2 border-l-blue-400' : 'hover:bg-gray-50'}`}
            >
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <span className="w-5 text-xs text-gray-400 font-medium shrink-0 text-center">{idx + 1}</span>
              <div className={`w-14 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden ${banner.gambar ? '' : 'bg-gradient-to-br from-blue-400 to-indigo-600'}`}>
                {banner.gambar
                  ? <img src={banner.gambar} alt="" className="w-full h-full object-cover" />
                  : <Image size={14} className="text-white opacity-60" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{banner.judul}</div>
                {banner.sumber !== 'Custom' && (
                  <div className="text-xs text-gray-400 truncate mt-0.5">{getEntityLabel(banner)}</div>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${SUMBER_COLORS[banner.sumber] || 'bg-gray-100 text-gray-600'}`}>
                {banner.sumber}
              </span>
              <button
                onClick={() => handleToggle(banner)}
                className="shrink-0 flex items-center gap-1 text-xs font-medium"
              >
                {banner.aktif
                  ? <><ToggleRight size={20} className="text-blue-600" /><span className="text-blue-600">Aktif</span></>
                  : <><ToggleLeft size={20} className="text-gray-400" /><span className="text-gray-400">Nonaktif</span></>
                }
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(banner)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setDeleteConfirm(banner)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!formModal} title={formModal?.mode === 'add' ? 'Tambah Banner' : 'Edit Banner'} onClose={closeModal} size="lg">
        <div className="space-y-4">
          <Field label="Sumber Banner">
            <FSelect value={form.sumber} onChange={e => handleSumberChange(e.target.value)}>
              <option value="Artikel">Artikel</option>
              <option value="Event">Event</option>
              <option value="Komunitas">Komunitas</option>
              <option value="Custom">Custom</option>
            </FSelect>
          </Field>

          {form.sumber !== 'Custom' && (
            <Field label={`Pilih ${form.sumber}`} error={formErrors.relatedId}>
              <FSelect value={form.relatedId} onChange={e => handleRelatedChange(e.target.value)}>
                <option value="">-- Pilih {form.sumber} --</option>
                {getEntityOptions().map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.judul || entity.nama}
                  </option>
                ))}
              </FSelect>
            </Field>
          )}

          <Field label="Judul Banner" error={formErrors.judul}>
            <FInput
              value={form.judul}
              onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
              placeholder="Judul yang ditampilkan di carousel"
            />
          </Field>

          <Field label="Gambar (URL — kosong = gradient otomatis)">
            <FInput
              value={form.gambar}
              onChange={e => setForm(f => ({ ...f, gambar: e.target.value }))}
              placeholder="https://..."
            />
          </Field>

          {form.sumber === 'Custom' && (
            <Field label="Link Tujuan (URL)">
              <FInput
                value={form.linkTujuan}
                onChange={e => setForm(f => ({ ...f, linkTujuan: e.target.value }))}
                placeholder="https://..."
              />
            </Field>
          )}

          {form.sumber !== 'Custom' && form.linkTujuan && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Link tujuan (auto): <span className="font-mono text-gray-600">{form.linkTujuan}</span>
            </div>
          )}

          <Field label="Status Tampil">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, aktif: !f.aktif }))}
              className="flex items-center gap-2 mt-1"
            >
              {form.aktif
                ? <><ToggleRight size={22} className="text-blue-600" /><span className="text-sm text-blue-600 font-medium">Aktif — tampil di carousel</span></>
                : <><ToggleLeft size={22} className="text-gray-400" /><span className="text-sm text-gray-400">Nonaktif — disembunyikan</span></>
              }
            </button>
          </Field>

          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
              {formModal?.mode === 'add' ? 'Simpan Banner' : 'Perbarui Banner'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Hapus Banner"
        message={`Yakin ingin menghapus banner "${deleteConfirm?.judul}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: VERIFIKASI REVIEW
// ═══════════════════════════════════════════════════════════════
const STATUS_REVIEW_COLORS = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
};

function ReviewVerificationPage({ state, dispatch, toast, loadData }) {
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [rejectModal, setRejectModal] = useState(null); // review object being rejected
  const [catatan, setCatatan] = useState('');

  const filtered = state.reviews.filter(r => filterStatus === 'Semua' || r.status === filterStatus);
  const pendingCount = state.reviews.filter(r => r.status === 'Pending').length;

  const handleApprove = async (review) => {
    await apiCall(`/api/reviews?id=${review.id}`, 'PATCH', { status: 'approved' }); await loadData();
    toast('success', `Review dari ${review.userName} disetujui.`);
  };

  const handleOpenReject = (review) => {
    setCatatan('');
    setRejectModal(review);
  };

  const handleConfirmReject = async () => {
    await apiCall(`/api/reviews?id=${rejectModal.id}`, 'PATCH', { status: 'rejected' }); await loadData();
    toast('success', `Review dari ${rejectModal.userName} ditolak.`);
    setRejectModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verifikasi Review</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pendingCount > 0 ? <span className="text-yellow-600 font-medium">{pendingCount} review menunggu persetujuan</span> : 'Semua review sudah diverifikasi'}
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {['Semua', 'Pending', 'Approved', 'Rejected'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada review" desc={filterStatus === 'Semua' ? 'Belum ada review dari peserta.' : `Tidak ada review dengan status ${filterStatus}.`} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Peserta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Komentar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(review => (
                <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{review.userName}</div>
                    <div className="text-xs text-gray-400">{review.userId}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-700 max-w-[180px] line-clamp-2">{review.eventNama}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-yellow-400 text-base">{'★'.repeat(review.rating)}</span>
                    <span className="text-gray-200 text-base">{'★'.repeat(5 - review.rating)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-gray-600 max-w-[220px] line-clamp-2">{review.komentar}</p>
                    {review.catatan && review.status === 'Rejected' && (
                      <p className="text-xs text-red-500 mt-1 italic">Catatan: {review.catatan}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{review.tanggalSubmit}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_REVIEW_COLORS[review.status] || 'bg-gray-100 text-gray-600'}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {review.status === 'Pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(review)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={13} /> Setujui
                        </button>
                        <button
                          onClick={() => handleOpenReject(review)}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                        >
                          <XCircle size={13} /> Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={!!rejectModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Tolak Review</h3>
            <button onClick={() => setRejectModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="text-sm font-medium text-gray-900">{rejectModal?.userName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{rejectModal?.eventNama} · {'★'.repeat(rejectModal?.rating || 0)}</p>
            <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">&ldquo;{rejectModal?.komentar}&rdquo;</p>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">Catatan penolakan (opsional)</label>
            <FTextarea
              rows={3}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Contoh: Konten tidak sesuai dengan pedoman komunitas..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(null)} className="flex-1 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50">Batal</button>
            <button onClick={handleConfirmReject} className="flex-1 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition-colors">Konfirmasi Tolak</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: PARTNERSHIP LEADS (PENGAJUAN EO & SPONSOR)
// ═══════════════════════════════════════════════════════════════
const STATUS_LEAD_COLORS = {
  'Pending Review': 'bg-yellow-100 text-yellow-700',
  'Contacted': 'bg-blue-100 text-blue-700',
  'Rejected': 'bg-red-100 text-red-700',
};

function PartnershipLeadsPage({ state, toast, loadData }) {
  const [filterTipe, setFilterTipe] = useState('EO');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [searchOrganisasi, setSearchOrganisasi] = useState('');
  const [searchPic, setSearchPic] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailLead, setDetailLead] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');

  const activeFilterCount = [
    filterStatus !== 'Semua',
    searchOrganisasi.trim() !== '',
    searchPic.trim() !== '',
    dateFrom !== '',
    dateTo !== '',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilterStatus('Semua'); setSearchOrganisasi(''); setSearchPic(''); setDateFrom(''); setDateTo('');
  };

  const filtered = state.partnershipLeads.filter(l =>
    l.tipe === filterTipe &&
    (filterStatus === 'Semua' || l.status === filterStatus) &&
    (searchOrganisasi.trim() === '' || l.organisasi?.toLowerCase().includes(searchOrganisasi.trim().toLowerCase())) &&
    (searchPic.trim() === '' || l.pic?.toLowerCase().includes(searchPic.trim().toLowerCase())) &&
    (dateFrom === '' || (l.tanggalAjuan && l.tanggalAjuan >= dateFrom)) &&
    (dateTo === '' || (l.tanggalAjuan && l.tanggalAjuan <= dateTo))
  );
  const newCount = state.partnershipLeads.filter(l => l.status === 'Pending Review').length;

  const handleMarkContacted = async (lead) => {
    const resource = lead._source === 'organizer' ? 'organizers' : 'sponsors';
    await apiCall(`/api/${resource}?id=${lead.id}`, 'PATCH', { status: 'contacted' });
    await loadData();
    toast('success', `${lead.organisasi} ditandai sudah dihubungi.`);
  };

  const openReject = (lead) => { setRejectModal(lead); setRejectReason(''); setRejectReasonError(''); };
  const closeReject = () => { setRejectModal(null); setRejectReason(''); setRejectReasonError(''); };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setRejectReasonError('Alasan penolakan wajib diisi'); return; }
    const resource = rejectModal._source === 'organizer' ? 'organizers' : 'sponsors';
    await apiCall(`/api/${resource}?id=${rejectModal.id}`, 'PATCH', { status: 'rejected', notes: rejectReason });
    await loadData();
    toast('success', `Pengajuan ${rejectModal.organisasi} ditolak.`);
    closeReject();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengajuan EO & Sponsor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {newCount > 0 ? <span className="text-yellow-600 font-medium">{newCount} pengajuan baru</span> : 'Semua pengajuan sudah ditindaklanjuti'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {['EO', 'Sponsor'].map(t => (
          <button
            key={t}
            onClick={() => setFilterTipe(t)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterTipe === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
          >{t}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
        <button
          onClick={() => setFilterOpen(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            Filter Lanjutan
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>
            )}
          </span>
          <ChevronDown size={15} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Status">
                <FSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  {['Semua', 'Pending Review', 'Contacted', 'Rejected'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </FSelect>
              </Field>
              <div />
              <Field label="Cari Organisasi">
                <FInput value={searchOrganisasi} onChange={e => setSearchOrganisasi(e.target.value)} placeholder="Nama organisasi/brand..." />
              </Field>
              <Field label="Cari PIC">
                <FInput value={searchPic} onChange={e => setSearchPic(e.target.value)} placeholder="Nama PIC..." />
              </Field>
              <Field label="Tanggal Ajuan Dari">
                <FInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </Field>
              <Field label="Tanggal Ajuan Sampai">
                <FInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </Field>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada pengajuan" desc="Pengajuan EO/Sponsor dari web customer akan muncul di sini." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe</th>
                {filterTipe === 'Sponsor' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe Pengajuan</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisasi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PIC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No. HP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kebutuhan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => (
                <tr key={`${lead._source}-${lead.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.tipe === 'EO' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                      {lead.tipe}
                    </span>
                  </td>
                  {filterTipe === 'Sponsor' && (
                    <td className="px-4 py-4 text-gray-600">{lead.subTipe}</td>
                  )}
                  <td className="px-4 py-4 font-medium text-gray-900">{lead.organisasi}</td>
                  <td className="px-4 py-4 text-gray-600">{lead.pic || '-'}</td>
                  <td className="px-4 py-4 text-gray-600">{lead.email}</td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{lead.noHp}</td>
                  <td className="px-4 py-4">
                    <p className="text-gray-600 max-w-45 line-clamp-2">{lead.kebutuhan}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{lead.tanggalAjuan}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LEAD_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDetailLead(lead)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Lihat Detail"
                      >
                        <Eye size={15} />
                      </button>
                      {lead.status === 'Pending Review' && (
                        <>
                          <button
                            onClick={() => handleMarkContacted(lead)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Tandai Dihubungi
                          </button>
                          <button
                            onClick={() => openReject(lead)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!detailLead} title="Detail Pengajuan" onClose={() => setDetailLead(null)} size="lg">
        {detailLead && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${detailLead.tipe === 'EO' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                {detailLead.tipe}
              </span>
              {detailLead.tipe === 'Sponsor' && (
                <span className="text-xs text-gray-500">{detailLead.subTipe}</span>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <DetailRow label="Organisasi / Brand" value={detailLead.organisasi} />
              <DetailRow label="PIC" value={detailLead.pic} />
              <DetailRow label="Email" value={detailLead.email} />
              <DetailRow label="No. HP" value={detailLead.noHp} />
              {detailLead.tipe === 'EO' && (
                <DetailRow label="Tanggal Event" value={detailLead.eventDate} />
              )}
              {detailLead.tipe === 'Sponsor' && (
                <DetailRow label="Periode Sponsorship" value={detailLead.sponsorStart || detailLead.sponsorEnd ? `${detailLead.sponsorStart || '-'} s/d ${detailLead.sponsorEnd || '-'}` : '-'} />
              )}
              <DetailRow label="Link Sosmed / Web" value={detailLead.website} />
              <DetailRow label="Tanggal Ajuan" value={detailLead.tanggalAjuan} />
            </div>
            {(detailLead.tipe === 'EO' || detailLead.subTipe === 'Pengajuan') && (
              <DetailRow label="Deskripsi Acara" value={detailLead.eventDesc} block />
            )}
            {(detailLead.tipe === 'EO' || detailLead.subTipe === 'Pengajuan') && (
              <DetailRow label={`Kebutuhan ${detailLead.tipe}`} value={detailLead.kebutuhan} block />
            )}
            {detailLead.tipe === 'Sponsor' && (
              <DetailRow label="Benefit" value={detailLead.benefit} block />
            )}
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Attachment</div>
              {detailLead.attachment ? (
                <a
                  href={detailLead.attachment}
                  download={detailLead.attachmentName || 'attachment'}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm"
                >
                  <FileText size={14} /> {detailLead.attachmentName || 'Unduh file'}
                </a>
              ) : (
                <p className="text-gray-400 text-sm">-</p>
              )}
            </div>
            {detailLead.status === 'Rejected' && detailLead.catatan && (
              <DetailRow label="Alasan Penolakan" value={detailLead.catatan} block />
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} title="Tolak Pengajuan" onClose={closeReject}>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{rejectModal?.organisasi}</p>
            <p className="text-xs text-gray-500 mt-0.5">PIC: {rejectModal?.pic || '-'}</p>
          </div>
          <Field label="Alasan Penolakan *" error={rejectReasonError}>
            <FTextarea value={rejectReason} onChange={e => { setRejectReason(e.target.value); setRejectReasonError(''); }} rows={3} placeholder="Contoh: Konsep belum sesuai dengan kebutuhan komunitas..." />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={closeReject} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleReject} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700">Tolak</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value, block }) {
  return (
    <div className={block ? 'col-span-2' : ''}>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-gray-700 whitespace-pre-wrap">{value || '-'}</div>
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
  const [currentPage, setCurrentPage] = useState('master-kat-komunitas');
  const [pageParams, setPageParams] = useState({});
  const [toasts, setToasts] = useState([]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/data');
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          kategoriKomunitas: data.kategoriKomunitas.map(fromApiCateg),
          kategoriEvent: data.kategoriEvent.map(fromApiCateg),
          venue: data.venue.map(fromApiVenue),
          komunitas: data.komunitas.filter(c => c.status !== 'pending').map(fromApiKomunitas),
          events: data.events.map(fromApiEvent),
          partisipan: data.partisipan.map(fromApiPartisipan),
          pengajuanKlub: data.komunitas.filter(c => c.status === 'pending').map(fromApiPengajuan),
          partnershipLeads: [
            ...data.organizers.filter(o => o.status !== 'active').map(fromApiOrgLead),
            ...data.sponsors.filter(s => s.status !== 'active').map(fromApiSponsorLead),
          ],
          stories: data.stories.map(fromApiStory),
          headBanners: data.banners.map(fromApiBanner),
          reviews: data.reviews.map(fromApiReview),
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
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  const handleNav = (page, param) => {
    setCurrentPage(page);
    setPageParams(param !== undefined ? { id: param } : {});
  };

  const sharedProps = { state, dispatch, toast: addToast, onNav: handleNav, loadData };
  const pendingPengajuan = state.pengajuanKlub.filter(p => p.status === 'Pending').length;
  const pendingReviews = state.reviews.filter(r => r.status === 'Pending').length;
  const pendingLeads = state.partnershipLeads.filter(l => l.status === 'Pending Review').length;
  const pendingStories = state.stories.filter(s => s.status === 'Pending Approval').length;


  const pageMap = {
    'master-kat-komunitas': <KategoriKomunitasPage {...sharedProps} />,
    'master-kat-event': <KategoriEventPage {...sharedProps} />,
    'master-venue': <VenuePage {...sharedProps} />,
    'master-komunitas': <KomunitasPage {...sharedProps} />,
    'event-list': <ListEventPage {...sharedProps} />,
    'event-kalender': <KalenderEventPage {...sharedProps} />,
    'event-partisipan': <PartisipanEventPage {...sharedProps} initialEventId={pageParams.id} />,
    'klub-list': <ListKlubPage {...sharedProps} />,
    'klub-pengajuan': <PengajuanKlubPage {...sharedProps} />,
    'stories-list': <StoriesListPage {...sharedProps} />,
    'verifikasi-review': <ReviewVerificationPage {...sharedProps} />,
    'partnership-leads': <PartnershipLeadsPage {...sharedProps} />,
    'banner-community': <BannerCommunityPage {...sharedProps} />,
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      {loading && (
        <div className="fixed inset-0 bg-white/70 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
        </div>
      )}
      <Sidebar currentPage={currentPage} onNav={handleNav} pendingPengajuan={pendingPengajuan} pendingReviews={pendingReviews} pendingLeads={pendingLeads} pendingStories={pendingStories} />
      <main className="ml-60 flex-1 p-7 min-h-screen">
        <div className="max-w-5xl">
          {pageMap[currentPage] ?? <EmptyState title="Halaman tidak ditemukan" desc="Pilih menu di sidebar" />}
        </div>
      </main>
      <Toast toasts={toasts} onRemove={(id) => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  );
}

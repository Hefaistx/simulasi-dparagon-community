import React, { useState, useReducer, useEffect, useRef } from 'react';
import {
  Tag, MapPin, Building2, Calendar, Users, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Download, X, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronDown, Layers, FileText, BarChart2, Eye, ArrowLeft,
  GripVertical, Image, ToggleLeft, ToggleRight, Star, Handshake
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

// ═══════════════════════════════════════════════════════════════
// DATE RANGE PICKER (shared)
// ═══════════════════════════════════════════════════════════════
const fmtISO = (d) => {
  if (!d) return '';
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const parseISO = (s) => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
function DateRangeField({ startValue, endValue, onChange, placeholder = 'Pilih rentang tanggal' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  const range = { from: parseISO(startValue), to: parseISO(endValue) };
  const label = range.from
    ? `${fmtDate(startValue)}${range.to ? ` – ${fmtDate(endValue)}` : ''}`
    : placeholder;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={range.from ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
        <Calendar size={14} className="text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={(r) => onChange(fmtISO(r?.from), fmtISO(r?.to))}
            numberOfMonths={1}
          />
          {(range.from || range.to) && (
            <button
              type="button"
              onClick={() => { onChange('', ''); }}
              className="w-full text-xs text-blue-600 hover:underline pb-1.5"
            >Reset tanggal</button>
          )}
        </div>
      )}
    </div>
  );
}

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
  communityMembers: [],
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
  tanggalMulai: e.start_date ? String(e.start_date).slice(0, 10) : e.start_date,
  tanggalSelesai: e.end_date ? String(e.end_date).slice(0, 10) : e.end_date,
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
  sponsorText: e.sponsor_name ?? '',
  organizers: e.organizers ?? [],
  sponsors: e.sponsors ?? [],
  // Rundown dari DB berbentuk { time, activity }; form & tampilan memakai { jam, kegiatan }.
  agenda: (e.agenda ?? []).map(a => ({ jam: String(a.time ?? '').slice(0, 5), kegiatan: a.activity ?? '' })),
  pendaftar: Number(e.pendaftar ?? 0),
  createdAt: e.created_at, updatedAt: e.updated_at,
});
const fromApiKomunitas = c => ({
  id: c.id,
  nama: c.name,
  deskripsi: c.description,
  kategoriId: c.category_id,
  // Klub tanpa tipe tersimpan tapi punya submitted_at berarti masuk via pengajuan web.
  tipe: c.type ?? (c.submitted_at ? 'Eksternal' : 'Internal'),
  linkWA: c.wa_link,
  status: c.status === 'active' ? 'Aktif' : c.status === 'inactive' ? 'Nonaktif' : c.status,
  jumlahMember: Number(c.jumlah_member ?? 0),
  kota: c.city,
  admin: c.admin,
  coverImage: c.cover_image ?? '',
  rules: c.rules ?? [],
  galeri: c.gallery ?? [],
  picNama: c.pic_name ?? '', picEmail: c.pic_email ?? '', picHp: c.pic_phone ?? '',
  submittedAt: c.submitted_at ?? null, catatan: c.notes ?? '', reviewedAt: c.reviewed_at ?? null,
  createdAt: c.created_at, updatedAt: c.updated_at,
});
const fromApiPengajuan = c => ({
  id: c.id,
  namaKlub: c.name,
  deskripsi: c.description,
  kategori: c.kategori_name ?? '',
  namaPIC: c.pic_name,
  emailPIC: c.pic_email,
  noHpPIC: c.pic_phone,
  status: c.status === 'active' || c.status === 'inactive' ? 'Approved' : c.status === 'rejected' ? 'Rejected' : 'Pending',
  catatan: c.notes ?? '',
  tanggalAjuan: c.submitted_at,
  reviewedAt: c.reviewed_at ?? null,
  createdAt: c.created_at, updatedAt: c.updated_at,
});
const LEAD_STATUS_LABELS = { pending: 'Pending Review', contacted: 'Contacted', rejected: 'Rejected' };
const fromApiOrgLead = o => ({
  id: o.id, _source: 'organizer', tipe: 'EO',
  organisasi: o.name, pic: o.pic, email: o.email, noHp: o.phone,
  kebutuhan: o.description ?? '', status: LEAD_STATUS_LABELS[o.status] ?? o.status,
  tanggalAjuan: o.submitted_at,
  eventDate: o.event_date ?? '', eventDateEnd: o.event_date_end ?? '', eventDesc: o.event_description ?? '', website: o.website ?? '',
  attachment: o.attachment ?? '', attachmentName: o.attachment_name ?? '',
  catatan: o.notes ?? '',
  createdAt: o.created_at, updatedAt: o.updated_at,
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
  createdAt: s.created_at, updatedAt: s.updated_at,
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
  origin: s.origin === 'external' ? 'Eksternal' : 'Internal',
  alasanTolak: s.notes ?? '',
  status: s.status === 'published' ? 'Published' : s.status === 'pending' ? 'Pending Approval' : s.status === 'rejected' ? 'Rejected' : 'Draft',
  images: s.images ?? [],
  createdAt: s.created_at, updatedAt: s.updated_at,
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
  catatan: r.notes ?? '',
  reviewedAt: r.reviewed_at ?? null,
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
const toApiKomunitas = f => ({ name: f.nama, description: f.deskripsi, category_id: f.kategoriId ? Number(f.kategoriId) : null, type: f.tipe, city: f.kota || null, status: f.status === 'Aktif' ? 'active' : f.status === 'Nonaktif' ? 'inactive' : 'active', wa_link: f.linkWA, admin: f.admin, cover_image: f.coverImage || '', rules: f.rules ?? [], gallery: f.galeri ?? [] });
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
// Kolom DATE dari API bisa datang sebagai ISO lengkap; ambil bagian tanggalnya saja.
const fmtDate = (d) => new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
function StatBox({ label, value }) {
  return (
    <div className="border border-gray-200 rounded-lg px-4 py-2.5 text-center bg-white min-w-0">
      <div className="text-xs text-gray-400 mb-0.5 whitespace-nowrap">{label}</div>
      <div className="font-bold text-gray-900 text-lg">{value}</div>
    </div>
  );
}

function ExportButtons({ toast, label = 'data', pdf = true }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => toast('success', `Export Excel ${label} berhasil (simulasi).`)}
        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
      >
        <Download size={14} /> Export Excel
      </button>
      {pdf && (
        <button
          onClick={() => toast('success', `Export PDF ${label} berhasil (simulasi).`)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
        >
          <FileText size={14} /> Export PDF
        </button>
      )}
    </div>
  );
}
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
// DETAIL PAGE KIT (dipakai semua halaman detail)
// Header + kartu konten di kiri, ringkasan di kanan, aksi di bilah bawah
// supaya admin membaca dulu sebelum mengambil keputusan.
// ═══════════════════════════════════════════════════════════════
const fmtDateSafe = (d) => (d ? fmtDate(String(d).slice(0, 10)) : '—');
const fmtRange = (a, b) => {
  if (!a && !b) return '—';
  if (!b || a === b) return fmtDateSafe(a);
  return `${fmtDateSafe(a)} – ${fmtDateSafe(b)}`;
};

function DetailBack({ label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 group">
      <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> {label}
    </button>
  );
}

function DetailHeader({ cover, badges, title, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {cover && <img src={cover} alt="" className="w-full h-52 object-cover" />}
      <div className="p-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">{badges}</div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function DetailLayout({ main, aside }) {
  return (
    <div className="grid xl:grid-cols-3 gap-5 mt-5">
      <div className="xl:col-span-2 space-y-5 min-w-0">{main}</div>
      <div className="space-y-5 min-w-0">{aside}</div>
    </div>
  );
}

function DetailCard({ title, children, tone }) {
  const toneCls = tone === 'danger' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white';
  return (
    <div className={`rounded-xl border p-5 ${toneCls}`}>
      {title && <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${tone === 'danger' ? 'text-red-700' : 'text-gray-400'}`}>{title}</h2>}
      {children}
    </div>
  );
}

function InfoItem({ label, children }) {
  const empty = children === undefined || children === null || children === '' || children === false;
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-900 break-words">{empty ? <span className="text-gray-300">—</span> : children}</div>
    </div>
  );
}

function InfoList({ children }) {
  return <div className="space-y-3">{children}</div>;
}

function ChipList({ items, empty = 'Belum ada data.' }) {
  if (!items || items.length === 0) return <p className="text-sm text-gray-400">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{it}</span>)}
    </div>
  );
}

function TextBlock({ children, empty = 'Belum ada data.' }) {
  if (!children) return <p className="text-sm text-gray-400">{empty}</p>;
  return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{children}</p>;
}

// items: [{ title, meta, note, tone: 'done' | 'ok' | 'bad' | 'wait' }]
function Timeline({ items }) {
  const dot = { done: 'bg-blue-500', ok: 'bg-green-500', bad: 'bg-red-500', wait: 'bg-gray-300' };
  return (
    <ol className="space-y-4">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${dot[it.tone] || dot.done}`} />
            {i < items.length - 1 && <span className="w-px flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="pb-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{it.title}</div>
            {it.meta && <div className="text-xs text-gray-400">{it.meta}</div>}
            {it.note && <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{it.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ActionBar({ hint, children }) {
  return (
    <div className="sticky bottom-4 mt-6 z-10">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400">{hint}</p>
        <div className="flex gap-2 flex-wrap justify-end">{children}</div>
      </div>
    </div>
  );
}

const btnPrimary = 'flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700';
const btnSuccess = 'flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700';
const btnDangerSoft = 'flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50';
const btnGhost = 'flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50';

// ═══════════════════════════════════════════════════════════════
// DETAIL: KLUB (List Klub)
// ═══════════════════════════════════════════════════════════════
function KlubDetailView({ klub, state, onBack, toast, loadData }) {
  const [kickTarget, setKickTarget] = useState(null);
  const kat = state.kategoriKomunitas.find(k => k.id === Number(klub.kategoriId));
  const members = (state.communityMembers || []).filter(m => m.communityId === klub.id);
  const events = state.events.filter(e => e.komunitasId === klub.id);
  const stories = state.stories.filter(s => s.relatedKomunitasId === klub.id && s.status === 'Published');
  const fromPengajuan = !!klub.submittedAt;

  const riwayat = fromPengajuan
    ? [
        { title: 'Diajukan', meta: `${fmtDateSafe(klub.submittedAt)}${klub.picNama ? ` · oleh ${klub.picNama}` : ''}`, tone: 'done' },
        { title: klub.status === 'Ditolak' ? 'Ditolak' : 'Disetujui', meta: fmtDateTime(klub.reviewedAt), note: klub.catatan || null, tone: klub.status === 'Ditolak' ? 'bad' : 'ok' },
      ]
    : [{ title: 'Dibuat oleh tim D\'Paragon', meta: fmtDateTime(klub.createdAt), note: 'Klub internal, tidak melalui proses pengajuan.', tone: 'done' }];

  return (
    <div>
      <DetailBack label="Kembali ke List Klub" onClick={onBack} />
      <DetailHeader
        cover={klub.coverImage}
        badges={<>
          <StatusBadge status={klub.status} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${klub.tipe === 'Internal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{klub.tipe}</span>
          {kat && <span className="text-xs text-gray-500">{kat.nama}</span>}
        </>}
        title={klub.nama}
        subtitle={klub.kota || null}
      />
      <DetailLayout
        main={<>
          <DetailCard title="Deskripsi"><TextBlock>{klub.deskripsi}</TextBlock></DetailCard>
          <DetailCard title={`Galeri Kegiatan (${(klub.galeri || []).length})`}>
            {(klub.galeri || []).length === 0 ? <p className="text-sm text-gray-400">Belum ada foto. Tambahkan lewat Master Komunitas.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {klub.galeri.map((src, i) => <img key={i} src={src} alt="" className="w-full h-28 object-cover rounded-lg" />)}
              </div>
            )}
          </DetailCard>
          <DetailCard title="Aturan Komunitas">
            {klub.rules && klub.rules.length > 0
              ? <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">{klub.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
              : <p className="text-sm text-gray-400">Belum ada aturan.</p>}
          </DetailCard>
          <DetailCard title={`Anggota (${members.length})`}>
            {members.length === 0 ? <p className="text-sm text-gray-400">Belum ada anggota.</p> : (
              <div className="divide-y divide-gray-100">
                {members.slice(0, 10).map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="min-w-0">
                      <div className="text-gray-900 truncate">{m.userName || m.userEmail}</div>
                      {m.userName && <div className="text-xs text-gray-400 truncate">{m.userEmail}</div>}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-xs text-gray-400 whitespace-nowrap">Bergabung {fmtDateSafe(m.joinedAt)}</span>
                      <button onClick={() => setKickTarget(m)} className="text-xs text-red-500 hover:underline">Keluarkan</button>
                    </div>
                  </div>
                ))}
                {members.length > 10 && <p className="text-xs text-gray-400 pt-2">dan {members.length - 10} anggota lainnya</p>}
              </div>
            )}
          </DetailCard>
          <DetailCard title={`Event Komunitas (${events.length})`}>
            {events.length === 0 ? <p className="text-sm text-gray-400">Belum ada event.</p> : (
              <div className="divide-y divide-gray-100">
                {events.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 text-sm gap-3">
                    <div className="min-w-0">
                      <div className="text-gray-900 truncate">{e.nama}</div>
                      <div className="text-xs text-gray-400">{fmtRange(e.tanggalMulai, e.tanggalSelesai)}</div>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </DetailCard>
          <DetailCard title={`Story Terpublikasi (${stories.length})`}>
            {stories.length === 0 ? <p className="text-sm text-gray-400">Belum ada story.</p> : (
              <div className="divide-y divide-gray-100">
                {stories.map(s => (
                  <div key={s.id} className="py-2 text-sm text-gray-900 truncate">{s.judul}</div>
                ))}
              </div>
            )}
          </DetailCard>
        </>}
        aside={<>
          <DetailCard title="Informasi Komunitas">
            <InfoList>
              <InfoItem label="Jumlah Member">{klub.jumlahMember} member</InfoItem>
              <InfoItem label="Kota">{klub.kota}</InfoItem>
              <InfoItem label="Kategori">{kat?.nama}</InfoItem>
              <InfoItem label="Tipe">{klub.tipe}</InfoItem>
              <InfoItem label="Admin">{klub.admin}</InfoItem>
              <InfoItem label="Link WhatsApp">{klub.linkWA && klub.linkWA !== '#' ? <a href={klub.linkWA} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{klub.linkWA}</a> : null}</InfoItem>
            </InfoList>
          </DetailCard>
          {fromPengajuan && (
            <DetailCard title="Data PIC Pengaju">
              <InfoList>
                <InfoItem label="Nama">{klub.picNama}</InfoItem>
                <InfoItem label="Email">{klub.picEmail}</InfoItem>
                <InfoItem label="No. HP">{klub.picHp}</InfoItem>
              </InfoList>
            </DetailCard>
          )}
          <DetailCard title="Riwayat Approval"><Timeline items={riwayat} /></DetailCard>
          <DetailCard title="Catatan Sistem">
            <InfoList>
              <InfoItem label="Dibuat">{fmtDateTime(klub.createdAt)}</InfoItem>
              <InfoItem label="Diperbarui">{fmtDateTime(klub.updatedAt)}</InfoItem>
            </InfoList>
          </DetailCard>
        </>}
      />
      <ConfirmDialog
        open={!!kickTarget}
        title="Keluarkan Anggota?"
        message={`${kickTarget?.userName || kickTarget?.userEmail} akan dikeluarkan dari ${klub.nama}. Anggota masih bisa bergabung lagi dari web.`}
        confirmLabel="Keluarkan"
        onConfirm={async () => {
          await apiCall(`/api/community-members?id=${kickTarget.id}`, 'PATCH', { status: 'left' });
          await loadData();
          toast('success', 'Anggota dikeluarkan.');
          setKickTarget(null);
        }}
        onCancel={() => setKickTarget(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL: PENGAJUAN KLUB
// ═══════════════════════════════════════════════════════════════
function PengajuanKlubDetailView({ p, onBack, onApprove, onReject }) {
  const riwayat = [
    { title: 'Diajukan', meta: `${fmtDateSafe(p.tanggalAjuan)}${p.namaPIC ? ` · oleh ${p.namaPIC}` : ''}`, tone: 'done' },
    p.status === 'Pending'
      ? { title: 'Menunggu keputusan admin', tone: 'wait' }
      : { title: p.status === 'Approved' ? 'Disetujui' : 'Ditolak', meta: fmtDateTime(p.reviewedAt), note: p.catatan || null, tone: p.status === 'Approved' ? 'ok' : 'bad' },
  ];
  return (
    <div>
      <DetailBack label="Kembali ke Pengajuan Klub" onClick={onBack} />
      <DetailHeader
        badges={<><StatusBadge status={p.status} />{p.kategori && <span className="text-xs text-gray-500">{p.kategori}</span>}</>}
        title={p.namaKlub}
        subtitle={`Diajukan ${fmtDateSafe(p.tanggalAjuan)}`}
      />
      <DetailLayout
        main={<>
          {p.status === 'Rejected' && (
            <DetailCard title="Alasan Penolakan" tone="danger">
              <p className="text-sm text-red-700 whitespace-pre-line">{p.catatan || 'Tidak ada alasan yang dicatat.'}</p>
            </DetailCard>
          )}
          <DetailCard title="Deskripsi Komunitas"><TextBlock>{p.deskripsi}</TextBlock></DetailCard>
          <DetailCard title="Data Pengajuan">
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoItem label="Nama Komunitas">{p.namaKlub}</InfoItem>
              <InfoItem label="Kategori">{p.kategori}</InfoItem>
              <InfoItem label="Tanggal Diajukan">{fmtDateSafe(p.tanggalAjuan)}</InfoItem>
              <InfoItem label="Status">{p.status}</InfoItem>
            </div>
          </DetailCard>
          {p.status === 'Approved' && p.catatan && (
            <DetailCard title="Catatan Admin"><TextBlock>{p.catatan}</TextBlock></DetailCard>
          )}
        </>}
        aside={<>
          <DetailCard title="Data PIC">
            <InfoList>
              <InfoItem label="Nama">{p.namaPIC}</InfoItem>
              <InfoItem label="Email">{p.emailPIC ? <a href={`mailto:${p.emailPIC}`} className="text-blue-600 hover:underline">{p.emailPIC}</a> : null}</InfoItem>
              <InfoItem label="No. HP">{p.noHpPIC}</InfoItem>
            </InfoList>
          </DetailCard>
          <DetailCard title="Riwayat"><Timeline items={riwayat} /></DetailCard>
          <DetailCard title="Catatan Sistem">
            <InfoList>
              <InfoItem label="Dibuat">{fmtDateTime(p.createdAt)}</InfoItem>
              <InfoItem label="Diperbarui">{fmtDateTime(p.updatedAt)}</InfoItem>
            </InfoList>
          </DetailCard>
        </>}
      />
      {p.status === 'Pending' && (
        <ActionBar hint="Baca seluruh detail pengajuan sebelum memutuskan.">
          <button onClick={onReject} className={btnDangerSoft}><XCircle size={15} /> Reject</button>
          <button onClick={onApprove} className={btnSuccess}><CheckCircle size={15} /> Approve</button>
        </ActionBar>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL: PENGAJUAN EO & SPONSOR
// ═══════════════════════════════════════════════════════════════
function LeadDetailView({ lead, onBack, onMarkContacted }) {
  const isEO = lead.tipe === 'EO';
  const isPenawaran = !isEO && lead.subTipe === 'Penawaran';
  return (
    <div>
      <DetailBack label="Kembali ke Pengajuan EO & Sponsor" onClick={onBack} />
      <DetailHeader
        badges={<>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isEO ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>{lead.tipe}</span>
          {!isEO && <span className="text-xs text-gray-500">{lead.subTipe}</span>}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LEAD_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>{lead.status}</span>
        </>}
        title={lead.organisasi}
        subtitle={`Diajukan ${fmtDateSafe(lead.tanggalAjuan)}${lead.pic ? ` · PIC ${lead.pic}` : ''}`}
      />
      <DetailLayout
        main={<>
          {lead.status === 'Rejected' && (
            <DetailCard title="Alasan Penolakan" tone="danger">
              <p className="text-sm text-red-700 whitespace-pre-line">{lead.catatan || 'Tidak ada alasan yang dicatat.'}</p>
            </DetailCard>
          )}
          {!isPenawaran && (
            <DetailCard title="Deskripsi Acara"><TextBlock>{lead.eventDesc}</TextBlock></DetailCard>
          )}
          {!isPenawaran && (
            <DetailCard title={`Kebutuhan ${lead.tipe}`}><TextBlock>{lead.kebutuhan}</TextBlock></DetailCard>
          )}
          {isPenawaran && (
            <DetailCard title="Benefit yang Ditawarkan"><TextBlock>{lead.benefit}</TextBlock></DetailCard>
          )}
          <DetailCard title="Lampiran">
            {lead.attachment ? (
              <a href={lead.attachment} download={lead.attachmentName || 'attachment'} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm">
                <FileText size={14} /> {lead.attachmentName || 'Unduh file'}
              </a>
            ) : <p className="text-sm text-gray-400">Tidak ada lampiran.</p>}
          </DetailCard>
        </>}
        aside={<>
          <DetailCard title="Kontak">
            <InfoList>
              <InfoItem label="PIC">{lead.pic}</InfoItem>
              <InfoItem label="Email">{lead.email ? <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a> : null}</InfoItem>
              <InfoItem label="No. HP">{lead.noHp}</InfoItem>
              <InfoItem label="Sosmed / Website">{lead.website ? <a href={/^https?:/.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lead.website}</a> : null}</InfoItem>
            </InfoList>
          </DetailCard>
          <DetailCard title={isEO ? 'Jadwal Event' : isPenawaran ? 'Periode Sponsorship' : 'Jadwal'}>
            <InfoItem label={isEO ? 'Tanggal Event' : 'Periode'}>
              {isEO ? fmtRange(lead.eventDate, lead.eventDateEnd) : isPenawaran ? fmtRange(lead.sponsorStart, lead.sponsorEnd) : null}
            </InfoItem>
          </DetailCard>
          <DetailCard title="Catatan Sistem">
            <InfoList>
              <InfoItem label="Tanggal Diajukan">{fmtDateSafe(lead.tanggalAjuan)}</InfoItem>
              <InfoItem label="Dibuat">{fmtDateTime(lead.createdAt)}</InfoItem>
              <InfoItem label="Diperbarui">{fmtDateTime(lead.updatedAt)}</InfoItem>
            </InfoList>
          </DetailCard>
        </>}
      />
      {lead.status === 'Pending Review' && (
        <ActionBar hint="Tandai dihubungi setelah tim menghubungi PIC.">
          <button onClick={onMarkContacted} className={btnPrimary}>Tandai Dihubungi</button>
        </ActionBar>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORY: bantu bersama (List Stories & Pengajuan Story)
// ═══════════════════════════════════════════════════════════════
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const storyRelasiLabel = (state, story) => {
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

const storyToForm = (story) => ({
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
  alasanTolak: story.alasanTolak || '',
});

// Form tambah / edit story. Dipasang hanya saat dibuka (mount = buka).
function StoryFormModal({ mode, story, state, toast, loadData, onClose }) {
  const [form, setForm] = useState(() => (story ? storyToForm(story) : EMPTY_STORY_FORM));
  const [formErrors, setFormErrors] = useState({});
  // Story eksternal (dari form pengajuan publik) & internal (dibuat admin
  // sendiri) punya pilihan status yang berbeda — lihat Field "Status" di bawah.
  const isExternalStory = mode === 'edit' && story.origin === 'Eksternal';

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

  const validate = () => {
    const e = {};
    if (!form.judul.trim()) e.judul = 'Judul wajib diisi';
    if (form.tipeRelasi === 'Event' && !form.relatedEventId) e.relatedEventId = 'Pilih event terkait';
    if (form.tipeRelasi === 'Komunitas' && !form.relatedKomunitasId) e.relatedKomunitasId = 'Pilih komunitas terkait';
    if (isExternalStory && form.status === 'Rejected' && !form.alasanTolak.trim()) e.alasanTolak = 'Alasan penolakan wajib diisi';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    const data = {
      ...form,
      relatedEventId: form.relatedEventId ? Number(form.relatedEventId) : null,
      relatedKomunitasId: form.relatedKomunitasId ? Number(form.relatedKomunitasId) : null,
      // Halaman customer memakai tanggal tayang; isi hari ini bila publish tanpa tanggal.
      tanggalPublish: form.status === 'Published' && !form.tanggalPublish ? todayISO() : form.tanggalPublish,
    };
    if (mode === 'add') {
      // Story yang dibuat langsung dari admin selalu berasal internal (tim
      // D'Paragon sendiri), beda dari yang masuk lewat form pengajuan publik.
      await apiCall(`/api/stories`, 'POST', { ...toApiStory(data), origin: 'internal' });
      toast('success', 'Story berhasil ditambahkan!');
    } else {
      await apiCall(`/api/stories?id=${story.id}`, 'PATCH', { ...toApiStory(data), notes: form.status === 'Rejected' ? form.alasanTolak.trim() : null });
      toast('success', 'Story berhasil diperbarui!');
    }
    await loadData();
    onClose();
  };

  return (
    <Modal open title={mode === 'add' ? 'Tambah Story Baru' : 'Edit Story'} onClose={onClose} size="lg">
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

        <Field label="Periode Tayang">
          <DateRangeField
            startValue={form.tanggalPublish}
            endValue={form.tayangSelesai}
            onChange={(start, end) => setForm(f => ({ ...f, tanggalPublish: start, tayangSelesai: end }))}
          />
        </Field>

        <Field label="Status">
          <FSelect value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {isExternalStory ? (
              <>
                {story.status === 'Pending Approval' && <option value="Pending Approval">Pending Approval (dari pengajuan web)</option>}
                <option value="Published">Published</option>
                <option value="Rejected">Rejected</option>
              </>
            ) : (
              <>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </>
            )}
          </FSelect>
          {form.status === 'Pending Approval' && (
            <p className="mt-1.5 text-xs text-gray-400">Pilih Published atau Rejected untuk menindaklanjuti pengajuan ini.</p>
          )}
        </Field>

        {isExternalStory && form.status === 'Rejected' && (
          <Field label="Alasan Penolakan *" error={formErrors.alasanTolak}>
            <FTextarea value={form.alasanTolak} onChange={e => { setForm(f => ({ ...f, alasanTolak: e.target.value })); setFormErrors(er => ({ ...er, alasanTolak: undefined })); }} rows={3} placeholder="Contoh: Konten belum sesuai pedoman komunitas..." />
            <p className="mt-1.5 text-xs text-gray-400">Alasan ini ditampilkan ke pengaju di halaman Status Pengajuan.</p>
          </Field>
        )}

        {isExternalStory && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">Kontak Pengaju (via Ajukan Story)</p>
            <p className="text-sm text-blue-700">{story.submitterEmail || '-'} · {story.submitterPhone || '-'}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
          <button onClick={handleSave} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
            {mode === 'add' ? 'Simpan Story' : 'Perbarui Story'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL: STORY (List Stories & Pengajuan Story)
// showOrigin=false di Pengajuan Story: semua yang tampil di sana eksternal,
// jadi labelnya tidak perlu diulang.
// ═══════════════════════════════════════════════════════════════
function StoryDetailView({ story, state, backLabel, onBack, onEdit, showOrigin = true }) {
  const external = story.origin === 'Eksternal';
  const riwayat = external
    ? [
        { title: 'Diajukan via web customer', meta: fmtDateTime(story.createdAt), tone: 'done' },
        story.status === 'Pending Approval'
          ? { title: 'Menunggu kurasi admin', tone: 'wait' }
          : story.status === 'Rejected'
            ? { title: 'Ditolak', meta: fmtDateTime(story.updatedAt), note: story.alasanTolak || null, tone: 'bad' }
            : { title: 'Disetujui & dipublish', meta: fmtDateTime(story.updatedAt), tone: 'ok' },
      ]
    : [{ title: 'Dibuat oleh tim D\'Paragon', meta: fmtDateTime(story.createdAt), tone: 'done' }];

  return (
    <div>
      <DetailBack label={backLabel} onClick={onBack} />
      <DetailHeader
        cover={story.coverImage}
        badges={<>
          <StatusBadge status={story.status} />
          {showOrigin && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${external ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{story.origin}</span>}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${story.tipeRelasi === 'Event' ? 'bg-purple-100 text-purple-700' : story.tipeRelasi === 'Komunitas' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{story.tipeRelasi}</span>
          {story.kategori && story.kategori !== story.tipeRelasi && <span className="text-xs text-gray-500">{story.kategori}</span>}
        </>}
        title={story.judul}
        subtitle={story.penulis ? `Oleh ${story.penulis}` : null}
      />
      <DetailLayout
        main={<>
          {story.status === 'Rejected' && (
            <DetailCard title="Alasan Penolakan" tone="danger">
              <p className="text-sm text-red-700 whitespace-pre-line">{story.alasanTolak || 'Tidak ada alasan yang dicatat.'}</p>
            </DetailCard>
          )}
          <DetailCard title="Isi Story"><TextBlock empty="Belum ada isi.">{story.konten}</TextBlock></DetailCard>
          <DetailCard title="Tags"><ChipList items={story.tags ? story.tags.split(',').map(t => t.trim()).filter(Boolean) : []} empty="Tidak ada tag." /></DetailCard>
        </>}
        aside={<>
          <DetailCard title="Informasi Story">
            <InfoList>
              <InfoItem label="Penulis">{story.penulis}</InfoItem>
              <InfoItem label="Tipe Relasi">{story.tipeRelasi}</InfoItem>
              {story.tipeRelasi !== 'Umum' && (
                <InfoItem label={story.tipeRelasi === 'Event' ? 'Event Terkait' : 'Komunitas Terkait'}>{storyRelasiLabel(state, story)}</InfoItem>
              )}
              <InfoItem label="Kategori">{story.kategori}</InfoItem>
              <InfoItem label="Periode Tayang">{story.tanggalPublish ? fmtRange(story.tanggalPublish, story.tayangSelesai) : null}</InfoItem>
            </InfoList>
          </DetailCard>
          {external && (
            <DetailCard title="Kontak Pengaju">
              <InfoList>
                <InfoItem label="Email">{story.submitterEmail ? <a href={`mailto:${story.submitterEmail}`} className="text-blue-600 hover:underline">{story.submitterEmail}</a> : null}</InfoItem>
                <InfoItem label="No. HP">{story.submitterPhone}</InfoItem>
              </InfoList>
            </DetailCard>
          )}
          <DetailCard title="Riwayat"><Timeline items={riwayat} /></DetailCard>
          <DetailCard title="Catatan Sistem">
            <InfoList>
              <InfoItem label="Dibuat">{fmtDateTime(story.createdAt)}</InfoItem>
              <InfoItem label="Diperbarui">{fmtDateTime(story.updatedAt)}</InfoItem>
            </InfoList>
          </DetailCard>
        </>}
      />
      <ActionBar hint={story.status === 'Pending Approval' ? 'Baca isi story lebih dulu. Ubah status lewat Edit.' : null}>
        <button onClick={onEdit} className={btnPrimary}><Edit2 size={14} /> Edit</button>
      </ActionBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL: EVENT (List Event)
// ═══════════════════════════════════════════════════════════════
function EventDetailView({ ev, state, onBack, actions }) {
  const kat = state.kategoriEvent.find(k => k.id === Number(ev.kategoriEventId));
  const venue = state.venue.find(v => v.id === Number(ev.venueId));
  const komunitas = state.komunitas.find(k => k.id === Number(ev.komunitasId));
  const pendaftar = ev.pendaftar || 0;
  const persen = ev.kuota > 0 ? Math.min(100, Math.round((pendaftar / ev.kuota) * 100)) : 0;
  const jam = ev.jamMulai ? `${String(ev.jamMulai).slice(0, 5)}${ev.jamSelesai ? ` – ${String(ev.jamSelesai).slice(0, 5)}` : ''} WIB` : null;
  const orgNames = (ev.organizers || []).map(o => o.organizer_name).filter(Boolean);
  const spNames = (ev.sponsors || []).map(s => s.sponsor_name).filter(Boolean);
  const agenda = (ev.agenda || []).filter(a => a.activity || a.kegiatan);

  return (
    <div>
      <DetailBack label="Kembali ke List Event" onClick={onBack} />
      <DetailHeader
        cover={ev.coverImage}
        badges={<>
          <StatusBadge status={ev.status} />
          {kat && <span className="text-xs text-gray-500">{kat.nama}</span>}
          {komunitas && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{komunitas.nama}</span>}
        </>}
        title={ev.nama}
        subtitle={`${fmtRange(ev.tanggalMulai, ev.tanggalSelesai)}${venue ? ` · ${venue.nama}` : ''}`}
      />
      <DetailLayout
        main={<>
          <DetailCard title="Deskripsi"><TextBlock>{ev.deskripsi}</TextBlock></DetailCard>
          <DetailCard title="Agenda Acara">
            {agenda.length === 0 ? <p className="text-sm text-gray-400">Belum ada agenda.</p> : (
              <div className="divide-y divide-gray-100">
                {agenda.map((a, i) => (
                  <div key={i} className="flex gap-4 py-2 text-sm">
                    <div className="w-14 text-gray-400 shrink-0 tabular-nums">{String(a.time ?? a.jam ?? '').slice(0, 5) || '—'}</div>
                    <div className="text-gray-900">{a.activity ?? a.kegiatan}</div>
                  </div>
                ))}
              </div>
            )}
          </DetailCard>
          <DetailCard title="Fasilitas yang Didapat"><ChipList items={ev.fasilitas} empty="Belum ada fasilitas." /></DetailCard>
          <DetailCard title="Aturan Event">
            {ev.rules && ev.rules.length > 0
              ? <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">{ev.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
              : <p className="text-sm text-gray-400">Belum ada aturan.</p>}
          </DetailCard>
        </>}
        aside={<>
          <DetailCard title="Jadwal & Lokasi">
            <InfoList>
              <InfoItem label="Tanggal">{fmtRange(ev.tanggalMulai, ev.tanggalSelesai)}</InfoItem>
              <InfoItem label="Jam">{jam}</InfoItem>
              <InfoItem label="Venue">{venue?.nama}</InfoItem>
              <InfoItem label="Alamat">{venue ? `${venue.alamat}${venue.kota ? `, ${venue.kota}` : ''}` : null}</InfoItem>
              <InfoItem label="Peta">{venue?.mapsLink ? <a href={venue.mapsLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Buka Google Maps</a> : null}</InfoItem>
            </InfoList>
          </DetailCard>
          <DetailCard title="Kuota & Harga">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-gray-900">{fmt(pendaftar)}<span className="text-sm font-normal text-gray-400"> / {fmt(ev.kuota)}</span></span>
              <span className="text-xs text-gray-400">{persen}% terisi</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4"><div className="h-full bg-blue-500" style={{ width: `${persen}%` }} /></div>
            <InfoList>
              <InfoItem label="Sisa Kuota">{fmt(Math.max(0, ev.kuota - pendaftar))} orang</InfoItem>
              <InfoItem label="Harga">{ev.harga === 0 ? 'Gratis' : `Rp ${fmt(ev.harga)}`}</InfoItem>
            </InfoList>
          </DetailCard>
          <DetailCard title="Pihak Terkait">
            <InfoList>
              <InfoItem label="Organizer (Komunitas)">{komunitas?.nama || (orgNames.length ? orgNames.join(', ') : "D'Paragon Community Team")}</InfoItem>
              <InfoItem label="Sponsor / Partner">{ev.sponsorText || (spNames.length ? spNames.join(', ') : null)}</InfoItem>
            </InfoList>
          </DetailCard>
          <DetailCard title="Catatan Sistem">
            <InfoList>
              <InfoItem label="Dibuat">{fmtDateTime(ev.createdAt)}</InfoItem>
              <InfoItem label="Diperbarui">{fmtDateTime(ev.updatedAt)}</InfoItem>
            </InfoList>
          </DetailCard>
        </>}
      />
      <ActionBar hint="Aksi yang tersedia mengikuti status event.">{actions}</ActionBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FORM EVENT (satu form untuk Buat Event & Edit Event, dari list maupun detail)
// ═══════════════════════════════════════════════════════════════
const blankEventForm = (state) => ({
  nama: '', deskripsi: '', kategoriEventId: String(state.kategoriEvent[0]?.id || ''),
  venueId: String(state.venue[0]?.id || ''), komunitasId: '', sponsor: '',
  tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '', kuota: '', harga: '',
  coverImage: '', agenda: [], fasilitas: [], rules: [],
});

const eventToForm = (ev) => ({
  nama: ev.nama, deskripsi: ev.deskripsi || '', kategoriEventId: String(ev.kategoriEventId ?? ''),
  venueId: String(ev.venueId ?? ''), komunitasId: ev.komunitasId ? String(ev.komunitasId) : '',
  sponsor: ev.sponsorText || '',
  tanggalMulai: ev.tanggalMulai ? String(ev.tanggalMulai).slice(0, 10) : '',
  tanggalSelesai: ev.tanggalSelesai ? String(ev.tanggalSelesai).slice(0, 10) : '',
  jamMulai: ev.jamMulai ? String(ev.jamMulai).slice(0, 5) : '', jamSelesai: ev.jamSelesai ? String(ev.jamSelesai).slice(0, 5) : '',
  kuota: String(ev.kuota ?? ''), harga: String(ev.harga ?? ''),
  coverImage: ev.coverImage || '',
  agenda: (ev.agenda || []).map(a => ({ jam: a.jam ?? '', kegiatan: a.kegiatan ?? '' })),
  fasilitas: [...(ev.fasilitas || [])], rules: [...(ev.rules || [])],
});

function ListInput({ label, items, onChange, placeholder, addLabel }) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
      <div className="space-y-2 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <FInput className="flex-1" value={item} placeholder={placeholder} onChange={e => onChange(items.map((r, j) => j === i ? e.target.value : r))} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><X size={14} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, ''])} className="text-xs text-blue-600 hover:underline">{addLabel}</button>
    </div>
  );
}

function EventFormModal({ mode, event, state, toast, loadData, onClose }) {
  const [form, setForm] = useState(() => (event ? eventToForm(event) : blankEventForm(state)));
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = 'Nama event wajib diisi';
    if (!form.tanggalMulai) e.tanggalMulai = 'Tanggal mulai wajib diisi';
    if (!form.tanggalSelesai) e.tanggalSelesai = 'Tanggal selesai wajib diisi';
    if (form.tanggalMulai && form.tanggalSelesai && form.tanggalSelesai < form.tanggalMulai) e.tanggalSelesai = 'Tanggal selesai tidak boleh sebelum tanggal mulai';
    if (!form.kuota || isNaN(Number(form.kuota)) || Number(form.kuota) <= 0) e.kuota = 'Kuota harus berupa angka positif';
    if (form.harga === '' || isNaN(Number(form.harga)) || Number(form.harga) < 0) e.harga = 'Harga tidak valid (0 untuk gratis)';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const clean = (arr) => arr.map(s => s.trim()).filter(Boolean);
    const payload = {
      ...toApiEvent({
        ...form,
        kategoriEventId: Number(form.kategoriEventId), venueId: Number(form.venueId),
        kuota: Number(form.kuota), harga: Number(form.harga),
        fasilitas: clean(form.fasilitas), rules: clean(form.rules),
        status: mode === 'add' ? 'Draft' : event.status,
      }),
      // Sponsor ditulis sebagai teks bebas (belum terhubung ke master sponsor).
      sponsor_name: form.sponsor.trim() || null,
    };
    let id;
    if (mode === 'add') {
      const created = await apiCall(`/api/events`, 'POST', payload);
      id = created.id;
    } else {
      await apiCall(`/api/events?id=${event.id}`, 'PATCH', payload);
      id = event.id;
    }
    // Rundown disimpan lewat endpoint agenda (tabel terpisah).
    await apiCall(`/api/events?id=${id}&action=agenda`, 'PATCH', {
      agenda: form.agenda
        .filter(r => r.kegiatan.trim())
        .map((r, i) => ({ time: r.jam || null, activity: r.kegiatan.trim(), order: i })),
    });
    await loadData();
    toast('success', mode === 'add' ? 'Event berhasil dibuat' : 'Event berhasil diperbarui');
    onClose();
  };

  return (
    <Modal open title={mode === 'add' ? 'Buat Event Baru' : 'Edit Event'} onClose={onClose} size="lg">
      <div className="space-y-4">
        <Field label="Nama Event *" error={errors.nama}><FInput value={form.nama} onChange={e => set('nama', e.target.value)} placeholder="Nama event" /></Field>
        <Field label="Deskripsi"><FTextarea value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={3} /></Field>
        <Field label="Foto Event"><ImageUploadField value={form.coverImage} onChange={v => set('coverImage', v)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kategori Event"><FSelect value={form.kategoriEventId} onChange={e => set('kategoriEventId', e.target.value)}>{state.kategoriEvent.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</FSelect></Field>
          <Field label="Venue"><FSelect value={form.venueId} onChange={e => set('venueId', e.target.value)}>{state.venue.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}</FSelect></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tanggal Mulai *" error={errors.tanggalMulai}><FInput type="date" value={form.tanggalMulai} onChange={e => set('tanggalMulai', e.target.value)} /></Field>
          <Field label="Tanggal Selesai *" error={errors.tanggalSelesai}><FInput type="date" value={form.tanggalSelesai} onChange={e => set('tanggalSelesai', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Jam Mulai"><FInput type="time" value={form.jamMulai} onChange={e => set('jamMulai', e.target.value)} /></Field>
          <Field label="Jam Selesai"><FInput type="time" value={form.jamSelesai} onChange={e => set('jamSelesai', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Organizer (Komunitas)">
            <FSelect value={form.komunitasId} onChange={e => set('komunitasId', e.target.value)}>
              <option value="">D'Paragon Community Team</option>
              {state.komunitas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </FSelect>
          </Field>
          <Field label="Sponsor / Partner"><FInput value={form.sponsor} onChange={e => set('sponsor', e.target.value)} placeholder="Kosongkan bila tidak ada" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kuota (orang) *" error={errors.kuota}><FInput type="number" value={form.kuota} onChange={e => set('kuota', e.target.value)} placeholder="100" /></Field>
          <Field label="Harga (0 = gratis) *" error={errors.harga}><FInput type="number" value={form.harga} onChange={e => set('harga', e.target.value)} placeholder="75000" /></Field>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Rundown Acara</div>
          <div className="space-y-2 mb-2">
            {form.agenda.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <FInput type="time" value={row.jam} style={{ width: 110 }} onChange={e => set('agenda', form.agenda.map((r, j) => j === i ? { ...r, jam: e.target.value } : r))} />
                <FInput className="flex-1" value={row.kegiatan} placeholder="Kegiatan..." onChange={e => set('agenda', form.agenda.map((r, j) => j === i ? { ...r, kegiatan: e.target.value } : r))} />
                <button type="button" onClick={() => set('agenda', form.agenda.filter((_, j) => j !== i))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><X size={14} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set('agenda', [...form.agenda, { jam: '', kegiatan: '' }])} className="text-xs text-blue-600 hover:underline">+ Tambah Sesi</button>
        </div>

        <ListInput label="Fasilitas yang Didapat" items={form.fasilitas} onChange={v => set('fasilitas', v)} placeholder="Fasilitas..." addLabel="+ Tambah Fasilitas" />
        <ListInput label="Aturan Event" items={form.rules} onChange={v => set('rules', v)} placeholder="Aturan..." addLabel="+ Tambah Aturan" />

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">Simpan</button>
        </div>
      </div>
    </Modal>
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
      { key: 'stories-pengajuan', label: 'Pengajuan Story', icon: <FileText size={15} /> },
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
                    {key === 'stories-pengajuan' && pendingStories > 0 && (
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
        <div className="flex items-center gap-2">
          <ExportButtons toast={toast} label="kategori komunitas" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Tambah
        </button>
        </div>
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
        <div className="flex items-center gap-2">
          <ExportButtons toast={toast} label="kategori event" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah</button>
        </div>
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
        <div className="flex items-center gap-2">
          <ExportButtons toast={toast} label="venue" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah Venue</button>
        </div>
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
        <div className="flex items-center gap-2">
          <ExportButtons toast={toast} label="komunitas" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah Komunitas</button>
        </div>
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
  const [modal, setModal] = useState(null);
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

  const openAdd = () => setModal({ mode: 'add' });
  const openEdit = (item) => setModal({ mode: 'edit', data: item });

  const eventModalEl = modal && (
    <EventFormModal mode={modal.mode} event={modal.data} state={state} toast={toast} loadData={loadData} onClose={() => setModal(null)} />
  );

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
        <EventDetailView
          ev={ev}
          state={state}
          onBack={() => setDetail(null)}
          actions={<>
            {ev.status === 'Draft' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Registration Open' })} className={btnSuccess}>Open Registration</button>}
            {ev.status === 'Registration Open' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Check-in' })} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Start Check-in</button>}
            {ev.status === 'Check-in' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Recap Pending' })} className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600">Close Event</button>}
            {ev.status === 'Recap Pending' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Recap Published' })} className={btnPrimary}>Publish Recap</button>}
            {ev.status === 'Registration Open' && <button onClick={() => setStatusAction({ event: ev, newStatus: 'Cancelled' })} className="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200">Cancel</button>}
            {(ev.status === 'Draft' || ev.status === 'Registration Open') && <button onClick={() => openEdit(ev)} className={btnGhost}><Edit2 size={14} /> Edit</button>}
            <button onClick={() => onNav('event-partisipan', ev.id)} className={btnGhost}><Users size={14} /> Partisipan</button>
            {ev.status === 'Draft' && <button onClick={() => setDeleteTarget(ev)} className={btnDangerSoft}><Trash2 size={14} /> Hapus</button>}
          </>}
        />
        {eventModalEl}
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
        <div className="flex items-center gap-2">
          <ExportButtons toast={toast} label="event" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Plus size={16} /> Buat Event</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBox label="Total Event" value={state.events.length} />
        <StatBox label="Registration Open" value={state.events.filter(e => e.status === 'Registration Open').length} />
        <StatBox label="Total Pendaftar" value={fmt(state.events.reduce((a, e) => a + (e.pendaftar || 0), 0))} />
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
              <Field label="Rentang Tanggal Event">
                <DateRangeField startValue={dateFrom} endValue={dateTo} onChange={(s, e) => { setDateFrom(s); setDateTo(e); }} />
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
          <table className="w-full min-w-[1150px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Venue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kuota</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dibuat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Diupdate</th>
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
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(ev.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(ev.updatedAt)}</td>
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

      {eventModalEl}
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
function PartisipanEventPage({ state, toast, initialEventId }) {
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || null);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterBayar, setFilterBayar] = useState('Semua');
  const [filterCheckIn, setFilterCheckIn] = useState('Semua');

  const partisipan = state.partisipan.filter(p => p.eventId === Number(selectedEventId));
  const activeFilterCount = [search.trim() !== '', filterBayar !== 'Semua', filterCheckIn !== 'Semua'].filter(Boolean).length;
  const resetFilters = () => { setSearch(''); setFilterBayar('Semua'); setFilterCheckIn('Semua'); };
  const filtered = partisipan.filter(p =>
    (search.trim() === '' || p.nama.toLowerCase().includes(search.trim().toLowerCase()) || p.email.toLowerCase().includes(search.trim().toLowerCase())) &&
    (filterBayar === 'Semua' || p.statusBayar === filterBayar) &&
    (filterCheckIn === 'Semua' || p.statusCheckIn === filterCheckIn)
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
          <div className="flex items-center justify-end mb-3">
            <ExportButtons toast={toast} label="partisipan event" />
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
                <div className="grid md:grid-cols-3 gap-3">
                  <Field label="Cari Nama / Email">
                    <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama atau email..." />
                  </Field>
                  <Field label="Status Bayar">
                    <FSelect value={filterBayar} onChange={e => setFilterBayar(e.target.value)}>
                      <option value="Semua">Semua</option>
                      <option value="Lunas">Lunas</option>
                      <option value="Gratis">Gratis</option>
                      <option value="Pending">Pending</option>
                    </FSelect>
                  </Field>
                  <Field label="Status Check-In">
                    <FSelect value={filterCheckIn} onChange={e => setFilterCheckIn(e.target.value)}>
                      <option value="Semua">Semua</option>
                      <option value="Sudah">Sudah</option>
                      <option value="Belum">Belum</option>
                    </FSelect>
                  </Field>
                </div>
                {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
              </div>
            )}
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
function ListKlubPage({ state, toast, loadData }) {
  const [detail, setDetail] = useState(null);
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

  if (detail) {
    const klub = state.komunitas.find(k => k.id === detail.id) || detail;
    return <KlubDetailView klub={klub} state={state} onBack={() => setDetail(null)} toast={toast} loadData={loadData} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">List Klub</h1>
          <p className="text-sm text-gray-500">Monitoring anggota per klub/komunitas</p>
        </div>
        <ExportButtons toast={toast} label="klub" />
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
          <table className="w-full min-w-[1050px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Komunitas</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kota</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Dibuat</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Diupdate</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
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
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(klub.createdAt)}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(klub.updatedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setDetail(klub)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                    </div>
                  </td>
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activeFilterCount = [filterStatus !== 'Semua', search.trim() !== ''].filter(Boolean).length;
  const resetFilters = () => { setFilterStatus('Semua'); setSearch(''); };
  const filtered = state.pengajuanKlub.filter(p =>
    (filterStatus === 'Semua' || p.status === filterStatus) &&
    (search.trim() === '' || p.namaKlub.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const pendingCount = state.pengajuanKlub.filter(p => p.status === 'Pending').length;

  const handleAction = async () => {
    if (actionModal.action === 'reject' && !catatan.trim()) { setCatatanError('Alasan penolakan wajib diisi'); return; }
    const newStatus = actionModal.action === 'approve' ? 'Approved' : 'Rejected';
    if (actionModal.action === 'approve') {
      await apiCall(`/api/communities?id=${actionModal.pengajuan.id}`, 'PATCH', { status: 'active', notes: catatan, type: 'Eksternal' }); await loadData();
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
    return (
      <div>
        <PengajuanKlubDetailView
          p={p}
          onBack={() => setDetail(null)}
          onApprove={() => openAction(p, 'approve')}
          onReject={() => openAction(p, 'reject')}
        />
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
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">{pendingCount} menunggu review</span>
          )}
          <ExportButtons toast={toast} label="pengajuan klub" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatBox label="Total Pengajuan" value={state.pengajuanKlub.length} />
        <StatBox label="Pending" value={state.pengajuanKlub.filter(p => p.status === 'Pending').length} />
        <StatBox label="Approved" value={state.pengajuanKlub.filter(p => p.status === 'Approved').length} />
        <StatBox label="Rejected" value={state.pengajuanKlub.filter(p => p.status === 'Rejected').length} />
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
              <Field label="Cari Nama Klub">
                <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama klub..." />
              </Field>
              <Field label="Status">
                <FSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  {['Semua', 'Pending', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                </FSelect>
              </Field>
            </div>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada pengajuan" desc={filterStatus !== 'Semua' ? `Tidak ada pengajuan dengan status ${filterStatus}` : 'Belum ada pengajuan masuk'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Klub</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">PIC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tgl Ajuan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Dibuat</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Diupdate</th>
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
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(p.createdAt)}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(p.updatedAt)}</td>
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
  kategori: 'Umum', tags: '', penulis: '', coverImage: '', konten: '', tanggalPublish: '', tayangSelesai: '', status: 'Draft', alasanTolak: '',
};

function StoriesListPage({ state, toast, loadData }) {
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [formModal, setFormModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', story }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Story eksternal yang masih menunggu kurasi ada di menu Pengajuan Story.
  // Di sini baru muncul setelah disetujui (Published) atau ditolak (Rejected).
  const listStories = state.stories.filter(s => !(s.origin === 'Eksternal' && s.status === 'Pending Approval'));
  const activeFilterCount = [filterStatus !== 'Semua', search.trim() !== ''].filter(Boolean).length;
  const resetFilters = () => { setFilterStatus('Semua'); setSearch(''); };
  const filtered = listStories.filter(s =>
    (filterStatus === 'Semua' || s.status === filterStatus) &&
    (search.trim() === '' || s.judul.toLowerCase().includes(search.trim().toLowerCase()) || (s.penulis || '').toLowerCase().includes(search.trim().toLowerCase()))
  );

  const handleDelete = async () => {
    await apiCall(`/api/stories?id=${deleteConfirm.id}`, 'DELETE'); await loadData();
    toast('success', 'Story berhasil dihapus.');
    if (detail?.id === deleteConfirm.id) setDetail(null);
    setDeleteConfirm(null);
  };

  const formModalEl = formModal && (
    <StoryFormModal mode={formModal.mode} story={formModal.story} state={state} toast={toast} loadData={loadData} onClose={() => setFormModal(null)} />
  );

  if (detail) {
    const story = state.stories.find(s => s.id === detail.id) || detail;
    return (
      <div>
        <StoryDetailView
          story={story}
          state={state}
          backLabel="Kembali ke List Stories"
          onBack={() => setDetail(null)}
          onEdit={() => setFormModal({ mode: 'edit', story })}
        />
        {formModalEl}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Stories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola artikel, recap event, dan spotlight komunitas</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons toast={toast} label="stories" />
          <button onClick={() => setFormModal({ mode: 'add' })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus size={15} /> Tambah Story
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatBox label="Total Story" value={listStories.length} />
        <StatBox label="Published" value={listStories.filter(s => s.status === 'Published').length} />
        <StatBox label="Draft" value={listStories.filter(s => s.status === 'Draft').length} />
        <StatBox label="Rejected" value={listStories.filter(s => s.status === 'Rejected').length} />
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
              <Field label="Cari Judul / Penulis">
                <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Judul atau nama penulis..." />
              </Field>
              <Field label="Status">
                <FSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  {['Semua', 'Draft', 'Published', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                </FSelect>
              </Field>
            </div>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada story"
          desc={filterStatus === 'Semua' ? 'Mulai buat story pertama Anda.' : `Tidak ada story dengan status ${filterStatus}.`}
          action={<button onClick={() => setFormModal({ mode: 'add' })} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Tambah Story</button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[1250px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Judul</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Relasi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Periode Tayang</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dibuat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Diupdate</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(story => (
                <tr key={story.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 max-w-xs truncate">{story.judul}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{story.kategori}{story.tags ? ` · ${story.tags}` : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${story.origin === 'Eksternal' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {story.origin}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${story.tipeRelasi === 'Event' ? 'bg-purple-100 text-purple-700' : story.tipeRelasi === 'Komunitas' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {story.tipeRelasi}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{storyRelasiLabel(state, story)}</td>
                  <td className="px-4 py-3"><StatusBadge status={story.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {story.tanggalPublish ? fmtDateSafe(story.tanggalPublish) : '—'}
                    {story.tayangSelesai ? ` s/d ${fmtDateSafe(story.tayangSelesai)}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(story.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(story.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setDetail(story)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                      <button onClick={() => setFormModal({ mode: 'edit', story })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(story)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formModalEl}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Hapus Story"
        message={`Yakin ingin menghapus "${deleteConfirm?.judul}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: PENGAJUAN STORY
// Aksi sengaja hanya Detail & Edit: keputusan (publish/tolak) diambil lewat
// kolom Status di form Edit setelah isi story dibaca, bukan tombol sekali klik.
// ═══════════════════════════════════════════════════════════════
function PengajuanStoryPage({ state, toast, loadData }) {
  const [detail, setDetail] = useState(null);
  const [editStory, setEditStory] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Pengajuan = story eksternal. Yang sudah diputuskan pindah ke List Stories
  // (Published / Rejected) dan tampil di sana dengan label asal Eksternal.
  const eksternal = state.stories.filter(s => s.origin === 'Eksternal');
  const pending = eksternal.filter(s => s.status === 'Pending Approval');
  const q = search.trim().toLowerCase();
  const filtered = pending.filter(s => q === '' || s.judul.toLowerCase().includes(q) || (s.penulis || '').toLowerCase().includes(q));

  const komunitasNama = (s) => {
    if (s.tipeRelasi !== 'Komunitas') return 'Umum';
    const kom = state.komunitas.find(k => k.id === s.relatedKomunitasId);
    return kom ? kom.nama : `Komunitas #${s.relatedKomunitasId}`;
  };

  const editModalEl = editStory && (
    <StoryFormModal mode="edit" story={editStory} state={state} toast={toast} loadData={loadData} onClose={() => setEditStory(null)} />
  );

  if (detail) {
    const story = state.stories.find(s => s.id === detail.id) || detail;
    return (
      <div>
        <StoryDetailView
          story={story}
          state={state}
          backLabel="Kembali ke Pengajuan Story"
          onBack={() => setDetail(null)}
          onEdit={() => setEditStory(story)}
          showOrigin={false}
        />
        {editModalEl}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengajuan Story</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kurasi story yang dikirim pihak eksternal lewat web customer</p>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">{pending.length} menunggu review</span>
          )}
          <ExportButtons toast={toast} label="pengajuan story" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatBox label="Total Pengajuan" value={eksternal.length} />
        <StatBox label="Menunggu Review" value={pending.length} />
        <StatBox label="Disetujui" value={eksternal.filter(s => s.status === 'Published').length} />
        <StatBox label="Ditolak" value={eksternal.filter(s => s.status === 'Rejected').length} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
        <button onClick={() => setFilterOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <span className="flex items-center gap-2">
            Filter Lanjutan
            {q !== '' && <span className="bg-blue-100 text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>}
          </span>
          <ChevronDown size={15} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
            <Field label="Cari Judul / Penulis">
              <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Judul atau nama penulis..." />
            </Field>
            {q !== '' && <button onClick={() => setSearch('')} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada pengajuan" desc={q !== '' ? 'Tidak ada pengajuan yang cocok dengan pencarian.' : 'Belum ada story yang menunggu review. Story yang sudah diputuskan ada di List Stories.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Judul</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Penulis</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Komunitas</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kontak</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Diajukan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 text-sm max-w-xs truncate">{s.judul}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm">{s.penulis || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm">{komunitasNama(s)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    <div>{s.submitterEmail || '—'}</div>
                    <div className="text-gray-400">{s.submitterPhone || ''}</div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(s.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setDetail(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                      <button onClick={() => setEditStory(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editModalEl}
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

const Stars = ({ n }) => (
  <span className="text-base leading-none">
    <span className="text-yellow-400">{'★'.repeat(n)}</span>
    <span className="text-gray-200">{'★'.repeat(5 - n)}</span>
  </span>
);

function ReviewDetailView({ review, onBack, onApprove, onReject }) {
  const riwayat = [
    { title: 'Review dikirim', meta: `${fmtDateTime(review.tanggalSubmit)} · oleh ${review.userName || review.userId}`, tone: 'done' },
    review.status === 'Pending'
      ? { title: 'Menunggu verifikasi admin', tone: 'wait' }
      : {
          title: review.status === 'Approved' ? 'Disetujui & tampil publik' : 'Ditolak',
          meta: review.reviewedAt ? fmtDateTime(review.reviewedAt) : 'Waktu keputusan tidak tercatat',
          note: review.status === 'Rejected' ? (review.catatan || null) : null,
          tone: review.status === 'Approved' ? 'ok' : 'bad',
        },
  ];
  return (
    <div>
      <DetailBack label="Kembali ke Verifikasi Review" onClick={onBack} />
      <DetailHeader
        badges={<>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_REVIEW_COLORS[review.status] || 'bg-gray-100 text-gray-600'}`}>{review.status}</span>
          <Stars n={review.rating} />
        </>}
        title={`Review dari ${review.userName || review.userId}`}
        subtitle={review.eventNama}
      />
      <DetailLayout
        main={<>
          {review.status === 'Rejected' && (
            <DetailCard title="Alasan Penolakan" tone="danger">
              <p className="text-sm text-red-700 whitespace-pre-line">{review.catatan || 'Tidak ada alasan yang dicatat.'}</p>
            </DetailCard>
          )}
          <DetailCard title="Komentar"><TextBlock empty="Peserta tidak menulis komentar.">{review.komentar}</TextBlock></DetailCard>
        </>}
        aside={<>
          <DetailCard title="Penilaian">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">{review.rating}<span className="text-sm font-normal text-gray-400"> / 5</span></span>
              <Stars n={review.rating} />
            </div>
          </DetailCard>
          <DetailCard title="Peserta & Event">
            <InfoList>
              <InfoItem label="Nama">{review.userName}</InfoItem>
              <InfoItem label="Email">{review.userId ? <a href={`mailto:${review.userId}`} className="text-blue-600 hover:underline">{review.userId}</a> : null}</InfoItem>
              <InfoItem label="Event">{review.eventNama}</InfoItem>
            </InfoList>
          </DetailCard>
          <DetailCard title="Riwayat Verifikasi"><Timeline items={riwayat} /></DetailCard>
        </>}
      />
      <ActionBar hint={review.status === 'Pending' ? 'Baca komentar lengkap sebelum memutuskan.' : 'Keputusan masih bisa diubah bila perlu.'}>
        {review.status !== 'Rejected' && (
          <button onClick={onReject} className={btnDangerSoft}><XCircle size={15} /> {review.status === 'Approved' ? 'Ubah ke Ditolak' : 'Tolak'}</button>
        )}
        {review.status !== 'Approved' && (
          <button onClick={onApprove} className={btnSuccess}><CheckCircle size={15} /> {review.status === 'Rejected' ? 'Ubah ke Disetujui' : 'Setujui'}</button>
        )}
      </ActionBar>
    </div>
  );
}

function ReviewVerificationPage({ state, toast, loadData }) {
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [detail, setDetail] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // review yang akan ditolak
  const [alasan, setAlasan] = useState('');
  const [alasanError, setAlasanError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activeFilterCount = [filterStatus !== 'Semua', search.trim() !== ''].filter(Boolean).length;
  const resetFilters = () => { setFilterStatus('Semua'); setSearch(''); };
  const filtered = state.reviews.filter(r =>
    (filterStatus === 'Semua' || r.status === filterStatus) &&
    (search.trim() === '' || r.userName.toLowerCase().includes(search.trim().toLowerCase()) || r.eventNama.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const pendingCount = state.reviews.filter(r => r.status === 'Pending').length;

  const closeReject = () => { setRejectModal(null); setAlasan(''); setAlasanError(''); };
  const openReject = (review) => { setRejectModal(review); setAlasan(''); setAlasanError(''); };

  const handleApprove = async (review) => {
    await apiCall(`/api/reviews?id=${review.id}`, 'PATCH', { status: 'approved' }); await loadData();
    toast('success', `Review dari ${review.userName} disetujui.`);
  };

  const handleConfirmReject = async () => {
    if (!alasan.trim()) { setAlasanError('Alasan penolakan wajib diisi'); return; }
    await apiCall(`/api/reviews?id=${rejectModal.id}`, 'PATCH', { status: 'rejected', notes: alasan.trim() }); await loadData();
    toast('success', `Review dari ${rejectModal.userName} ditolak.`);
    closeReject();
  };

  const rejectModalEl = (
    <Modal open={!!rejectModal} title="Tolak Review" onClose={closeReject}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-sm font-medium text-gray-900">{rejectModal?.userName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{rejectModal?.eventNama} · {'★'.repeat(rejectModal?.rating || 0)}</p>
          <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">&ldquo;{rejectModal?.komentar}&rdquo;</p>
        </div>
        <Field label="Alasan Penolakan *" error={alasanError}>
          <FTextarea rows={3} value={alasan} onChange={e => { setAlasan(e.target.value); setAlasanError(''); }} placeholder="Contoh: Konten tidak sesuai dengan pedoman komunitas..." />
        </Field>
        <div className="flex gap-3 pt-2">
          <button onClick={closeReject} className="flex-1 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleConfirmReject} className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Tolak</button>
        </div>
      </div>
    </Modal>
  );

  if (detail) {
    const review = state.reviews.find(r => r.id === detail.id) || detail;
    return (
      <div>
        <ReviewDetailView review={review} onBack={() => setDetail(null)} onApprove={() => handleApprove(review)} onReject={() => openReject(review)} />
        {rejectModalEl}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verifikasi Review</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pendingCount > 0 ? <span className="text-yellow-600 font-medium">{pendingCount} review menunggu persetujuan</span> : 'Semua review sudah diverifikasi'}
          </p>
        </div>
        <ExportButtons toast={toast} label="review" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatBox label="Total Review" value={state.reviews.length} />
        <StatBox label="Pending" value={state.reviews.filter(r => r.status === 'Pending').length} />
        <StatBox label="Approved" value={state.reviews.filter(r => r.status === 'Approved').length} />
        <StatBox label="Rejected" value={state.reviews.filter(r => r.status === 'Rejected').length} />
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
              <Field label="Cari Peserta / Event">
                <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama peserta atau event..." />
              </Field>
              <Field label="Status">
                <FSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  {['Semua', 'Pending', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                </FSelect>
              </Field>
            </div>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filter</button>}
          </div>
        )}
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
                  <td className="px-4 py-4 text-center"><Stars n={review.rating} /></td>
                  <td className="px-4 py-4">
                    <p className="text-gray-600 max-w-[220px] line-clamp-2">{review.komentar}</p>
                    {review.catatan && review.status === 'Rejected' && (
                      <p className="text-xs text-red-500 mt-1 italic line-clamp-1">Alasan: {review.catatan}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{fmtDateSafe(review.tanggalSubmit)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_REVIEW_COLORS[review.status] || 'bg-gray-100 text-gray-600'}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetail(review)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Detail"><Eye size={14} /></button>
                    </div>
                  </td>
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

  if (detailLead) {
    const lead = state.partnershipLeads.find(l => l._source === detailLead._source && l.id === detailLead.id) || detailLead;
    return <LeadDetailView lead={lead} onBack={() => setDetailLead(null)} onMarkContacted={() => handleMarkContacted(lead)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengajuan EO & Sponsor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {newCount > 0 ? <span className="text-yellow-600 font-medium">{newCount} pengajuan baru</span> : 'Semua pengajuan sudah ditindaklanjuti'}
          </p>
        </div>
        <ExportButtons toast={toast} label="pengajuan kemitraan" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatBox label={`Total ${filterTipe}`} value={state.partnershipLeads.filter(l => l.tipe === filterTipe).length} />
        <StatBox label="Pending Review" value={state.partnershipLeads.filter(l => l.tipe === filterTipe && l.status === 'Pending Review').length} />
        <StatBox label="Contacted" value={state.partnershipLeads.filter(l => l.tipe === filterTipe && l.status === 'Contacted').length} />
        <StatBox label="Rejected" value={state.partnershipLeads.filter(l => l.tipe === filterTipe && l.status === 'Rejected').length} />
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
              <Field label="Rentang Tanggal Ajuan">
                <DateRangeField startValue={dateFrom} endValue={dateTo} onChange={(s, e) => { setDateFrom(s); setDateTo(e); }} />
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
          <table className="w-full text-sm min-w-[1250px]">
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dibuat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diupdate</th>
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
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{lead.tanggalAjuan ? fmtDate(lead.tanggalAjuan.slice(0, 10)) : '—'}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LEAD_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(lead.createdAt)}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(lead.updatedAt)}</td>
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
          // Klub yang ditolak tidak masuk daftar klub; riwayatnya ada di Pengajuan Klub.
          komunitas: data.komunitas.filter(c => c.status === 'active' || c.status === 'inactive').map(fromApiKomunitas),
          events: data.events.map(fromApiEvent),
          partisipan: data.partisipan.map(fromApiPartisipan),
          pengajuanKlub: data.komunitas.filter(c => c.status === 'pending' || c.status === 'rejected' || c.submitted_at).map(fromApiPengajuan),
          communityMembers: (data.communityMembers || []).map(m => ({ id: m.id, communityId: m.community_id, userEmail: m.user_email ?? '', userName: m.user_name ?? '', joinedAt: m.joined_at })),
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
    'stories-pengajuan': <PengajuanStoryPage {...sharedProps} />,
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
      <main className="ml-60 flex-1 min-w-0 p-7 min-h-screen">
        <div className="max-w-7xl">
          {pageMap[currentPage] ?? <EmptyState title="Halaman tidak ditemukan" desc="Pilih menu di sidebar" />}
        </div>
      </main>
      <Toast toasts={toasts} onRemove={(id) => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  );
}

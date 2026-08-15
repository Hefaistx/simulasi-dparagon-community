import { useState } from 'react';
import WebCustomer from './DParagon-Web-Customer-UX-Simulation';
import WebManajemen from './DParagon-Web-Manajemen-UX-Simulation';

export default function App() {
  const [active, setActive] = useState(null);

  if (active === 'customer') return (
    <div>
      <button
        onClick={() => setActive(null)}
        className="fixed bottom-5 right-5 z-9999 bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl hover:bg-gray-700 border border-gray-700"
      >
        ← Kembali ke Launcher
      </button>
      <WebCustomer />
    </div>
  );

  if (active === 'manajemen') return (
    <div>
      <button
        onClick={() => setActive(null)}
        className="fixed bottom-5 right-5 z-9999 bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl hover:bg-gray-700 border border-gray-700"
      >
        ← Kembali ke Launcher
      </button>
      <WebManajemen />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">DP</div>
        <h1 className="text-2xl font-bold text-white">D'Paragon UX Simulator</h1>
        <p className="text-gray-400 text-sm mt-1">Pilih simulasi yang ingin dibuka</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        <button
          onClick={() => setActive('customer')}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-blue-500 hover:bg-gray-800 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4 text-lg">🌐</div>
          <h2 className="text-white font-semibold mb-1">Web D'Paragon</h2>
          <p className="text-gray-400 text-sm">Stories, Event Discovery, Komunitas, My Pass &amp; QR Ticket</p>
          <div className="mt-4 text-blue-400 text-sm font-medium group-hover:text-blue-300">Buka Simulasi →</div>
        </button>
        <button
          onClick={() => setActive('manajemen')}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-purple-500 hover:bg-gray-800 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4 text-lg">⚙️</div>
          <h2 className="text-white font-semibold mb-1">Web Manajemen</h2>
          <p className="text-gray-400 text-sm">Master Data, Event, Kalender, Partisipan, Klub &amp; Pengajuan</p>
          <div className="mt-4 text-purple-400 text-sm font-medium group-hover:text-purple-300">Buka Simulasi →</div>
        </button>
      </div>
    </div>
  );
}

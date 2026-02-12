/*
 * More — Cyber Noir Casino theme
 * Settings, hand history, about, and other options
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Volume2, VolumeX, Bell, HelpCircle, Shield, FileText, ChevronRight, History, BarChart3 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import HandHistory from '@/components/HandHistory';
import { toast } from 'sonner';

export default function More() {
  const [soundOn, setSoundOn] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const menuSections = [
    {
      section: 'Game Settings',
      items: [
        {
          icon: soundOn ? Volume2 : VolumeX,
          label: 'Sound Effects',
          toggle: true,
          checked: soundOn,
          onToggle: () => setSoundOn(!soundOn),
        },
        {
          icon: Settings,
          label: 'Vibration',
          toggle: true,
          checked: vibration,
          onToggle: () => setVibration(!vibration),
        },
        {
          icon: Bell,
          label: 'Notifications',
          toggle: true,
          checked: notifications,
          onToggle: () => setNotifications(!notifications),
        },
      ],
    },
    {
      section: 'History & Stats',
      items: [
        {
          icon: History,
          label: 'Hand History',
          action: () => setHistoryOpen(true),
        },
        {
          icon: BarChart3,
          label: 'Statistics',
          action: () => toast.info('Feature coming soon'),
        },
      ],
    },
    {
      section: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'How to Play',
          action: () => toast.info('Feature coming soon'),
        },
        {
          icon: Shield,
          label: 'Responsible Gaming',
          action: () => toast.info('Feature coming soon'),
        },
        {
          icon: FileText,
          label: 'Terms & Conditions',
          action: () => toast.info('Feature coming soon'),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'radial-gradient(ellipse at top, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold gold-text mb-5" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          SETTINGS
        </h1>

        {menuSections.map((section, si) => (
          <div key={section.section} className="mb-5">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              {section.section}
            </h2>
            <div className="rounded-xl overflow-hidden" style={{
              background: 'rgba(10, 10, 20, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: si * 0.1 + i * 0.05 }}
                    onClick={'onToggle' in item ? item.onToggle : 'action' in item ? item.action : undefined}
                    className="w-full flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                    style={i < section.items.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-gray-400" />
                      <span className="text-sm text-white">{item.label}</span>
                    </div>
                    {'toggle' in item && item.toggle ? (
                      <div className="relative" style={{ width: '40px', height: '22px' }}>
                        <div className={`w-full h-full rounded-full transition-all ${
                          item.checked ? '' : ''
                        }`} style={{
                          background: item.checked ? 'rgba(212, 175, 55, 0.3)' : 'rgba(100, 100, 100, 0.3)',
                          border: `1px solid ${item.checked ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                          <div className="absolute rounded-full transition-all" style={{
                            width: '16px', height: '16px', top: '2px',
                            left: item.checked ? '20px' : '2px',
                            background: item.checked ? '#D4AF37' : '#666',
                          }} />
                        </div>
                      </div>
                    ) : (
                      <ChevronRight size={16} className="text-gray-600" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {/* App info */}
        <div className="text-center mt-8 mb-4">
          <p className="text-xs text-gray-600">TON Poker v1.0.0</p>
          <p className="text-[10px] text-gray-700 mt-1">Play responsibly. 18+ only.</p>
        </div>
      </div>

      <HandHistory isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <BottomNav />
    </div>
  );
}

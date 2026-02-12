/*
 * Profile — Cyber Noir Casino theme
 * Player profile with stats, avatar selection, achievements
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Award, Star, Shield, Flame, Crosshair, Zap, Crown } from 'lucide-react';
import { ASSETS, AVATAR_LIST } from '@/lib/assets';
import BottomNav from '@/components/BottomNav';

const STATS = [
  { label: 'Hands Played', value: '1,247', icon: Target },
  { label: 'Win Rate', value: '34.2%', icon: TrendingUp },
  { label: 'Biggest Pot', value: '52,400', icon: Trophy },
  { label: 'Tournaments Won', value: '3', icon: Award },
];

const ACHIEVEMENTS = [
  { name: 'First Blood', desc: 'Win your first hand', done: true, icon: Crosshair, color: 'text-red-400' },
  { name: 'High Roller', desc: 'Win a pot over 10,000', done: true, icon: Flame, color: 'text-orange-400' },
  { name: 'Bluff Master', desc: 'Win 10 hands by bluffing', done: false, icon: Shield, color: 'text-purple-400' },
  { name: 'Royal Flush', desc: 'Get a Royal Flush', done: false, icon: Crown, color: 'text-gold' },
  { name: 'Shark', desc: 'Win 100 hands', done: false, icon: Zap, color: 'text-cyan-neon' },
  { name: 'Marathon', desc: 'Play 1000 hands', done: false, icon: Star, color: 'text-green-400' },
];

export default function Profile() {
  const [selectedAvatar, setSelectedAvatar] = useState('cat');

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'radial-gradient(ellipse at top, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      {/* Profile header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-full overflow-hidden"
              style={{
                border: '3px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0 0 25px rgba(212, 175, 55, 0.25)',
              }}
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={ASSETS.avatars[selectedAvatar as keyof typeof ASSETS.avatars] || ASSETS.avatars.cat}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #B8941F)',
                boxShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
              }}>
              <span className="text-xs font-bold text-black">42</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Player_001</h1>
            <p className="text-sm text-gray-400">Level 42 — Gold League</p>
            <div className="flex items-center gap-2 mt-1">
              <img src={ASSETS.ui.coin} alt="" className="w-4 h-4" />
              <span className="text-sm font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                10,000
              </span>
              <img src={ASSETS.ui.gem} alt="" className="w-4 h-4 ml-2" />
              <span className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00F0FF' }}>
                250
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="rounded-xl p-3 mb-6" style={{
          background: 'rgba(10, 10, 20, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
        }}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">Level 42</span>
            <span className="text-gold">7,250 / 10,000 XP</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '72.5%' }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #D4AF37, #F5E6A3)' }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-3"
                style={{
                  background: 'rgba(10, 10, 20, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Icon size={16} className="text-gold mb-1.5" />
                <div className="text-lg font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Avatar selection */}
        <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Choose Avatar</h2>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {AVATAR_LIST.map((avatar) => (
            <motion.button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                selectedAvatar === avatar.id
                  ? 'border-gold scale-105'
                  : 'border-white/10 hover:border-white/30'
              }`}
              style={selectedAvatar === avatar.id ? {
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
              } : {}}
              whileTap={{ scale: 0.9 }}
            >
              <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>

        {/* Achievements */}
        <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Achievements</h2>
        <div className="space-y-2">
          {ACHIEVEMENTS.map((ach, i) => {
            const Icon = ach.icon;
            return (
              <motion.div
                key={ach.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`rounded-xl p-3 flex items-center gap-3 ${!ach.done ? 'opacity-40' : ''}`}
                style={{
                  background: 'rgba(10, 10, 20, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: ach.done ? '1px solid rgba(212, 175, 55, 0.15)' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
                  background: ach.done ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.03)',
                }}>
                  <Icon size={18} className={ach.done ? ach.color : 'text-gray-600'} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{ach.name}</div>
                  <div className="text-xs text-gray-400">{ach.desc}</div>
                </div>
                {ach.done && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                    background: 'rgba(76, 175, 80, 0.15)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                  }}>
                    <span className="text-green-400 text-xs font-bold">✓</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

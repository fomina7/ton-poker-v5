/*
 * Cashier — Cyber Noir Casino theme
 * Deposit, withdraw, buy chips, daily bonus
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Sparkles, Wallet, CreditCard } from 'lucide-react';
import { ASSETS } from '@/lib/assets';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const CHIP_PACKAGES = [
  { amount: 1000, price: '$0.99', bonus: 0, popular: false },
  { amount: 5000, price: '$4.99', bonus: 500, popular: false },
  { amount: 15000, price: '$9.99', bonus: 2000, popular: true },
  { amount: 50000, price: '$29.99', bonus: 10000, popular: false },
  { amount: 150000, price: '$79.99', bonus: 40000, popular: false },
  { amount: 500000, price: '$199.99', bonus: 150000, popular: false },
];

export default function Cashier() {
  const [activeTab, setActiveTab] = useState<'shop' | 'deposit' | 'withdraw'>('shop');

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'radial-gradient(ellipse at top, #0d1117 0%, #080a0f 50%, #050507 100%)',
    }}>
      <div className="px-4 pt-4 pb-3">
        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(0, 240, 255, 0.04) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          {/* Subtle animated glow */}
          <motion.div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 relative z-10">Your Balance</div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <img src={ASSETS.ui.coin} alt="" className="w-8 h-8" />
            <span className="text-3xl font-bold text-gold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              10,000
            </span>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <img src={ASSETS.ui.gem} alt="" className="w-5 h-5" />
            <span className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00F0FF' }}>
              250
            </span>
            <span className="text-xs text-gray-500 ml-1">Gems</span>
          </div>
        </motion.div>

        {/* Daily bonus */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => toast.success('Daily bonus claimed! +500 chips')}
          className="w-full rounded-xl p-4 mb-5 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 200, 0, 0.08) 0%, rgba(0, 240, 255, 0.03) 100%)',
            border: '1px solid rgba(0, 200, 0, 0.25)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(0, 200, 0, 0.1)',
            border: '1px solid rgba(0, 200, 0, 0.2)',
          }}>
            <Gift size={24} className="text-green-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-green-400">Daily Bonus</div>
            <div className="text-xs text-gray-400">Claim your free 500 chips!</div>
          </div>
          <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{
            background: 'rgba(0, 200, 0, 0.15)',
            color: '#4CAF50',
            border: '1px solid rgba(0, 200, 0, 0.3)',
          }}>
            CLAIM
          </div>
        </motion.button>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{
          background: 'rgba(10, 10, 20, 0.5)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {[
            { key: 'shop' as const, label: 'Shop', icon: ShoppingCart },
            { key: 'deposit' as const, label: 'Deposit', icon: ArrowDownToLine },
            { key: 'withdraw' as const, label: 'Withdraw', icon: ArrowUpFromLine },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === tab.key
                    ? 'btn-primary-poker'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Shop content */}
        {activeTab === 'shop' && (
          <div className="grid grid-cols-2 gap-3">
            {CHIP_PACKAGES.map((pkg, i) => (
              <motion.button
                key={pkg.amount}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toast.info('Feature coming soon')}
                className="rounded-xl p-3 text-center relative overflow-hidden"
                style={{
                  background: pkg.popular
                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%)'
                    : 'rgba(10, 10, 20, 0.7)',
                  border: pkg.popular ? '2px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg" style={{
                    background: 'linear-gradient(135deg, #D4AF37, #B8941F)',
                  }}>
                    <span className="text-[8px] font-bold text-black">BEST VALUE</span>
                  </div>
                )}
                <img src={ASSETS.chips.gold} alt="" className="w-10 h-10 mx-auto mb-2" />
                <div className="text-lg font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {pkg.amount.toLocaleString()}
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-[10px] text-green-400 flex items-center justify-center gap-0.5">
                    <Sparkles size={10} /> +{pkg.bonus.toLocaleString()} bonus
                  </div>
                )}
                <div className="mt-2 py-1.5 rounded-lg text-sm font-bold" style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  color: '#D4AF37',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}>
                  {pkg.price}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Deposit */}
        {activeTab === 'deposit' && (
          <div className="rounded-xl p-8 text-center" style={{
            background: 'rgba(10, 10, 20, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(212, 175, 55, 0.15)',
          }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
            }}>
              <CreditCard size={28} className="text-gold" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Deposit Funds</h3>
            <p className="text-sm text-gray-400 mb-4">
              Connect your TON wallet to deposit cryptocurrency
            </p>
            <button
              onClick={() => toast.info('Feature coming soon')}
              className="btn-primary-poker px-6 py-3 rounded-xl text-sm font-bold tracking-wider"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              CONNECT WALLET
            </button>
          </div>
        )}

        {/* Withdraw */}
        {activeTab === 'withdraw' && (
          <div className="rounded-xl p-8 text-center" style={{
            background: 'rgba(10, 10, 20, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.15)',
            }}>
              <Wallet size={28} style={{ color: '#00F0FF' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Withdraw Funds</h3>
            <p className="text-sm text-gray-400 mb-4">
              Withdraw your winnings to your TON wallet
            </p>
            <button
              onClick={() => toast.info('Feature coming soon')}
              className="btn-primary-poker px-6 py-3 rounded-xl text-sm font-bold tracking-wider"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              WITHDRAW
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { ShieldCheck, Flame, Award, Zap, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">THE VEYRO MANIFESTO</span>
        <h1 className="text-4xl sm:text-6xl font-black text-neutral-900 dark:text-white tracking-tight uppercase leading-none">
          WEAR YOUR IDENTITY. NO COMPROMISE.
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-sans leading-relaxed">
          VEYRO was born out of a refusal to accept thin, flimsy fast-fashion streetwear. We engineer raw heavyweight silhouettes for those who lead with confidence.
        </p>
      </div>

      {/* Brand Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop"
            alt="VEYRO Design Studio"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white font-mono">
            <p className="text-xs text-amber-400 font-bold uppercase">VEYRO DESIGN STUDIO • NY / TYO</p>
            <p className="text-lg font-black uppercase">HAND CRAFTED SILHOUETTES</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-amber-500">OUR FOUNDING MISSION</span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">
              REDEFINING YOUTH STREETWEAR LUXURY
            </h2>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            In an era flooded with mass-produced synthetic tees that lose shape in two washes, VEYRO represents a return to heavy tactile substance. We spent 18 months developing our custom 320 GSM combed jersey and 480 GSM French Terry cottons.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { title: 'Heavyweight Density', desc: 'Custom 320 to 480 GSM organic cotton knit designed for boxy structural drape.' },
              { title: 'Serialized Limited Drops', desc: 'Small-batch production runs to guarantee rarity and eliminate environmental textile overflow.' },
              { title: 'Precision Drop Shoulders', desc: 'Ergonomic streetwear pattern cuts engineered specifically for youth proportions.' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase">{item.title}</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Matrix: VEYRO vs Generic Brands */}
      <div className="space-y-6">
        <div className="text-center">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">QUALITY STANDARDS</span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">
            WHY CHOOSE VEYRO?
          </h2>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white uppercase">
              <tr>
                <th className="p-4">Feature Standard</th>
                <th className="p-4 text-amber-500 font-black">VEYRO Streetwear</th>
                <th className="p-4 text-neutral-400">Standard Fast Fashion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {[
                { feature: 'Fabric Cotton Weight', veyro: '320 - 480 GSM Heavy Organic', standard: '140 - 180 GSM Thin Synthetic Blend' },
                { feature: 'Collar Rib Construction', veyro: 'Double-Thick Reinforced Ribbing', standard: 'Single Thin Rib (Bacons After 2 Washes)' },
                { feature: 'Silhouette Cut', veyro: 'Engineered Drop-Shoulder Boxy Fit', standard: 'Generic Tubular Mass-Market Fit' },
                { feature: 'Drop Rarity', veyro: 'Serialized Limited Batch Releases', standard: 'Overproduced Endless Inventory' },
                { feature: 'Wash Endurance', veyro: 'Pre-Shrunk 50+ Wash Guarantee', standard: 'Shrinks & Fades Instantly' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="p-4 font-bold text-neutral-900 dark:text-white">{row.feature}</td>
                  <td className="p-4 text-emerald-500 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{row.veyro}</span>
                  </td>
                  <td className="p-4 text-neutral-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>{row.standard}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-10 bg-neutral-900 text-white rounded-3xl text-center space-y-4 border border-neutral-800">
        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">READY TO ELEVATE YOUR STYLE?</h2>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Explore Drop 004 and experience the weight of raw streetwear luxury.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-neutral-200 transition shadow-xl inline-flex items-center gap-2"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

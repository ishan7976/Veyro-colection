import React, { useState } from 'react';
import { X, Ruler, Check } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  fitType?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, fitType = 'Oversized Boxy Fit' }) => {
  if (!isOpen) return null;

  const [unit, setUnit] = useState<'cm' | 'inches'>('cm');

  const sizeChart = [
    { size: 'XS', chestCm: '104 - 108', lengthCm: '70', sleeveCm: '21', chestIn: '41 - 42.5', lengthIn: '27.5', sleeveIn: '8.2' },
    { size: 'S', chestCm: '108 - 114', lengthCm: '72', sleeveCm: '22', chestIn: '42.5 - 45', lengthIn: '28.3', sleeveIn: '8.6' },
    { size: 'M', chestCm: '114 - 120', lengthCm: '74', sleeveCm: '23', chestIn: '45 - 47', lengthIn: '29.1', sleeveIn: '9.0' },
    { size: 'L', chestCm: '120 - 126', lengthCm: '76', sleeveCm: '24', chestIn: '47 - 49.5', lengthIn: '29.9', sleeveIn: '9.4' },
    { size: 'XL', chestCm: '126 - 132', lengthCm: '78', sleeveCm: '25', chestIn: '49.5 - 52', lengthIn: '30.7', sleeveIn: '9.8' },
    { size: 'XXL', chestCm: '132 - 138', lengthCm: '80', sleeveCm: '26', chestIn: '52 - 54.3', lengthIn: '31.5', sleeveIn: '10.2' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
            <Ruler className="w-6 h-6 text-neutral-900 dark:text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">VEYRO Size Guide</h2>
            <p className="text-xs text-neutral-500 font-mono">Current Silhouette: {fitType}</p>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 mb-6 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <p className="font-bold text-neutral-900 dark:text-white mb-1">Fit Recommendation:</p>
          {fitType.includes('Oversized') ? (
            <p>Our Oversized silhouettes are intentionally cut with drop shoulders and wider chest dimensions for an authentic streetwear drape. We recommend taking your <strong>true size</strong> for the intended boxy look, or sizing down 1 size for a standard fit.</p>
          ) : (
            <p>Our tailored streetwear cuts fit true to size. Take your standard size for a structured streetwear fit.</p>
          )}
        </div>

        {/* Unit Toggle */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                unit === 'cm' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Centimeters (cm)
            </button>
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                unit === 'inches' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Inches (in)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-neutral-900 dark:text-white font-mono uppercase">
              <tr>
                <th className="p-3">Size</th>
                <th className="p-3">Chest Width</th>
                <th className="p-3">Body Length</th>
                <th className="p-3">Sleeve Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
              {sizeChart.map((row) => (
                <tr key={row.size} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="p-3 font-bold text-neutral-900 dark:text-white">{row.size}</td>
                  <td className="p-3">{unit === 'cm' ? `${row.chestCm} cm` : `${row.chestIn} in`}</td>
                  <td className="p-3">{unit === 'cm' ? `${row.lengthCm} cm` : `${row.lengthIn} in`}</td>
                  <td className="p-3">{unit === 'cm' ? `${row.sleeveCm} cm` : `${row.sleeveIn} in`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

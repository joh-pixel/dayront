import { useState } from 'preact/hooks';

interface Props {
  label: string;
  color: string;
  onChange: (hex: string) => void;
}

const PRESETS = [
  '#ffffff', '#000000', '#38bdf8', '#818cf8', '#c084fc', '#f472b6', 
  '#fb7185', '#fbbf24', '#a3e635', '#34d399', '#2dd4bf', '#94a3b8'
];

export function ColorPicker({ label, color, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);

  function handleSave() {
    onChange(tempColor);
    setIsOpen(false);
  }

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => { setTempColor(color); setIsOpen(true); }}
        class="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <div 
          class="w-8 h-8 rounded-full shadow-inner border border-black/10 dark:border-white/10" 
          style={{ backgroundColor: color }} 
        />
        <span class="text-sm font-semibold text-left flex-1">{label}</span>
        <span class="text-xs font-mono text-gray-500 uppercase">{color}</span>
      </button>

      {/* Bottom Sheet Modal */}
      {isOpen && (
        <div class="fixed inset-0 z-50 flex flex-col justify-end">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div class="relative bg-white dark:bg-gray-900 rounded-t-3xl p-6 shadow-2xl animate-slide-up">
            <div class="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            
            <h3 class="text-lg font-bold mb-4 text-center">Select Color</h3>
            
            {/* Color Grid */}
            <div class="grid grid-cols-6 gap-3 mb-6">
              {PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setTempColor(preset)}
                  class={`aspect-square rounded-full shadow-sm border-2 transition ${tempColor === preset ? 'border-sky-500 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>

            {/* Custom Input */}
            <div class="flex gap-3 mb-8">
              <input 
                type="color" 
                value={tempColor} 
                onInput={(e: any) => setTempColor(e.target.value)}
                class="w-12 h-12 rounded-lg cursor-pointer border-none p-0 bg-transparent"
              />
              <input 
                type="text" 
                value={tempColor.toUpperCase()}
                onInput={(e: any) => setTempColor(e.target.value)}
                class="flex-1 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-sm uppercase"
              />
            </div>

            {/* Actions */}
            <div class="flex gap-3">
              <button onClick={() => setIsOpen(false)} class="flex-1 py-3 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl">Cancel</button>
              <button onClick={handleSave} class="flex-1 py-3 font-bold text-white bg-sky-500 rounded-xl shadow-lg shadow-sky-500/30">Set Color</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
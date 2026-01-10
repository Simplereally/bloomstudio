import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ArrowLeftRight } from 'lucide-react';

// ============================================================================
// SCHEMA / CONFIGURATION
// ============================================================================

const MAX_PIXELS = 16777216; // 16 megapixels
const MIN_ASPECT = 1/16;
const MAX_ASPECT = 16;

const PRESET_GROUPS = [
  {
    name: "16:9 Landscape",
    presets: [
      { width: 1280, height: 720, label: "HD (720p)" },
      { width: 1600, height: 900, label: "HD+" },
      { width: 1920, height: 1080, label: "Full HD (1080p)" },
      { width: 2048, height: 1152, label: "2K" },
      { width: 2560, height: 1440, label: "QHD (1440p)" },
      { width: 3200, height: 1800, label: "QHD+" },
      { width: 3840, height: 2160, label: "4K UHD" },
      { width: 4096, height: 2304, label: "4K+ (9.4MP)" },
      { width: 4480, height: 2520, label: "High Res (11.3MP)" },
      { width: 4608, height: 2592, label: "Ultra (11.9MP)" },
    ]
  },
  {
    name: "9:16 Portrait",
    presets: [
      { width: 720, height: 1280, label: "HD Portrait" },
      { width: 1080, height: 1920, label: "Full HD Portrait" },
      { width: 1440, height: 2560, label: "QHD Portrait" },
      { width: 1800, height: 3200, label: "QHD+ Portrait" },
      { width: 2160, height: 3840, label: "4K Portrait" },
      { width: 2304, height: 4096, label: "4K+ Portrait (9.4MP)" },
      { width: 2520, height: 4480, label: "High Res Portrait (11.3MP)" },
      { width: 2592, height: 4608, label: "Ultra Portrait (11.9MP)" },
    ]
  },
  {
    name: "1:1 Square",
    presets: [
      { width: 1024, height: 1024, label: "1K Square" },
      { width: 1536, height: 1536, label: "1.5K Square" },
      { width: 2048, height: 2048, label: "2K Square" },
      { width: 3072, height: 3072, label: "3K Square" },
      { width: 4096, height: 4096, label: "4K Square" },
    ]
  },
  {
    name: "4:3 Landscape",
    presets: [
      { width: 1024, height: 768, label: "XGA" },
      { width: 1600, height: 1200, label: "UXGA" },
      { width: 2048, height: 1536, label: "QXGA" },
      { width: 2560, height: 1920, label: "QSXGA" },
      { width: 3200, height: 2400, label: "QUXGA" },
      { width: 3840, height: 2880, label: "Ultra 4:3 (11.1MP)" },
      { width: 4096, height: 3072, label: "Max 4:3 (12.6MP)" },
    ]
  },
  {
    name: "3:4 Portrait",
    presets: [
      { width: 768, height: 1024, label: "XGA Portrait" },
      { width: 1200, height: 1600, label: "UXGA Portrait" },
      { width: 1536, height: 2048, label: "QXGA Portrait" },
      { width: 1920, height: 2560, label: "QSXGA Portrait" },
      { width: 2880, height: 3840, label: "Ultra 3:4 (11.1MP)" },
      { width: 3072, height: 4096, label: "Max 3:4 (12.6MP)" },
    ]
  },
  {
    name: "21:9 Ultrawide",
    presets: [
      { width: 2560, height: 1080, label: "UW Full HD" },
      { width: 3440, height: 1440, label: "UW QHD" },
      { width: 3840, height: 1600, label: "UW QHD+" },
      { width: 5120, height: 2160, label: "5K UW (11.1MP)" },
      { width: 5376, height: 2304, label: "Max UW (12.4MP)" },
    ]
  },
  {
    name: "9:21 Ultrawide Portrait",
    presets: [
      { width: 1080, height: 2520, label: "UW Portrait" },
      { width: 1440, height: 3360, label: "UW QHD Portrait" },
      { width: 2160, height: 5040, label: "5K UW Portrait (10.9MP)" },
    ]
  },
  {
    name: "3:2 Landscape",
    presets: [
      { width: 1536, height: 1024, label: "3:2 Standard" },
      { width: 2160, height: 1440, label: "3:2 HD" },
      { width: 3000, height: 2000, label: "3:2 High" },
      { width: 4096, height: 2731, label: "3:2 Ultra (11.2MP)" },
      { width: 4352, height: 2901, label: "3:2 Max (12.6MP)" },
    ]
  },
  {
    name: "2:3 Portrait",
    presets: [
      { width: 1024, height: 1536, label: "2:3 Standard" },
      { width: 1440, height: 2160, label: "2:3 HD" },
      { width: 2000, height: 3000, label: "2:3 High" },
      { width: 2731, height: 4096, label: "2:3 Ultra (11.2MP)" },
      { width: 2901, height: 4352, label: "2:3 Max (12.6MP)" },
    ]
  },
  {
    name: "5K & High MP",
    presets: [
      { width: 5120, height: 2880, label: "5K (14.7MP)" },
      { width: 4096, height: 3584, label: "14:9 (14.7MP)" },
      { width: 3840, height: 4096, label: "15:16 (15.7MP)" },
      { width: 4000, height: 4000, label: "Square (16MP)" },
    ]
  },
  {
    name: "Other Ratios",
    presets: [
      { width: 1920, height: 1200, label: "16:10 WUXGA" },
      { width: 2560, height: 1600, label: "16:10 WQXGA" },
      { width: 3840, height: 2400, label: "16:10 Ultra (9.2MP)" },
      { width: 4096, height: 2560, label: "16:10 Max (10.5MP)" },
      { width: 2560, height: 2048, label: "5:4 QSXGA" },
      { width: 3840, height: 3072, label: "5:4 Ultra (11.8MP)" },
      { width: 4096, height: 3277, label: "5:4 Max (13.4MP)" },
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateAspectRatio(width, height) {
  return width / height;
}

function calculateMegapixels(width, height) {
  return (width * height) / 1000000;
}

function getAspectRatioLabel(width, height) {
  const ratio = width / height;
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  
  // Simplify common ratios
  if (Math.abs(ratio - 16/9) < 0.01) return "16:9";
  if (Math.abs(ratio - 9/16) < 0.01) return "9:16";
  if (Math.abs(ratio - 1) < 0.01) return "1:1";
  if (Math.abs(ratio - 4/3) < 0.01) return "4:3";
  if (Math.abs(ratio - 3/4) < 0.01) return "3:4";
  if (Math.abs(ratio - 21/9) < 0.01) return "21:9";
  if (Math.abs(ratio - 9/21) < 0.01) return "9:21";
  if (Math.abs(ratio - 3/2) < 0.01) return "3:2";
  if (Math.abs(ratio - 2/3) < 0.01) return "2:3";
  
  // For other ratios, show simplified
  if (w <= 100 && h <= 100) {
    return `${w}:${h}`;
  }
  return ratio.toFixed(2) + ":1";
}

function validateDimensions(width, height) {
  const ratio = calculateAspectRatio(width, height);
  const pixels = width * height;
  
  const errors = [];
  
  if (ratio < MIN_ASPECT) {
    errors.push(`Aspect ratio too narrow (min ${MIN_ASPECT}:1)`);
  }
  if (ratio > MAX_ASPECT) {
    errors.push(`Aspect ratio too wide (max ${MAX_ASPECT}:1)`);
  }
  if (pixels > MAX_PIXELS) {
    errors.push(`Exceeds ${(MAX_PIXELS/1000000).toFixed(1)}MP limit`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function getConstraints(width, height, fixedDimension) {
  if (fixedDimension === 'width') {
    const minHeight = Math.ceil(width / MAX_ASPECT);
    const maxHeight = Math.floor(width / MIN_ASPECT);
    const maxHeightByPixels = Math.floor(MAX_PIXELS / width);
    return {
      min: minHeight,
      max: Math.min(maxHeight, maxHeightByPixels)
    };
  } else {
    const minWidth = Math.ceil(height * MIN_ASPECT);
    const maxWidth = Math.floor(height * MAX_ASPECT);
    const maxWidthByPixels = Math.floor(MAX_PIXELS / height);
    return {
      min: minWidth,
      max: Math.min(maxWidth, maxWidthByPixels)
    };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ResolutionPicker() {
  const [mode, setMode] = useState('preset'); // 'preset' or 'custom'
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [aspectLocked, setAspectLocked] = useState(false);
  const [lockedRatio, setLockedRatio] = useState(16/9);
  
  const validation = validateDimensions(width, height);
  const megapixels = calculateMegapixels(width, height);
  const aspectRatioLabel = getAspectRatioLabel(width, height);
  
  const widthConstraints = getConstraints(width, height, 'width');
  const heightConstraints = getConstraints(width, height, 'height');
  
  const handlePresetClick = (preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setMode('custom');
  };
  
  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    
    if (aspectLocked && newWidth > 0) {
      const newHeight = Math.round(newWidth / lockedRatio);
      setHeight(newHeight);
    }
  };
  
  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    
    if (aspectLocked && newHeight > 0) {
      const newWidth = Math.round(newHeight * lockedRatio);
      setWidth(newWidth);
    }
  };
  
  const toggleAspectLock = () => {
    if (!aspectLocked) {
      setLockedRatio(width / height);
    }
    setAspectLocked(!aspectLocked);
  };
  
  const flipDimensions = () => {
    setWidth(height);
    setHeight(width);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Image Resolution</h1>
        <p className="text-slate-400 mb-8">Select a preset or enter custom dimensions</p>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('preset')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'preset'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'custom'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Custom
          </button>
        </div>
        
        {/* Preset Mode */}
        {mode === 'preset' && (
          <div className="space-y-6">
            {PRESET_GROUPS.map((group) => (
              <div key={group.name} className="bg-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">{group.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.presets.map((preset) => (
                    <button
                      key={`${preset.width}x${preset.height}`}
                      onClick={() => handlePresetClick(preset)}
                      className="bg-slate-700 hover:bg-slate-600 text-left p-4 rounded-lg transition-all hover:scale-105"
                    >
                      <div className="text-white font-medium">{preset.label}</div>
                      <div className="text-slate-400 text-sm">{preset.width} × {preset.height}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        {calculateMegapixels(preset.width, preset.height).toFixed(2)} MP
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Custom Mode */}
        {mode === 'custom' && (
          <div className="bg-slate-800 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={handleWidthChange}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border-2 border-slate-600 focus:border-blue-500 focus:outline-none"
                    min="1"
                  />
                  <div className="text-slate-400 text-sm mt-2">
                    Valid range: {heightConstraints.min}px - {heightConstraints.max.toLocaleString()}px
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={toggleAspectLock}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      aspectLocked
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {aspectLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    {aspectLocked ? 'Locked' : 'Unlocked'}
                  </button>
                  
                  <button
                    onClick={flipDimensions}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
                  >
                    <ArrowLeftRight size={20} />
                    Flip
                  </button>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Height (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={handleHeightChange}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border-2 border-slate-600 focus:border-blue-500 focus:outline-none"
                    min="1"
                  />
                  <div className="text-slate-400 text-sm mt-2">
                    Valid range: {widthConstraints.min}px - {widthConstraints.max.toLocaleString()}px
                  </div>
                </div>
              </div>
              
              {/* Right Column - Preview & Info */}
              <div className="space-y-6">
                {/* Visual Preview */}
                <div className="bg-slate-900 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4">Preview</h3>
                  <div className="flex items-center justify-center h-48">
                    <div
                      className="bg-gradient-to-br from-blue-500 to-purple-500 rounded shadow-lg"
                      style={{
                        width: Math.min(200, (width / height) * 150) + 'px',
                        height: Math.min(150, (height / width) * 200) + 'px',
                      }}
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="bg-slate-900 rounded-lg p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aspect Ratio</span>
                    <span className="text-white font-medium">{aspectRatioLabel}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Megapixels</span>
                    <span className="text-white font-medium">
                      {megapixels.toFixed(2)} MP / {(MAX_PIXELS/1000000).toFixed(1)} MP
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dimensions</span>
                    <span className="text-white font-medium">{width} × {height}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-700">
                    {validation.valid ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Valid dimensions</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {validation.errors.map((error, i) => (
                          <div key={i} className="flex items-start gap-2 text-red-400">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">{error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Generate Button */}
                <button
                  disabled={!validation.valid}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                    validation.valid
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Generate Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
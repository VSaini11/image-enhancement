import React, { useState, useRef } from 'react';

const ImageEnhancer = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setOriginalImage(img);
          setEnhancedImage(img);
          enhanceImage(img, brightness, contrast, saturation, sharpness);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const enhanceImage = (img, brightnessVal, contrastVal, saturationVal, sharpnessVal) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;

    // Apply base filters
    ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturationVal}%)`;
    ctx.drawImage(img, 0, 0);

    // Sharpening effect
    if (sharpnessVal > 0) {
      // Create sharpening kernel
      const sharpenKernel = [
        -1/9, -1/9, -1/9,
        -1/9,  17/9, -1/9,
        -1/9, -1/9, -1/9
      ];

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Create a copy of image data for processing
      const outputData = ctx.createImageData(width, height);
      const output = outputData.data;

      // Apply sharpening kernel
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let r = 0, g = 0, b = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4;
              const kernelVal = sharpenKernel[(ky + 1) * 3 + (kx + 1)];
              r += data[idx] * kernelVal;
              g += data[idx + 1] * kernelVal;
              b += data[idx + 2] * kernelVal;
            }
          }

          const outputIdx = (y * width + x) * 4;
          output[outputIdx] = Math.min(255, Math.max(0, r * (sharpnessVal / 100)));
          output[outputIdx + 1] = Math.min(255, Math.max(0, g * (sharpnessVal / 100)));
          output[outputIdx + 2] = Math.min(255, Math.max(0, b * (sharpnessVal / 100)));
          output[outputIdx + 3] = 255;
        }
      }

      // Put the sharpened image data back on canvas
      ctx.putImageData(outputData, 0, 0);
    }

    // Reset filter
    ctx.filter = 'none';

    // Update enhanced image state
    setEnhancedImage(canvas.toDataURL());
  };

  const resetEnhancements = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(0);
    if (originalImage) {
      enhanceImage(originalImage, 100, 100, 100, 0);
    }
  };

  const downloadEnhancedImage = () => {
    if (!enhancedImage) return;

    const link = document.createElement('a');
    link.download = 'enhanced-image.png';
    link.href = enhancedImage instanceof HTMLImageElement 
      ? enhancedImage.src 
      : enhancedImage;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Image Enhancer</h1>
        
        <div className="flex flex-col items-center space-y-4">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full max-w-md"
          >
            Upload Image
          </button>

          {originalImage && (
            <div className="w-full grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-center font-semibold mb-2">Original Image</h2>
                <img 
                  src={originalImage.src} 
                  alt="Original" 
                  className="max-w-full h-auto border rounded"
                />
              </div>
              <div>
                <h2 className="text-center font-semibold mb-2">Enhanced Image</h2>
                <img 
                  src={enhancedImage} 
                  alt="Enhanced" 
                  className="max-w-full h-auto border rounded"
                />
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block mb-2">Brightness: {brightness}%</label>
              <input
                type="range"
                value={brightness}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBrightness(val);
                  enhanceImage(originalImage, val, contrast, saturation, sharpness);
                }}
                min={0}
                max={200}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block mb-2">Contrast: {contrast}%</label>
              <input
                type="range"
                value={contrast}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setContrast(val);
                  enhanceImage(originalImage, brightness, val, saturation, sharpness);
                }}
                min={0}
                max={200}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block mb-2">Saturation: {saturation}%</label>
              <input
                type="range"
                value={saturation}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSaturation(val);
                  enhanceImage(originalImage, brightness, contrast, val, sharpness);
                }}
                min={0}
                max={200}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block mb-2">Sharpness: {sharpness}%</label>
              <input
                type="range"
                value={sharpness}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSharpness(val);
                  enhanceImage(originalImage, brightness, contrast, saturation, val);
                }}
                min={0}
                max={200}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={resetEnhancements} 
                className="w-1/2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Reset Enhancements
              </button>
              <button 
                onClick={downloadEnhancedImage}
                disabled={!enhancedImage}
                className="w-1/2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEnhancer;
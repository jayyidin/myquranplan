// File: src/components/modals/ImageCropModal.jsx
import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Crop } from 'lucide-react';

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null); // Tambahkan ref untuk canvas

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    // Membuat crop awal di tengah dengan aspek rasio 1:1
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  const handleCrop = () => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !completedCrop) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Guard against SSR environments by checking for window
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    // Tingkatkan resolusi canvas untuk layar HiDPI (Retina)
    canvas.width = completedCrop.width * dpr;
    canvas.height = completedCrop.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.scale(dpr, dpr);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(blob => {
      if (blob) onCropComplete(blob);
    }, 'image/jpeg', 0.95);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-center items-center bg-slate-900/80 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 flex justify-between items-center border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Crop size={20} className="text-emerald-500" />
            Potong Gambar Profil
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 bg-slate-50 flex justify-center items-center">
          {imageSrc && (
            <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop={true}>
              <img ref={imgRef} alt="Crop me" src={imageSrc} onLoad={onImageLoad} className="max-h-[60vh]" />
            </ReactCrop>
          )}
          {/* Canvas untuk cropping, disembunyikan dari view */}
          <canvas
            ref={canvasRef}
            style={{
              display: 'none',
            }}
          />
        </div>
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors">
            Batal
          </button>
          <button onClick={handleCrop} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50 active:scale-95 transition-all">
            Simpan & Unggah
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
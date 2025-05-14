// App.js
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { OrbitControls, Html } from '@react-three/drei';
import { SketchPicker } from 'react-color';
import { saveAs } from 'file-saver';
import './index.css';

function TShirtModel({ scale, textureImage, customText, shirtColor, fontStyle, textColor, canvasRef }) {
  const tshirtGltf = useLoader(GLTFLoader, '/models/tshirt.glb');
  const [dynamicTexture, setDynamicTexture] = useState(null);

  useEffect(() => {
    if (!textureImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = textureImage;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const maxLogoWidth = canvas.width * 0.2;
      const maxLogoHeight = canvas.height * 0.2;
      let logoWidth = img.width;
      let logoHeight = img.height;

      if (logoWidth > maxLogoWidth) {
        const ratio = maxLogoWidth / logoWidth;
        logoWidth = maxLogoWidth;
        logoHeight *= ratio;
      }

      if (logoHeight > maxLogoHeight) {
        const ratio = maxLogoHeight / logoHeight;
        logoHeight = maxLogoHeight;
        logoWidth *= ratio;
      }

      const x = (canvas.width - logoWidth) / 4;
      const y = (canvas.height - logoHeight) / 1.7;
      ctx.drawImage(img, x, y, logoWidth, logoHeight);

      if (customText) {
        const lines = customText.split('\n').slice(0, 3);
        ctx.font = `bold 48px ${fontStyle}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        lines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 3.5, y + logoHeight + 30 + index * 50);
        });
      }

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      setDynamicTexture(texture);
      canvasRef.current = canvas;
    };
  }, [textureImage, customText, fontStyle, textColor]);

  useEffect(() => {
    if (dynamicTexture) {
      tshirtGltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: dynamicTexture,
            roughness: 0.5,
            metalness: 0.1,
            color: new THREE.Color(shirtColor),
          });
        }
      });
    }
  }, [dynamicTexture, tshirtGltf, shirtColor]);

  useEffect(() => {
    tshirtGltf.scene.scale.set(scale, scale, scale);
    tshirtGltf.scene.position.set(0, -1, 0);
  }, [tshirtGltf, scale]);

  return <primitive object={tshirtGltf.scene} />;
}

function App() {
  const { register, handleSubmit } = useForm();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [customText, setCustomText] = useState('');
  const [show3DModel, setShow3DModel] = useState(false);
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(80);
  const [build, setBuild] = useState('athletic');
  const [avatarScale, setAvatarScale] = useState(1);
  const [shirtColor, setShirtColor] = useState('#ffffff');
  const [theme, setTheme] = useState('classic');
  const [fontStyle, setFontStyle] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const canvasRef = useRef();

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleTextChange = (e) => {
    if (e.target.value.split('\n').length <= 3) setCustomText(e.target.value);
  };

  const toggle3DModel = () => setShow3DModel(!show3DModel);

  const calculateAvatarScale = () => {
    let scale = height / 180;
    if (build === 'lean') scale *= 0.9;
    else if (build === 'big') scale *= 1.1;
    return scale;
  };

  useEffect(() => setAvatarScale(calculateAvatarScale()), [height, weight, build]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.altKey && e.key === 'q') toggle3DModel(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleColorChange = (color) => setShirtColor(color.hex);

  const handleDownloadTexture = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'custom-tshirt.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleExportConfig = () => {
    const config = {
      height,
      weight,
      build,
      shirtColor,
      fontStyle,
      textColor,
      customText,
      uploadedImage,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    saveAs(blob, 'tshirt-config.json');
  };

  const themeStyles = {
    classic: 'font-serif text-base text-gray-900',
    modern: 'font-sans text-lg text-gray-800',
    funky: 'font-mono text-md text-purple-700',
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 ${themeStyles[theme]} bg-gray-100`}>
      <form onSubmit={handleSubmit(() => {})} className="p-6 bg-white shadow-xl rounded-lg w-full max-w-4xl">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">POD T-Shirt Customization</h1>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="border rounded px-2">
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="funky">Funky</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold">Height</label>
          <input type="range" {...register('height')} value={height} onChange={(e) => setHeight(Number(e.target.value))} min="100" max="250" className="w-full mt-2" />
          <div className="text-center text-sm mt-2">{height} cm</div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold">Weight</label>
          <input type="range" {...register('weight')} value={weight} onChange={(e) => setWeight(Number(e.target.value))} min="30" max="200" className="w-full mt-2" />
          <div className="text-center text-sm mt-2">{weight} kg</div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold">Build</label>
          <select {...register('build')} value={build} onChange={(e) => setBuild(e.target.value)} className="w-full mt-2">
            <option value="lean">Lean</option>
            <option value="regular">Regular</option>
            <option value="athletic">Athletic</option>
            <option value="big">Big</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold">T-shirt Color</label>
          <SketchPicker color={shirtColor} onChange={handleColorChange} />
        </div>

        <div className="mb-4">
          <label className="block font-semibold">Font Style</label>
          <select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} className="w-full mt-2">
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold">Text Color</label>
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10 p-1 mt-2 border rounded" />
        </div>

        <div {...getRootProps()} className="border-dashed border-2 p-4 w-full flex justify-center mb-4 cursor-pointer">
          <input {...getInputProps()} />
          <p>Drag and drop an image here, or click to select one</p>
        </div>

        {uploadedImage && <img src={uploadedImage} alt="Uploaded design" className="w-full max-h-72 mb-4 object-contain" />}

        <textarea className="w-full p-2 border rounded-md mb-4" placeholder="Enter text (max 3 lines)" value={customText} onChange={handleTextChange} />

        <div className="flex gap-4 mt-4">
          <button type="button" onClick={toggle3DModel} className="py-2 px-4 bg-blue-500 text-white rounded-md">Toggle 3D Model (Alt + Q)</button>
          <button type="button" onClick={handleDownloadTexture} className="py-2 px-4 bg-green-500 text-white rounded-md">Download Design</button>
          <button type="button" onClick={handleExportConfig} className="py-2 px-4 bg-gray-700 text-white rounded-md">Export Config</button>
        </div>
      </form>

      {show3DModel && uploadedImage && (
        <div className="w-full h-96 mt-4 bg-white rounded shadow">
          <Canvas>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} />
            <OrbitControls />
            <Suspense fallback={<Html center><span className="text-white bg-black p-2 rounded">Loading 3D model...</span></Html>}>
              <TShirtModel
                scale={avatarScale}
                textureImage={uploadedImage}
                customText={customText}
                shirtColor={shirtColor}
                fontStyle={fontStyle}
                textColor={textColor}
                canvasRef={canvasRef}
              />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}

export default App;

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';  // Drei provides useful helpers like OrbitControls
import { Suspense } from 'react';

const CharacterModel = () => {
  // Load GLTF model (update path to your actual model)
  const { scene } = useGLTF('/models/character.gltf'); // Ensure your model path is correct

  return <primitive object={scene} scale={0.5} />;
};

const CharacterViewer = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <Canvas
          camera={{ position: [0, 1, 3], fov: 50 }}
          style={{ background: 'black' }}
        >
          {/* Lighting to make the model visible */}
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} />
          
          {/* OrbitControls: allows user to rotate the model */}
          <OrbitControls />
          
          {/* Character model */}
          <CharacterModel />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default CharacterViewer;

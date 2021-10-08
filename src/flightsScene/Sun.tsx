import React, { useRef } from 'react';
import { PointLight } from 'three';
import { useFrame } from '@react-three/fiber';

export default function Sun() {
  const ref = useRef<PointLight>();

  useFrame((state, delta) => {
    const phase = (state.clock.elapsedTime % 3) / 3;
    const phaseRadians = Math.PI * 2 * phase;

    if (ref.current) {
      const x = Math.sin(phaseRadians) * 10;
      const z = Math.cos(phaseRadians) * 10;
      ref.current.position.set(x, 0, z);
    }
  });

  return (
    <group ref={ref} position={[2, 2, 2]}>
      <Sphere baseColor={'yellow'} position={[10 / 10, 0, 10 / 10]} />
      <pointLight intensity={5.0} />
    </group>
  );
}

function Sphere(
  props: React.PropsWithChildren<{ position: [x: number, y: number, z: number]; baseColor: string; reference?: any }>
) {
  return (
    <mesh {...props} ref={props.reference}>
      <sphereGeometry args={[0.1]} />
      <meshStandardMaterial color={props.baseColor} />
    </mesh>
  );
}

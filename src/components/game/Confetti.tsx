import { useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#FF394A', '#3055B3', '#44cc44', '#ffcc00', '#ff66ff', '#ffffff'];

interface Particle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
}

export function Confetti() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 3 + Math.random() * 6,
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            rotate: p.rotation,
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            rotate: [p.rotation, p.rotation + 720],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VisualizerProps {
  isPlaying: boolean;
}

export default function Visualizer({ isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    hue: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          hue: Math.random() * 60 + 240, // Blue to purple range
        });
      }
      particlesRef.current = newParticles;
    };

    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.map(particle => {
        // Update position
        let newX = particle.x + particle.vx;
        let newY = particle.y + particle.vy;

        // Add gentle floating motion
        if (isPlaying) {
          newX += Math.sin(Date.now() * 0.001 + particle.x * 0.01) * 0.2;
          newY += Math.cos(Date.now() * 0.001 + particle.y * 0.01) * 0.2;
        }

        // Wrap around edges
        if (newX < 0) newX = canvas.width;
        if (newX > canvas.width) newX = 0;
        if (newY < 0) newY = canvas.height;
        if (newY > canvas.height) newY = 0;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = `hsl(${particle.hue}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return {
          ...particle,
          x: newX,
          y: newY,
        };
      });

      // Draw connecting lines between nearby particles
      if (isPlaying) {
        particlesRef.current.forEach((particle, i) => {
          particlesRef.current.slice(i + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.save();
              ctx.globalAlpha = (100 - distance) / 100 * 0.3;
              ctx.strokeStyle = `hsl(${(particle.hue + otherParticle.hue) / 2}, 70%, 60%)`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
              ctx.restore();
            }
          });
        });
      }

      // Draw wave effect
      if (isPlaying) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x += 5) {
          const y = canvas.height / 2 + Math.sin(x * 0.01 + Date.now() * 0.003) * 30;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Overlay text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isPlaying ? 1 : 0.3 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{
              scale: isPlaying ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 2,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut"
            }}
            className="text-4xl mb-2"
          >
            {isPlaying ? '🎵' : '🎶'}
          </motion.div>
          <p className="text-white/60 text-sm">
            {isPlaying ? 'Your soundscape is playing' : 'Visualizer ready'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

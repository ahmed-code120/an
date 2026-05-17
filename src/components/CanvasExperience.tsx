import { useEffect, useRef } from "react";
import { SceneController } from "../experience/SceneController";

export function CanvasExperience({ activeScene, scrollProgress }: { activeScene: number, scrollProgress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<SceneController | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize
    const canvas = canvasRef.current;
    controllerRef.current = new SceneController(canvas);
    
    // Cleanup
    return () => {
      controllerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setScene(activeScene);
    }
  }, [activeScene]);

  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setScrollProgress(scrollProgress);
    }
  }, [scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: "#060608" }}
    />
  );
}


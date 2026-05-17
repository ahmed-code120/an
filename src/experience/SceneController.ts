export class SceneController {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  activeScene: number = 0;
  animationFrameId: number = 0;
  
  // Entities
  stars: Star[] = [];
  particles: Particle[] = [];
  tunisiaGeojson: any = null;
  worldGeojson: any = null;
  d3GeoModule: any = null;
  tunisiaPath: Path2D;
  tunisiaPoints: {x: number, y: number}[] = [];
  
  // State
  explosionTriggered = false;
  nodes: NetworkNode[] = [];
  lines: NetworkLine[] = [];
  shootingStars: ShootingStar[] = [];
  lightningVeins: {x1:number, y1:number, x2:number, y2:number, thick:number}[] = [];
  lastShootingStar = Date.now();
  nextShootingStarDelay = Math.random() * 4000 + 8000;
  
  scrollProgress: number = 0;
  
  globeRotX: number = 0.2;
  globeRotY: number = -Math.PI / 4;
  
  // Mouse
  mouse = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2d context");
    this.ctx = context;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    
    window.addEventListener("resize", this.resize);
    window.addEventListener("mousemove", this.handleMouseMove);
    
    // this.initPath(); // Optional, keep to avoid breaking points if needed, but we don't draw it
    this.loadRealTunisiaMap();
    this.resize();
    this.initStars();
    this.initNetwork();
    
    this.loop(0);
  }

  async loadRealTunisiaMap() {
    try {
      this.d3GeoModule = await import("d3-geo");
      
      const topojsonClient = await import("topojson-client");
      const topoRes = await fetch("https://unpkg.com/world-atlas@2.0.2/countries-110m.json");
      const topoData = await topoRes.json();
      this.worldGeojson = topojsonClient.feature(topoData, topoData.objects.countries);

      const res = await fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries/TUN.geo.json");
      this.tunisiaGeojson = await res.json();
      
      const projection = this.d3GeoModule.geoMercator()
         .center([9.5375, 33.8869])
         .scale(1200)
         .translate([50, 88]);

      const pathGenerator = this.d3GeoModule.geoPath().projection(projection);
      const svgPath = pathGenerator(this.tunisiaGeojson);
      if (svgPath) {
        this.tunisiaPath = new Path2D(svgPath);

        // Re-generate points using the real path
        this.tunisiaPoints = [];
        const tempCanvas = document.createElement("canvas");
        const tCtx = tempCanvas.getContext("2d");
        if (tCtx) {
            let attempt = 0;
            while (this.tunisiaPoints.length < 300 && attempt < 10000) {
                let px = Math.random() * 200 - 50; 
                let py = Math.random() * 300 - 50;
                if (tCtx.isPointInPath(this.tunisiaPath, px, py)) {
                    this.tunisiaPoints.push({x: px, y: py});
                }
                attempt++;
            }
        }
      }
    } catch(e) {
      console.error(e);
    }
  }

  setScene(index: number) {
    this.activeScene = index;
    if (index >= 1 && !this.explosionTriggered) {
        this.triggerExplosion();
    }
  }

  setScrollProgress(progress: number) {
    this.scrollProgress = progress;
  }

  handleMouseMove(_e: MouseEvent) {
    // Disabled mouse interactions as requested
  }

  initPath() {
    // The simplified Tunisia SVG path
    const pathStr = "M49.38,177.65 L38.62,132.36 L23.07,122.18 L22.85,116.08 L2.22,101.05 L0.00,82.05 L15.55,67.98 L21.49,47.17 L17.49,23.13 L22.61,10.18 L50.08,0.00 L67.74,3.03 L67.00,15.79 L88.40,6.51 L90.19,11.35 L77.58,23.71 L77.41,35.38 L86.14,41.65 L82.82,63.48 L66.22,76.16 L71.01,89.91 L84.06,90.34 L90.41,102.33 L100.00,106.27 L98.57,125.65 L86.28,132.89 L78.51,140.97 L61.19,150.69 L63.87,161.14 L61.69,171.80 L49.38,177.65 Z";
    this.tunisiaPath = new Path2D(pathStr);
    
    // Create some points for explosion origin
    for (let i = 0; i < 300; i++) {
       this.tunisiaPoints.push({
         x: Math.random() * 100,
         y: Math.random() * 177
       });
    }

    // Generate internal lightning veins (Recursive branching)
    this.lightningVeins = [];
    const createBranch = (x: number, y: number, length: number, angle: number, depth: number) => {
        if (depth === 0) return;
        
        const nextX = x + Math.cos(angle) * length;
        const nextY = y + Math.sin(angle) * length;
        
        this.lightningVeins.push({
             x1: x, y1: y, x2: nextX, y2: nextY, thick: depth * 0.5
        });
        
        // Branch out
        const numBranches = Math.floor(Math.random() * 3) + 1; // 1 to 3 branches
        for (let i = 0; i < numBranches; i++) {
           const newAngle = angle + (Math.random() - 0.5) * Math.PI * 0.8;
           const newLength = length * (0.6 + Math.random() * 0.3);
           createBranch(nextX, nextY, newLength, newAngle, depth - 1);
        }
    };

    // 8 main arteries
    for (let i = 0; i < 8; i++) {
        createBranch(50, 88.5, 15 + Math.random() * 10, (i / 8) * Math.PI * 2 + Math.random(), 5);
    }
  }

  createStar(zStart?: number): Star {
      return {
          x: (Math.random() - 0.5) * this.width * 3,
          y: (Math.random() - 0.5) * this.height * 3,
          z: zStart ?? this.width,
          size: Math.random() * 1.5 + 0.5,
          color: Math.random() > 0.8 ? "#8EB4FF" : "#F0ECE4",
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.05 + 0.01,
          twinkleIntensity: Math.random() * 0.5 + 0.3
      };
  }

  initStars() {
    this.stars = [];
    const count = window.innerWidth < 768 ? 200 : 800;
    for (let i = 0; i < count; i++) {
        this.stars.push(this.createStar(Math.random() * this.width));
    }
  }
  
  initNetwork() {
      // Centers
      const cx = this.width / 2;
      const cy = this.height / 2;
      
      this.nodes = [
          { id: "tunis", lat: 33.8869, lon: 9.5375, x: 0, y: 0, z: 0, label: "Tunisia Core", isCenter: true },
          { id: "sf", lat: 37.7749, lon: -122.4194, x: 0, y: 0, z: 0, label: "San Francisco", isCenter: false },
          { id: "london", lat: 51.5074, lon: -0.1278, x: 0, y: 0, z: 0, label: "London", isCenter: false },
          { id: "dubai", lat: 25.2048, lon: 55.2708, x: 0, y: 0, z: 0, label: "Dubai", isCenter: false },
          { id: "singapore", lat: 1.3521, lon: 103.8198, x: 0, y: 0, z: 0, label: "Singapore", isCenter: false },
          { id: "tokyo", lat: 35.6762, lon: 139.6503, x: 0, y: 0, z: 0, label: "Tokyo", isCenter: false },
          { id: "saopaulo", lat: -23.5505, lon: -46.6333, x: 0, y: 0, z: 0, label: "São Paulo", isCenter: false },
      ];
      
      this.lines = this.nodes.filter(n => !n.isCenter).map(target => ({
          from: this.nodes[0],
          to: target,
          progress: 0,
          speed: 0.003 + Math.random() * 0.005
      }));
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Fixed center point for hover logics
    this.mouse.x = this.width / 2;
    this.mouse.y = this.height / 2;
    
    // Re-init network positions if needed
    if (this.nodes.length > 0) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      this.nodes[0].x = cx;
      this.nodes[0].y = cy;
      // Adjust other nodes based on screen size ideally
    }
  }

  triggerExplosion() {
    this.explosionTriggered = true;
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    const count = window.innerWidth < 768 ? 150 : 400;
    
    // Dark luxury aesthetic colors
    const colors = ["#FF2B45", "#8A0514", "#F0ECE4", "#FF5D73", "#3B0209"];
    
    for (let i = 0; i < count; i++) {
        // Expand from center cluster
        const angle = Math.random() * Math.PI * 2;
        const isCore = Math.random() > 0.8;
        const r = isCore ? Math.random() * 20 : Math.random() * 80;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        
        const speed = isCore ? Math.random() * 5 + 2 : Math.random() * 30 + 10;
        const size = isCore ? Math.random() * 4 + 2 : Math.random() * 2 + 0.5;
        
        this.particles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 5,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 5,
            size: size,
            life: 1.0,
            decay: Math.random() * 0.012 + 0.006, 
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
  }

  loop(time: number) {
    this.update(time);
    this.draw(time);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  latLonTo3D(lat: number, lon: number, radius: number, rotX: number, rotY: number) {
      const radLat = lat * (Math.PI / 180);
      const radLon = lon * (Math.PI / 180);

      // Standard spherical for d3 orthographic front at z
      let x = radius * Math.cos(radLat) * Math.sin(radLon);
      let y = -radius * Math.sin(radLat);
      let z = radius * Math.cos(radLat) * Math.cos(radLon);

      // Rotate Y (Longitude)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      let x2 = x * cosY - z * sinY;
      let z2 = z * cosY + x * sinY;
      x = x2;
      z = z2;

      // Rotate X (Latitude)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      let y3 = y * cosX - z * sinX;
      let z3 = z * cosX + y * sinX;
      y = y3;
      z = z3;

      return { x, y, z };
  }

  update(time: number) {
    const elapsed = Date.now();
    
    // Stars
    let speed = this.activeScene === 2 ? 25 : (this.activeScene === 1 ? 5 : 0.5); 
    
    this.stars.forEach(star => {
        star.z -= speed;
        // Mouse parallax removed as requested

        if (star.z <= 0) {
            Object.assign(star, this.createStar());
        }
        
        star.twinklePhase += star.twinkleSpeed;
    });

    // Particles
    const pulsePhase = (elapsed % 4000) / 4000;
    const isPulseActive = pulsePhase < 0.2;
    const pulseRadius = pulsePhase * Math.max(this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        
        // Cursor Attraction (Force: distance-based, max displacement 15px)
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 120 && dist > 0) {
            const pull = (120 - dist) / 120;
            p.vx += (dx / dist) * pull * 0.5;
            p.vy += (dy / dist) * pull * 0.5;
        }

        // Breathing Pulse
        if (isPulseActive) {
            const cx = this.width / 2;
            const cy = this.height / 2;
            const pdx = p.x - cx;
            const pdy = p.y - cy;
            const pdist = Math.sqrt(pdx*pdx + pdy*pdy);
            
            // If the pulse wave is passing through this particle
            if (Math.abs(pdist - pulseRadius) < 50) {
                p.vx += (pdx / pdist) * 0.2;
                p.vy += (pdy / pdist) * 0.2;
            } else if (pdist < pulseRadius && pdist > pulseRadius - 150) {
               // Pull back slightly after wave passes
               p.vx -= (pdx / pdist) * 0.05;
               p.vy -= (pdy / pdist) * 0.05;
            }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95; // friction
        p.vy *= 0.95;
        p.life -= p.decay;
        if (p.life <= 0) {
            this.particles.splice(i, 1);
        }
    }
    
    // Lines and Globe Rotation
    if (this.activeScene === 3 || this.activeScene === 4) {
        // Auto rotate slightly
        this.globeRotY += 0.002;
        
        // Interactive rotate based on mouse variation from center
        const targetRotX = (this.mouse.y - this.height / 2) * 0.001;
        const targetRotYMove = (this.mouse.x - this.width / 2) * 0.00005;
        this.globeRotY += targetRotYMove;
        
        // Smoothly interpolate X
        this.globeRotX += (targetRotX - this.globeRotX) * 0.05;
        
        // Clamp X to avoid flipping over
        this.globeRotX = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.globeRotX));

        const cx = this.width / 2;
        const cy = this.height / 2;
        const R = Math.min(this.width, this.height) * 0.35; // Globe radius

        // Update nodes 3D positions
        this.nodes.forEach(n => {
            const p = this.latLonTo3D(n.lat, n.lon, R, this.globeRotX, this.globeRotY);
            n.x = cx + p.x;
            n.y = cy + p.y;
            n.z = p.z;
        });

        this.lines.forEach(l => {
            l.progress += l.speed;
            if (l.progress > 1) l.progress = 0;
        });
    }

    // Shooting Stars
    if (elapsed - this.lastShootingStar > this.nextShootingStarDelay) {
        this.shootingStars.push({
            x: Math.random() * this.width,
            y: 0,
            vx: 15 + Math.random() * 10,
            vy: 10 + Math.random() * 10,
            len: 50 + Math.random() * 50,
            life: 1.0,
            color: "#FF2B45"
        });
        this.lastShootingStar = elapsed;
        this.nextShootingStarDelay = Math.random() * 4000 + 8000;
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const ss = this.shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= 0.01;
        if (ss.life <= 0 || ss.x > this.width || ss.y > this.height) {
            this.shootingStars.splice(i, 1);
        }
    }
  }

  draw(time: number) {
    this.ctx.save();
    
    // Screen Shake
    if (this.explosionTriggered && this.particles.length > 0) {
        const maxLife = this.particles[0] ? this.particles[0].life : 0;
        const shakeIntensity = Math.max(0, (maxLife - 0.7) * 3); // Only shake during the first 30% of their life
        if (shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * 15 * shakeIntensity;
            const dy = (Math.random() - 0.5) * 15 * shakeIntensity;
            this.ctx.translate(dx, dy);
        }
    }

    // Clear
    this.ctx.fillStyle = "#060608";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Space Background (always active, but speed varies)
    this.drawSpace();
    
    this.drawEarth();

    // Draw Shooting Stars
    this.shootingStars.forEach(ss => {
        this.ctx.beginPath();
        this.ctx.moveTo(ss.x, ss.y);
        this.ctx.lineTo(ss.x - ss.vx * (ss.len/10), ss.y - ss.vy * (ss.len/10));
        this.ctx.strokeStyle = `rgba(255, 43, 69, ${ss.life})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    });

    // Scene 0: Map
    if (this.activeScene === 0 || (this.activeScene === 1 && this.particles.length > 0)) {
       // Draw Map fading out based on explosion
       const mapOpacity = this.activeScene === 0 ? 1 : Math.max(0, 1 - (this.particles.length ? (1 - this.particles[0].life)*3 : 1));
       if (mapOpacity > 0) {
           this.drawMap(mapOpacity);
       }
    }

    // Scene 1: Particles
    if (this.particles.length > 0) {
        this.drawParticles();
    }
    
    // Scene 3 & 4: Network
    if (this.activeScene === 3 || this.activeScene === 4) {
        this.drawNetwork();
    }
    
    this.ctx.restore();
  }
  
  drawEarth() {
      let earthOpacity = 1;
      if (this.scrollProgress > 0.5 && this.scrollProgress <= 3.5) {
          earthOpacity = Math.max(0, 1 - (this.scrollProgress - 0.5) * 2); 
      }
      if (this.scrollProgress > 3.5) {
          earthOpacity = Math.min(1, (this.scrollProgress - 3.5) * 2);
      }
      
      if (earthOpacity <= 0) return;
      
      const cx = this.width / 2;
      const offset = (this.scrollProgress < 2 ? this.scrollProgress : 0) * 200;
      const cy = this.height + 400 + offset; 
      
      const gradient = this.ctx.createRadialGradient(cx, cy, 300, cx, cy, 700);
      gradient.addColorStop(0, `rgba(4, 8, 20, ${earthOpacity})`);
      gradient.addColorStop(0.8, `rgba(15, 30, 60, ${earthOpacity * 0.8})`);
      gradient.addColorStop(1, `rgba(74, 158, 255, 0)`);
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 700, 0, Math.PI * 2);
      this.ctx.fill();

      // Atmospheric glow line
      this.ctx.strokeStyle = `rgba(142, 180, 255, ${earthOpacity * 0.4})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 500, 0, Math.PI * 2);
      this.ctx.stroke();
  }

  drawSpace() {
      const cx = this.width / 2;
      const cy = this.height / 2;
      
      // Nebula
      this.ctx.globalCompositeOperation = "screen";
      const radGrad = this.ctx.createRadialGradient(cx * 0.4, cy * 0.4, 0, cx * 0.4, cy * 0.4, this.width * 0.8);
      radGrad.addColorStop(0, "rgba(255, 43, 69, 0.08)");
      radGrad.addColorStop(0.5, "rgba(20, 10, 40, 0.04)");
      radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      this.ctx.fillStyle = radGrad;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.globalCompositeOperation = "source-over";

      // 3D Stars
      const fov = 200;
      this.stars.forEach(star => {
         if (star.z <= 0) return;
         
         const k = fov / star.z;
         const px = cx + star.x * k;
         const py = cy + star.y * k;
         
         if (px < 0 || px > this.width || py < 0 || py > this.height) return;

         const baseOpacity = Math.min(1, 1 - star.z / this.width);
         const twinkle = 1 - star.twinkleIntensity * Math.abs(Math.sin(star.twinklePhase));
         const opacity = Math.max(0, baseOpacity * twinkle);
         
         this.ctx.fillStyle = `rgba(${star.color === '#F0ECE4' ? '240,236,228' : '142,180,255'},${opacity})`;
         
         const size = Math.max(0.1, star.size * k);
         
         this.ctx.beginPath();
         
         const speed = this.activeScene === 2 ? 25 : (this.activeScene === 1 ? 5 : 0.5);
         if (speed > 2) {
             const prevZ = star.z + speed * 2;
             const prevK = fov / prevZ;
             const prevPx = cx + star.x * prevK;
             const prevPy = cy + star.y * prevK;
             
             this.ctx.moveTo(prevPx, prevPy);
             this.ctx.lineTo(px, py);
             this.ctx.lineWidth = size * 1.5;
             this.ctx.strokeStyle = this.ctx.fillStyle;
             this.ctx.stroke();
         } else {
             this.ctx.arc(px, py, size, 0, Math.PI * 2);
             this.ctx.fill();
         }
      });
  }

  drawParticles() {
      // Glow effect
      this.ctx.globalCompositeOperation = "screen";
      
      this.particles.forEach(p => {
          // Fade-out easing curve (quad) for smooth fade-out
          const easeLife = p.life * p.life;
          this.ctx.globalAlpha = easeLife;
          
          const speed = Math.hypot(p.vx, p.vy);
          const stretch = Math.max(1, speed * 0.8);
          
          // Draw trail
          if (speed > 1) {
              const tailGrad = this.ctx.createLinearGradient(p.x, p.y, p.x - p.vx * stretch, p.y - p.vy * stretch);
              tailGrad.addColorStop(0, p.color);
              // We simulate fading to transparent without explicitly parsing rgba by overriding globalAlpha slightly or ignoring it
              // Since globalAlpha affects everything and tailGrad is added, it will fade to black/transparent in screen mode
              tailGrad.addColorStop(1, '#000000');
              
              this.ctx.beginPath();
              this.ctx.moveTo(p.x, p.y);
              this.ctx.lineTo(p.x - p.vx * stretch, p.y - p.vy * stretch);
              this.ctx.strokeStyle = tailGrad;
              this.ctx.lineWidth = p.size * 0.8;
              this.ctx.lineCap = "round";
              this.ctx.stroke();
          }

          // Core particle
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fillStyle = p.color;
          this.ctx.fill();
          
          // Subtle glow for larger particles
          if (p.size > 2) {
              this.ctx.beginPath();
              this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
              this.ctx.fillStyle = p.color;
              this.ctx.globalAlpha = easeLife * 0.3;
              this.ctx.fill();
          }
      });
      
      this.ctx.globalAlpha = 1.0;
      this.ctx.globalCompositeOperation = "source-over";
  }

  drawMap(opacity: number) {
      if (!this.d3GeoModule || !this.tunisiaGeojson || !this.worldGeojson) return;

      this.ctx.save();
      const cx = this.width / 2;
      const cy = this.height / 2;
      
      // Calculate dynamic rotation
      const time = Date.now() / 1000;
      const rotY = (this.mouse.x - cx) * 0.05 + time * 5; // gentle spin
      const rotX = (this.mouse.y - cy) * 0.05;
      
      const R = Math.min(this.width, this.height) * 0.35; // Size of the pseudo-globe

      // Create an orthographic projection centered on Tunisia
      const projection = this.d3GeoModule.geoOrthographic()
          .scale(R * 1.2) // Standard globe scale, slightly enlarged
          .translate([cx, cy])
          .rotate([-9.5375 + rotY, -33.8869 + rotX]); // Negative lat to pitch correctly
          
      const pathGenerator = this.d3GeoModule.geoPath()
          .projection(projection)
          .context(this.ctx);

      // 1. Draw the globe atmosphere/glow beneath
      this.ctx.globalAlpha = opacity;
      const grad = this.ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.8);
      grad.addColorStop(0, "rgba(255, 43, 69, 0.15)"); // Red atmosphere
      grad.addColorStop(1, "rgba(6, 6, 8, 0)"); 
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. Base globe fill (ocean)
      const oceanGrad = this.ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.2);
      oceanGrad.addColorStop(0, `rgba(15, 2, 5, ${opacity * 0.9})`);
      oceanGrad.addColorStop(1, `rgba(5, 0, 0, ${opacity * 0.9})`);
      this.ctx.fillStyle = oceanGrad;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2);
      this.ctx.fill();

      // 3. Draw World Map (landmasses)
      this.ctx.beginPath();
      pathGenerator(this.worldGeojson);
      this.ctx.fillStyle = `rgba(30, 5, 10, ${opacity * 0.8})`;
      this.ctx.fill();
      this.ctx.strokeStyle = `rgba(255, 43, 69, ${opacity * 0.2})`;
      this.ctx.lineWidth = 0.5;
      this.ctx.stroke();

      // 4. Draw Tunisia Glowing
      this.ctx.beginPath();
      pathGenerator(this.tunisiaGeojson);
      
      // Core deep fill
      this.ctx.fillStyle = `rgba(255, 43, 69, ${opacity * 0.4})`;
      this.ctx.fill();

      this.ctx.shadowBlur = 30 + Math.sin(time * 4) * 10;
      this.ctx.shadowColor = "#FF2B45";
      
      this.ctx.strokeStyle = `rgba(255, 43, 69, ${opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.shadowBlur = 60;
      this.ctx.strokeStyle = `rgba(255, 200, 200, ${opacity * 0.8})`;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      this.ctx.shadowBlur = 0;

      // 5. Draw Energy Veins explicitly in 3D (emanating from Tunisia)
      // Tunisia is mapped around 9.53, 33.88
      // Let's create some veins spanning out from Tunisia to neighbors
      for (let i = 0; i < 15; i++) {
         const pulse = (Math.sin(time * 3 + i * 0.4) + 1) / 2;
         if (pulse < 0.1) continue;
         
         const startLat = 33.88 + (Math.random() - 0.5) * 5;
         const startLon = 9.53 + (Math.random() - 0.5) * 5;
         
         const endLat = startLat + (Math.random() - 0.5) * 20;
         const endLon = startLon + (Math.random() - 0.5) * 20;
         
         const p1 = projection([startLon, startLat]);
         const p2 = projection([endLon, endLat]);
         
         if (p1 && p2) {
             const dist = Math.hypot(p2[0]-p1[0], p2[1]-p1[1]);
             if (dist < R * 2) { // just to avoid wrapping front to back lines
                 const gradient = this.ctx.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
                 gradient.addColorStop(0, `rgba(255, 43, 69, ${opacity * pulse * 0.8})`);
                 gradient.addColorStop(1, `rgba(255, 43, 69, 0)`);
                 
                 this.ctx.beginPath();
                 this.ctx.moveTo(p1[0], p1[1]);
                 // curve it slightly
                 this.ctx.quadraticCurveTo(
                     (p1[0] + p2[0]) / 2 + (Math.random()-0.5)*20, 
                     (p1[1] + p2[1]) / 2 + (Math.random()-0.5)*20, 
                     p2[0], p2[1]
                 );
                 this.ctx.strokeStyle = gradient;
                 this.ctx.lineWidth = Math.random() * 1.5 + 0.5;
                 this.ctx.stroke();
             }
         }
      }
      
      // Central explosive glow on top
      this.ctx.beginPath();
      const pt = projection([9.5375, 33.8869]);
      if (pt) {
          const coreGrad = this.ctx.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], R * 0.4);
          coreGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.95})`);
          coreGrad.addColorStop(0.1, `rgba(255, 43, 69, ${opacity * 0.8})`);
          coreGrad.addColorStop(1, `rgba(255, 43, 69, 0)`);
          this.ctx.fillStyle = coreGrad;
          this.ctx.arc(pt[0], pt[1], R * 0.4, 0, Math.PI * 2);
          this.ctx.fill();
      }

      this.ctx.restore();
  }

  drawNetwork() {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const R = Math.min(this.width, this.height) * 0.35;
      
      // Draw Globe Base (Atmosphere)
      const grad = this.ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R);
      grad.addColorStop(0, "rgba(6, 6, 8, 0.95)");
      grad.addColorStop(1, "rgba(255, 43, 69, 0.2)");
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, R, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = "rgba(255, 43, 69, 0.4)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw Grid Lines (Lat/Lon) to give 3D sphere feel
      this.ctx.strokeStyle = "rgba(240, 236, 228, 0.05)";
      this.ctx.lineWidth = 0.5;
      
      // World Map
      if (this.d3GeoModule && this.worldGeojson) {
         // Matching manual rotation math to d3 projection
         const rotYdeg = this.globeRotY * (180 / Math.PI);
         const rotXdeg = this.globeRotX * (180 / Math.PI);
         
         // In standard 3D to d3 mapping:
         // Our initial formula puts longitude 0 at theta=180.
         // Let's just map it to an orthographic projection centered.
         const projection = this.d3GeoModule.geoOrthographic()
            .scale(R)
            .translate([cx, cy])
            // Standard inverse rotation to match our scene
            .rotate([-rotYdeg, rotXdeg, 0]);

         const pathGenerator = this.d3GeoModule.geoPath()
            .projection(projection)
            .context(this.ctx);

         this.ctx.beginPath();
         pathGenerator(this.worldGeojson);
         
         // Fill landmasses
         this.ctx.fillStyle = "rgba(20, 20, 25, 0.8)";
         this.ctx.fill();
         this.ctx.strokeStyle = "rgba(255, 43, 69, 0.2)";
         this.ctx.lineWidth = 1;
         this.ctx.stroke();
         
         // Also highlight Tunisia separately if we can
         if (this.tunisiaGeojson) {
             this.ctx.beginPath();
             pathGenerator(this.tunisiaGeojson);
             
             this.ctx.fillStyle = "rgba(255, 43, 69, 0.15)";
             this.ctx.fill();
             
             this.ctx.shadowBlur = 15;
             this.ctx.shadowColor = "#FF2B45";
             this.ctx.strokeStyle = "rgba(255, 43, 69, 0.8)";
             this.ctx.lineWidth = 1;
             this.ctx.stroke();
             this.ctx.shadowBlur = 0;
         }
      } else {
          // Latitudes fallback
          for (let lat = -75; lat <= 75; lat += 15) {
              this.ctx.beginPath();
              for (let lon = -180; lon <= 180; lon += 5) {
                  const p = this.latLonTo3D(lat, lon, R, this.globeRotX, this.globeRotY);
                  if (p.z > -R*0.1) {
                      this.ctx.lineTo(cx + p.x, cy + p.y);
                  } else {
                      this.ctx.moveTo(cx + p.x, cy + p.y);
                  }
              }
              this.ctx.stroke();
          }
    
          // Longitudes fallback
          for (let lon = -180; lon < 180; lon += 15) {
              this.ctx.beginPath();
              let started = false;
              for (let lat = -90; lat <= 90; lat += 5) {
                  const p = this.latLonTo3D(lat, lon, R, this.globeRotX, this.globeRotY);
                  if (p.z > -R*0.1) {
                      if (!started) {
                          this.ctx.moveTo(cx + p.x, cy + p.y);
                          started = true;
                      } else {
                          this.ctx.lineTo(cx + p.x, cy + p.y);
                      }
                  } else {
                      started = false;
                  }
              }
              this.ctx.stroke();
          }
      }
      
      // Draw connection lines
      this.ctx.lineWidth = 1;
      this.lines.forEach(l => {
         const fromP = { x: l.from.x - cx, y: l.from.y - cy, z: l.from.z };
         const toP = { x: l.to.x - cx, y: l.to.y - cy, z: l.to.z };
         
         const midX = (fromP.x + toP.x) / 2;
         const midY = (fromP.y + toP.y) / 2;
         const midZ = (fromP.z + toP.z) / 2;

         const mag = Math.sqrt(midX*midX + midY*midY + midZ*midZ);
         let cpX = 0, cpY = 0, cpZ = 0;
         if (mag > 0) {
             const curveHeight = R * 0.4;
             cpX = (midX / mag) * (R + curveHeight);
             cpY = (midY / mag) * (R + curveHeight);
             cpZ = (midZ / mag) * (R + curveHeight);
         }
         
         if (fromP.z < 0 && toP.z < 0 && cpZ < 0) return;

         const projCpX = cx + cpX;
         const projCpY = cy + cpY;
         
         this.ctx.strokeStyle = "rgba(255, 43, 69, 0.15)";
         this.ctx.beginPath();
         this.ctx.moveTo(l.from.x, l.from.y);
         this.ctx.quadraticCurveTo(projCpX, projCpY, l.to.x, l.to.y);
         this.ctx.stroke();
         
         if (this.activeScene === 3) {
             const t = l.progress;
             const invT = 1 - t;
             
             const px = invT*invT*fromP.x + 2*invT*t*cpX + t*t*toP.x;
             const py = invT*invT*fromP.y + 2*invT*t*cpY + t*t*toP.y;
             const pz = invT*invT*fromP.z + 2*invT*t*cpZ + t*t*toP.z;
             
             if (pz > -R * 0.2) {
                 const op = Math.min(1, Math.max(0, (pz + R*0.2) / (R*0.2)));
                 this.ctx.fillStyle = `rgba(240, 236, 228, ${op})`;
                 this.ctx.shadowBlur = 10;
                 this.ctx.shadowColor = "#FFF";
                 this.ctx.beginPath();
                 const dotScale = 1 + (pz / R);
                 this.ctx.arc(cx + px, cy + py, 2 * Math.max(0.1, dotScale), 0, Math.PI * 2);
                 this.ctx.fill();
                 this.ctx.shadowBlur = 0;
             }
         }
      });
      
      // Draw web lines in scene 4 for constellation effect
      if (this.activeScene === 4) {
          for(let i=0; i<this.nodes.length; i++) {
             if (this.nodes[i].z < 0) continue;
             for(let j=i+1; j<this.nodes.length; j++) {
                 if (this.nodes[j].z < 0) continue;
                 const dx = this.nodes[i].x - this.nodes[j].x;
                 const dy = this.nodes[i].y - this.nodes[j].y;
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 if (dist < R * 1.5) {
                     this.ctx.strokeStyle = `rgba(255,43,69,${0.1 * (1 - dist/(R*1.5))})`;
                     this.ctx.beginPath();
                     this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                     this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                     this.ctx.stroke();
                 }
             }
          }
      }

      // Draw nodes
      this.nodes.forEach(n => {
          if (n.z < -R * 0.1) return;
          
          const zScale = 1 + (n.z / R);
          const op = Math.min(1, Math.max(0, (n.z + R*0.1) / (R*0.1)));

          const dx = this.mouse.x - n.x;
          const dy = this.mouse.y - n.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const isHover = dist < 60 && (this.activeScene === 3 || this.activeScene === 4);

          if (n.isCenter) {
              this.ctx.fillStyle = `rgba(255, 43, 69, ${op})`;
              this.ctx.shadowBlur = 20;
              this.ctx.shadowColor = "#FF2B45";
              const size = (4 + Math.sin(Date.now() / 300) * 2) * Math.max(0.5, zScale);
              this.ctx.beginPath();
              this.ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
              this.ctx.fill();
              
              this.ctx.strokeStyle = `rgba(255,43,69,${Math.max(0, 0.5 - (size-2)/6) * op})`;
              this.ctx.beginPath();
              this.ctx.arc(n.x, n.y, size * 3, 0, Math.PI*2);
              this.ctx.stroke();
          } else if (this.activeScene === 4 || this.activeScene === 3) {
              this.ctx.fillStyle = isHover ? `rgba(240, 236, 228, ${op})` : `rgba(255,43,69,${0.8 * op})`;
              if (isHover) {
                  this.ctx.shadowBlur = 20;
                  this.ctx.shadowColor = "#F0ECE4";
              }
              this.ctx.beginPath();
              this.ctx.arc(n.x, n.y, (isHover ? 4 : 3) * Math.max(0.5, zScale), 0, Math.PI * 2);
              this.ctx.fill();
              
              if (this.activeScene === 4 || isHover) {
                  this.ctx.fillStyle = isHover ? `rgba(255, 255, 255, ${op})` : `rgba(240,236,228,${0.7 * op})`;
                  this.ctx.font = isHover ? "bold 12px Outfit, sans-serif" : "11px Outfit, sans-serif";
                  this.ctx.textAlign = "center";
                  this.ctx.fillText(n.label, n.x, n.y + (isHover ? 20 : 15));
              }

              if (isHover) {
                  this.ctx.strokeStyle = `rgba(240,236,228,${0.3 * op})`;
                  this.ctx.lineWidth = 1;
                  this.ctx.beginPath();
                  this.ctx.moveTo(n.x, n.y);
                  this.ctx.lineTo(this.mouse.x, this.mouse.y);
                  this.ctx.stroke();
              }
          }
          this.ctx.shadowBlur = 0;
      });
  }

  destroy() {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("mousemove", this.handleMouseMove);
    cancelAnimationFrame(this.animationFrameId);
  }
}

interface Star {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    twinklePhase: number;
    twinkleSpeed: number;
    twinkleIntensity: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    decay: number;
    color: string;
}

interface NetworkNode {
    id: string;
    lat: number;
    lon: number;
    x: number;
    y: number;
    z: number;
    label: string;
    isCenter: boolean;
}

interface NetworkLine {
    from: NetworkNode;
    to: NetworkNode;
    progress: number;
    speed: number;
}

interface ShootingStar {
    x: number;
    y: number;
    vx: number;
    vy: number;
    len: number;
    life: number;
    color: string;
}

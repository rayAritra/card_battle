"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HeroWaterRipples.module.css";

interface HeroWaterRipplesProps {
  className?: string;
  imageSrc?: string;
}

export function HeroWaterRipples({
  className,
  imageSrc = "/images/hero-glass-rings.png",
}: HeroWaterRipplesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const containerEl: HTMLDivElement = container;
    const canvasEl: HTMLCanvasElement = canvas;

    let cleanup = () => {};

    try {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // ── WebGL Context ────────────────────────────────────────────────────────
      let rawGl: WebGLRenderingContext | null = null;
      if (!prefersReducedMotion) {
        rawGl =
          canvasEl.getContext("webgl", {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
          }) ||
          (canvasEl.getContext(
            "experimental-webgl",
          ) as WebGLRenderingContext | null);
      }

      if (!rawGl) {
        setWebGlSupported(false);
        return;
      }
      const gl: WebGLRenderingContext = rawGl;

      // ── Shaders ──────────────────────────────────────────────────────────────
      const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

      // 2-channel state shader:
      // .r = height at t, .g = height at t-1.
      // Reads ONLY from u_state (TEXTURE0). Writes to destination FBO.
      // ZERO feedback loop between textures!
      const simFsSource = `
      precision mediump float;
      uniform sampler2D u_state;
      uniform vec2 u_delta;
      uniform vec2 u_dropPos;
      uniform float u_dropRadius;
      uniform float u_dropStrength;
      uniform float u_damping;
      varying vec2 v_uv;

      void main() {
        vec4 center = texture2D(u_state, v_uv);
        float current = center.r * 2.0 - 1.0;
        float prev = center.g * 2.0 - 1.0;

        // Direct 4 neighbors
        float n = texture2D(u_state, v_uv + vec2(0.0, u_delta.y)).r * 2.0 - 1.0;
        float s = texture2D(u_state, v_uv - vec2(0.0, u_delta.y)).r * 2.0 - 1.0;
        float e = texture2D(u_state, v_uv + vec2(u_delta.x, 0.0)).r * 2.0 - 1.0;
        float w = texture2D(u_state, v_uv - vec2(u_delta.x, 0.0)).r * 2.0 - 1.0;

        // Diagonal 4 neighbors for organic isotropic circular waves
        float ne = texture2D(u_state, v_uv + vec2(u_delta.x, u_delta.y)).r * 2.0 - 1.0;
        float nw = texture2D(u_state, v_uv + vec2(-u_delta.x, u_delta.y)).r * 2.0 - 1.0;
        float se = texture2D(u_state, v_uv + vec2(u_delta.x, -u_delta.y)).r * 2.0 - 1.0;
        float sw = texture2D(u_state, v_uv + vec2(-u_delta.x, -u_delta.y)).r * 2.0 - 1.0;

        float laplacian = (n + s + e + w) * 0.7071 + (ne + nw + se + sw) * 0.2929 - current * 4.0;

        // Smooth liquid wave propagation speed (0.24 factor)
        float nextVal = current * 2.0 - prev + 0.24 * laplacian;
        nextVal *= u_damping;

        // Mouse disturbance
        if (u_dropStrength > 0.0001) {
          float d = distance(v_uv, u_dropPos);
          if (d < u_dropRadius) {
            float factor = cos(d / u_dropRadius * 1.5707963);
            nextVal += factor * factor * u_dropStrength;
          }
        }

        // Boundary sponge layer: absorbs outgoing waves near edges so they never bounce back
        vec2 edgeDist = min(v_uv, 1.0 - v_uv);
        float edgeDamp = clamp(min(edgeDist.x, edgeDist.y) * 16.0, 0.0, 1.0);
        nextVal *= edgeDamp;

        nextVal = clamp(nextVal, -1.0, 1.0);

        // Store new height in .r, current height in .g for next frame
        gl_FragColor = vec4(nextVal * 0.5 + 0.5, current * 0.5 + 0.5, 0.0, 1.0);
      }
    `;

      // Render shader: organic optical refraction and 3D wave relief with highlights and liquid shadows
      const renderFsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform sampler2D u_ripple;
      uniform vec2 u_delta;
      uniform float u_refraction;
      uniform vec2 u_imgScale;
      uniform vec2 u_imgOffset;
      varying vec2 v_uv;

      void main() {
        // Sample height neighbors
        float hL = texture2D(u_ripple, v_uv - vec2(u_delta.x, 0.0)).r * 2.0 - 1.0;
        float hR = texture2D(u_ripple, v_uv + vec2(u_delta.x, 0.0)).r * 2.0 - 1.0;
        float hD = texture2D(u_ripple, v_uv - vec2(0.0, u_delta.y)).r * 2.0 - 1.0;
        float hU = texture2D(u_ripple, v_uv + vec2(0.0, u_delta.y)).r * 2.0 - 1.0;

        // Wave slope / gradient
        vec2 normal = vec2(hR - hL, hU - hD);
        float waveSlope = length(normal);

        // Convert WebGL Y to top-down DOM UV
        vec2 domUv = vec2(v_uv.x, 1.0 - v_uv.y);
        vec2 imgUv = (domUv - u_imgOffset) * u_imgScale;

        // Fluid refraction displacement: displaces image coordinates along wave gradient
        vec2 distortedUv = clamp(imgUv - vec2(normal.x, -normal.y) * u_refraction, 0.0, 1.0);
        vec4 baseColor = texture2D(u_image, distortedUv);

        // 3D Directional water surface relief (subtle, ~60% reduced):
        // Wave slope facing the light gets brightened, slope facing away gets shaded
        vec2 lightDir2D = normalize(vec2(-0.55, 0.75));
        float diffuse = dot(normal, lightDir2D);

        // Caustic crest line along wave peaks
        float crest = clamp(waveSlope * 4.0, 0.0, 1.0);

        // Specular glint on wave crests
        vec3 surfaceNorm = normalize(vec3(normal * 12.0, 1.0));
        vec3 light3D = normalize(vec3(-0.35, 0.55, 0.75));
        float spec = pow(max(0.0, dot(surfaceNorm, light3D)), 24.0) * 0.20;

        // Modulate base image with wave relief (delicate highlight and soft liquid shadow)
        vec3 shaded = baseColor.rgb * (1.0 + diffuse * 0.40);

        // Add subtle caustic sheen and specular glint
        float highlight = crest * 0.05 + spec;
        vec3 finalRgb = clamp(shaded + vec3(highlight, highlight, highlight), 0.0, 1.0);

        gl_FragColor = vec4(finalRgb, baseColor.a);
      }
    `;

      function createShader(
        glCtx: WebGLRenderingContext,
        type: number,
        source: string,
      ) {
        const shader = glCtx.createShader(type);
        if (!shader) return null;
        glCtx.shaderSource(shader, source);
        glCtx.compileShader(shader);
        if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
          glCtx.deleteShader(shader);
          return null;
        }
        return shader;
      }

      function createProgram(
        glCtx: WebGLRenderingContext,
        vertexS: WebGLShader,
        fragmentS: WebGLShader,
      ) {
        const prog = glCtx.createProgram();
        if (!prog) return null;
        glCtx.attachShader(prog, vertexS);
        glCtx.attachShader(prog, fragmentS);
        glCtx.linkProgram(prog);
        if (!glCtx.getProgramParameter(prog, glCtx.LINK_STATUS)) {
          glCtx.deleteProgram(prog);
          return null;
        }
        return prog;
      }

      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const simFs = createShader(gl, gl.FRAGMENT_SHADER, simFsSource);
      const renderFs = createShader(gl, gl.FRAGMENT_SHADER, renderFsSource);

      if (!vs || !simFs || !renderFs) {
        setWebGlSupported(false);
        return;
      }

      const activeSimProg = createProgram(gl, vs, simFs);
      const activeRenderProg = createProgram(gl, vs, renderFs);

      if (!activeSimProg || !activeRenderProg) {
        setWebGlSupported(false);
        return;
      }

      const quadBuffer = gl.createBuffer();
      if (!quadBuffer) {
        setWebGlSupported(false);
        return;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      // ── Simulation Ping-Pong Buffers ─────────────────────────────────────────
      const SIM_RES = 256;
      function createSimTexture(glCtx: WebGLRenderingContext) {
        const tex = glCtx.createTexture();
        if (!tex) return null;
        glCtx.bindTexture(glCtx.TEXTURE_2D, tex);
        glCtx.texParameteri(
          glCtx.TEXTURE_2D,
          glCtx.TEXTURE_WRAP_S,
          glCtx.CLAMP_TO_EDGE,
        );
        glCtx.texParameteri(
          glCtx.TEXTURE_2D,
          glCtx.TEXTURE_WRAP_T,
          glCtx.CLAMP_TO_EDGE,
        );
        glCtx.texParameteri(
          glCtx.TEXTURE_2D,
          glCtx.TEXTURE_MIN_FILTER,
          glCtx.LINEAR,
        );
        glCtx.texParameteri(
          glCtx.TEXTURE_2D,
          glCtx.TEXTURE_MAG_FILTER,
          glCtx.LINEAR,
        );
        const initData = new Uint8Array(SIM_RES * SIM_RES * 4);
        initData.fill(128);
        glCtx.texImage2D(
          glCtx.TEXTURE_2D,
          0,
          glCtx.RGBA,
          SIM_RES,
          SIM_RES,
          0,
          glCtx.RGBA,
          glCtx.UNSIGNED_BYTE,
          initData,
        );
        return tex;
      }

      const texA = createSimTexture(gl);
      const texB = createSimTexture(gl);
      const fboA = gl.createFramebuffer();
      const fboB = gl.createFramebuffer();

      if (!texA || !texB || !fboA || !fboB) {
        setWebGlSupported(false);
        return;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texA,
        0,
      );

      gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texB,
        0,
      );

      // State ping-pong: read from readTex, write to writeFbo (which contains writeTex).
      // ZERO feedback loop!
      let readTex: WebGLTexture = texA;
      let writeFbo: WebGLFramebuffer = fboB;
      let writeTex: WebGLTexture = texB;

      function swapBuffers() {
        const tempTex = readTex;
        readTex = writeTex;
        writeTex = tempTex;

        writeFbo = writeTex === texA ? fboA : fboB;
      }

      // ── Continuous Fluid Disturbance ─────────────────────────────────────────
      const pendingDrops: Array<{
        x: number;
        y: number;
        radius: number;
        strength: number;
      }> = [];

      let animationFrameId: number | null = null;
      let isRunning = false;
      let idleCounter = 0;

      function wakeAnimation() {
        idleCounter = 0;
        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(tick);
        }
      }

      function addDrop(x: number, y: number, radius = 0.02, strength = 0.2) {
        pendingDrops.push({ x, y, radius, strength });
        wakeAnimation();
      }

      let lastPointerX = -1;
      let lastPointerY = -1;
      let lastPointerTime = 0;

      function handlePointerMove(e: PointerEvent | MouseEvent) {
        if (!containerEl) return;
        const rect = containerEl.getBoundingClientRect();

        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          lastPointerX = -1;
          lastPointerY = -1;
          return;
        }

        const normX = (e.clientX - rect.left) / rect.width;
        const normY = (e.clientY - rect.top) / rect.height;

        const now = performance.now();
        const dt = Math.max(16, now - lastPointerTime);
        const dx = normX - lastPointerX;
        const dy = normY - lastPointerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const simY = 1.0 - normY;

        if (lastPointerX >= 0) {
          if (dist > 0.0005) {
            const speed = dist / (dt / 1000);
            const strength = Math.min(
              0.36,
              Math.max(0.16, 0.16 + speed * 0.12),
            );
            const radius = Math.min(
              0.034,
              Math.max(0.017, 0.017 + speed * 0.007),
            );

            // Interpolate along path so fluid wake follows mouse smoothly
            const steps = Math.min(3, Math.max(1, Math.floor(dist * 50)));
            const stepStrength = strength * (0.8 / Math.sqrt(steps));
            const prevSimY = 1.0 - lastPointerY;
            for (let s = 1; s <= steps; s++) {
              const t = s / steps;
              const interpX = lastPointerX + dx * t;
              const interpY = prevSimY + (simY - prevSimY) * t;
              addDrop(interpX, interpY, radius, stepStrength);
            }
          }
        } else {
          // Pointer just entered the hero card
          addDrop(normX, simY, 0.02, 0.2);
        }

        lastPointerX = normX;
        lastPointerY = normY;
        lastPointerTime = now;
      }

      function handlePointerDown(e: PointerEvent | MouseEvent) {
        if (!containerEl) return;
        const rect = containerEl.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const normX = (e.clientX - rect.left) / rect.width;
          const normY = (e.clientY - rect.top) / rect.height;
          addDrop(normX, 1.0 - normY, 0.032, 0.35);
        }
      }

      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointerdown", handlePointerDown, {
        passive: true,
      });

      const resizeObserver = new ResizeObserver(() => {
        wakeAnimation();
      });
      resizeObserver.observe(containerEl);

      // ── Image State for Rendering ────────────────────────────────────────────
      let imageLoaded = false;
      let imgNaturalW = 1560;
      let imgNaturalH = 1184;

      function tick() {
        if (!gl || !activeSimProg || !activeRenderProg || !quadBuffer) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const displayW = Math.floor(containerEl.clientWidth * dpr);
        const displayH = Math.floor(containerEl.clientHeight * dpr);

        if (canvasEl.width !== displayW || canvasEl.height !== displayH) {
          canvasEl.width = displayW;
          canvasEl.height = displayH;
        }

        // ── Step 1: Simulation pass ────────────────────────────────────────────
        gl.useProgram(activeSimProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        const aPosSim = gl.getAttribLocation(activeSimProg, "a_position");
        gl.enableVertexAttribArray(aPosSim);
        gl.vertexAttribPointer(aPosSim, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(
          gl.getUniformLocation(activeSimProg, "u_delta"),
          1.0 / SIM_RES,
          1.0 / SIM_RES,
        );
        // Strong damping keeps the wave confined near the cursor and fades it
        // out within about a second, instead of letting it propagate as an
        // expanding ring across the whole background.
        gl.uniform1f(gl.getUniformLocation(activeSimProg, "u_damping"), 0.88);

        const dropsToProcess = pendingDrops.splice(0, 4);
        if (dropsToProcess.length === 0) {
          dropsToProcess.push({ x: 0, y: 0, radius: 0, strength: 0 });
        }

        for (const drop of dropsToProcess) {
          gl.uniform2f(
            gl.getUniformLocation(activeSimProg, "u_dropPos"),
            drop.x,
            drop.y,
          );
          gl.uniform1f(
            gl.getUniformLocation(activeSimProg, "u_dropRadius"),
            drop.radius,
          );
          gl.uniform1f(
            gl.getUniformLocation(activeSimProg, "u_dropStrength"),
            drop.strength,
          );

          // Read ONLY from readTex (zero feedback loop)
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, readTex);
          gl.uniform1i(gl.getUniformLocation(activeSimProg, "u_state"), 0);

          // Write to writeFbo (which contains writeTex, distinct from readTex)
          gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
          gl.viewport(0, 0, SIM_RES, SIM_RES);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          swapBuffers();
        }

        // ── Step 2: Render pass to screen ──────────────────────────────────────
        if (imageLoaded) {
          gl.useProgram(activeRenderProg);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvasEl.width, canvasEl.height);

          const aPosRender = gl.getAttribLocation(
            activeRenderProg,
            "a_position",
          );
          gl.enableVertexAttribArray(aPosRender);
          gl.vertexAttribPointer(aPosRender, 2, gl.FLOAT, false, 0, 0);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, imageTexture);
          gl.uniform1i(gl.getUniformLocation(activeRenderProg, "u_image"), 0);

          // Read the latest simulation state from readTex
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, readTex);
          gl.uniform1i(gl.getUniformLocation(activeRenderProg, "u_ripple"), 1);

          gl.uniform2f(
            gl.getUniformLocation(activeRenderProg, "u_delta"),
            1.0 / SIM_RES,
            1.0 / SIM_RES,
          );
          gl.uniform1f(
            gl.getUniformLocation(activeRenderProg, "u_refraction"),
            0.05,
          );

          const cW = containerEl.clientWidth || 1000;
          const cH = containerEl.clientHeight || 700;
          const imgAspect = imgNaturalW / imgNaturalH;
          const containerAspect = cW / cH;

          // Cover the entire hero card while keeping bangles centered
          let scaleX = 1.0;
          let scaleY = 1.0;
          let offsetX = 0.0;
          let offsetY = 0.0;

          if (containerAspect > imgAspect) {
            const drawnH = cW / imgAspect;
            scaleX = 1.0;
            scaleY = cH / drawnH;
            offsetX = 0.0;
            // Vertically center the image in the hero card
            offsetY = (cH - drawnH) / (2.0 * cH);
          } else {
            const drawnW = cH * imgAspect;
            scaleX = cW / drawnW;
            scaleY = 1.0;
            // Horizontally center the image in the hero card
            offsetX = (cW - drawnW) / (2.0 * cW);
            offsetY = 0.0;
          }

          gl.uniform2f(
            gl.getUniformLocation(activeRenderProg, "u_imgScale"),
            scaleX,
            scaleY,
          );
          gl.uniform2f(
            gl.getUniformLocation(activeRenderProg, "u_imgOffset"),
            offsetX,
            offsetY,
          );

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        if (pendingDrops.length === 0) {
          idleCounter++;
          // Keep simulating past the last drop so the wave field has time to
          // damp down to a flat surface before the loop halts — stopping too
          // early freezes a visibly distorted (non-flat) ripple in place.
          if (idleCounter > 90) {
            isRunning = false;
            return;
          }
        } else {
          idleCounter = 0;
        }

        animationFrameId = requestAnimationFrame(tick);
      }

      // ── Load Hero Image Texture ──────────────────────────────────────────────
      const imageTexture = gl.createTexture();
      const initialTimers: ReturnType<typeof setTimeout>[] = [];

      if (imageTexture) {
        const img = new Image();
        const onImageLoaded = () => {
          if (!gl || imageLoaded) return;
          imgNaturalW = img.naturalWidth || 1560;
          imgNaturalH = img.naturalHeight || 1184;

          gl.bindTexture(gl.TEXTURE_2D, imageTexture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img,
          );
          imageLoaded = true;
          setImageReady(true);
          wakeAnimation();
        };

        img.onload = onImageLoaded;
        img.onerror = () => {
          console.warn(
            "Failed to load hero image texture for WebGL; falling back to CSS",
          );
          setWebGlSupported(false);
        };
        img.src = imageSrc;
        if (img.complete && img.naturalWidth > 0) {
          onImageLoaded();
        }
      } else {
        setWebGlSupported(false);
      }

      wakeAnimation();

      cleanup = () => {
        initialTimers.forEach((t) => clearTimeout(t));
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerdown", handlePointerDown);
        resizeObserver.disconnect();
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        if (gl) {
          gl.deleteBuffer(quadBuffer);
          gl.deleteTexture(texA);
          gl.deleteTexture(texB);
          if (imageTexture) gl.deleteTexture(imageTexture);
          gl.deleteFramebuffer(fboA);
          gl.deleteFramebuffer(fboB);
          gl.deleteProgram(activeSimProg);
          gl.deleteProgram(activeRenderProg);
          gl.deleteShader(vs);
          gl.deleteShader(simFs);
          gl.deleteShader(renderFs);
        }
      };
    } catch (err) {
      console.warn("HeroWaterRipples WebGL initialization error:", err);
      setWebGlSupported(false);
    }

    return () => {
      cleanup();
    };
  }, [imageSrc]);

  return (
    <div
      ref={containerRef}
      className={`${styles.rippleContainer} ${isRevealed ? styles.revealed : ""} ${className || ""}`}
      aria-hidden="true"
    >
      {/* WebGL Canvas for pure fluid wave refraction */}
      {webGlSupported && (
        <canvas ref={canvasRef} className={styles.rippleCanvas} />
      )}

      {/* Fallback image (covers entire hero card with centered bangles) */}
      <div
        className={`${styles.fallbackImg} ${webGlSupported && imageReady ? styles.fallbackHidden : ""}`}
        style={{ backgroundImage: `url("${imageSrc}")` }}
      />
    </div>
  );
}

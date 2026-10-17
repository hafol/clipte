# DESIGN.md

DESIGN.md: "Echoes of the Abyss" - Awwwards SOTY Contender

1. Project Vision & Aesthetic

Concept: A journey through an abstract, fluid-like digital abyss. The experience shifts from structural rigidity to chaotic, organic flow based on user scroll velocity and cursor proximity.Signature Moment: As the user scrolls past the hero section, a seemingly solid central geometric monolith shatters into 100,000 fluid particles, which then merge into a single morphing Cone-Marched organic shape (SDF Blob), reacting to the cursor's velocity.Color Palette:

Background: Deep Void #040406



Primary Accents: Ethereal Cyan #00F0FF, Magenta #FF003C

Lighting: Volumetric, high-contrast Rim Lighting implemented via TSL dot products.Typography: Modernist Grotesk (e.g., 'Inter' or 'Clash Display') blended in 3D space with DOM HTML overlays using @react-three/drei Html component.

2. Technical Architecture

Renderer: Three.js WebGPU (r171+) via React Three Fiber.Core Scene Components:

App.tsx: Global Lenis smooth scroll provider, GSAP context setup.

WebGLCanvas.tsx: R3F Canvas configured for WebGPU.

Monolith.tsx: The primary instanced particle system.

SDFBlob.tsx: The Raymarched entity using Cone Marching optimization.

3. Shader Logic & TSL (Three Shading Language) Specifications

3.1 The Particle Shatter (Compute Shader)

Data: 100,000 particles.

Logic: Use a WebGPU Compute Shader via TSL to manage particle positions and velocities.

Algorithm: Implement curl noise (three/tsl noise nodes) combined with a repulsor field driven by normalized mouse coordinates.

Optimization: ZERO JavaScript execution per frame (useFrame) for particle positions. All updates must happen on the GPU.

3.2 The Morphing Blob (SDF Cone Marching)

Geometry: A full-screen Quad (or a large scaled Plane oriented to camera).

Material: Custom TSL node material implementing Cone Marching logic.

SDF Operations: Use smin (smooth minimum) to blend a sphere SDF and a distorted box fold SDF.

Distortion: Apply time-based fractal brownian motion (fBM) to the SDF domain to create an organic, pulsating surface.

Shading: Implement custom PBR lighting using the normal derived from the SDF gradient (finite differences).

4. Performance & Memory Budget

Draw Calls: Strict limit of < 50 draw calls. Use InstancedMesh for any background floating debris.

Memory Disposal: Every React component containing geometries/materials MUST return a cleanup function calling .dispose() on all associated WebGL resources. Validate that texture maps (normal, roughness) are detached.

Event Listeners: Mouse interactions must NOT use default continuous raycasting. Use a spatial grid or throttle to 30Hz.

5. Interaction & Animation Narrative (GSAP)

Scroll Phase 0-25%: Monolith is solid. Camera slowly pushes in.

Scroll Phase 25-50%: Scroll velocity is mapped to a TSL uniform (uShatterIntensity). The monolith dissolves into particles via Compute Shader displacement.

Scroll Phase 50-100%: Particles fade; the SDF Blob emerges from the void. Post-processing Bloom intensity pulses in sync with scroll momentum.

6. Post-Processing (WebGPU Native)

Implement a minimal chain to conserve GPU memory:

Multi-sample Anti-Aliasing (MSAA).

TSL-based Gaussian Bloom (Threshold: 0.8, Strength: 1.5).

Subtle Chromatic Aberration near screen edges based on cursor distance from center.

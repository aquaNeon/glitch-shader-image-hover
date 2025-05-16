  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("canvas_full");
    if (!container) return console.warn("No container found");

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -window.innerWidth / 2, window.innerWidth / 2,
      window.innerHeight / 2, -window.innerHeight / 2,
      -1000, 1000
    );
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const uniforms = {
      uTexture: { value: null },
      uTime: { value: 0 },
      uProgress: { value: 1 }
    };

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uProgress;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = rand(i);
      float b = rand(i + vec2(1.0, 0.0));
      float c = rand(i + vec2(0.0, 1.0));
      float d = rand(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) +
             (c - a) * u.y * (1.0 - u.x) +
             (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);
      vec2 toCenter = uv - center;

      // Chromatic aberration (always on)
      float chromaAmount = 0.015 * uProgress;
      vec2 rOffset = toCenter * chromaAmount;
      vec2 bOffset = -toCenter * chromaAmount;

      vec4 r = texture2D(uTexture, uv + rOffset);
      vec4 g = texture2D(uTexture, uv);
      vec4 b = texture2D(uTexture, uv + bOffset);

      vec4 color = vec4(r.r, g.g, b.b, 1.0);

      // Glitch bar
      float bar = step(0.93, rand(vec2(uTime * 0.2, floor(uv.y * 40.0)))) * 0.1;
      color.rgb += bar;

      // Pixel-spanning block distortion (added back stronger)
      float blockSize = 0.01;
      float glitchFreq = rand(floor(vec2(uv.y * 20.0, uTime * 2.0)));
      float pixelGlitch = step(0.94, glitchFreq);
      float offsetX = pixelGlitch * 0.1 * rand(vec2(uv.y * 10.0, uTime));
      vec2 pixelSpanOffset = vec2(offsetX, 0.0);
      vec4 spanColor = texture2D(uTexture, uv + pixelSpanOffset);
      color.rgb = mix(color.rgb, spanColor.rgb, pixelGlitch);

      // Grungy noise
      float n = noise(uv * 10.0 + uTime * 0.5);
      color.rgb += (n - 0.5) * 0.1 * uProgress;

      // Scanline flicker
      float scanline = 0.015 * sin(uv.y * 300.0 + uTime * 80.0);
      color.rgb += scanline * uProgress;

      gl_FragColor = color;
    }
  `
});

    
// const material6 = new THREE.ShaderMaterial({
//   uniforms,
//   transparent: true,
//   vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   fragmentShader: `
//     varying vec2 vUv;
//     uniform sampler2D uTexture;
//     uniform float uTime;
//     uniform float uProgress;

//     float rand(vec2 co) {
//       return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
//     }

//     float noise(vec2 p){
//       vec2 i = floor(p);
//       vec2 f = fract(p);
//       float a = rand(i);
//       float b = rand(i + vec2(1.0, 0.0));
//       float c = rand(i + vec2(0.0, 1.0));
//       float d = rand(i + vec2(1.0, 1.0));
//       vec2 u = f * f * (3.0 - 2.0 * f);
//       return mix(a, b, u.x) +
//              (c - a) * u.y * (1.0 - u.x) +
//              (d - b) * u.x * u.y;
//     }

//     void main() {
//       vec2 uv = vUv;
//       vec2 center = vec2(0.5);
//       vec2 toCenter = uv - center;

//       // Glitch strength randomness
//       float glitchStrength = step(0.9, rand(vec2(uTime * 0.5, uv.y * 20.0)));
//       float glitchAmount = mix(0.01, 0.04, rand(vec2(uv.y * 200.0, uTime)));

//       // Chromatic Aberration with stutter
//       vec2 rOffset = toCenter * (glitchAmount + 0.005) * glitchStrength * uProgress;
//       vec2 bOffset = toCenter * -(glitchAmount + 0.003) * glitchStrength * uProgress;

//       vec4 r = texture2D(uTexture, uv + rOffset);
//       vec4 g = texture2D(uTexture, uv);
//       vec4 b = texture2D(uTexture, uv + bOffset);

//       vec4 color = vec4(r.r, g.g, b.b, 1.0);

//       // Glitch bar
//       float bar = step(0.93, rand(vec2(uTime * 0.2, floor(uv.y * 40.0)))) * 0.1;
//       color.rgb += bar;

//       // Pixel-span (block offset)
//       float blockGlitch = step(0.96, rand(floor(vec2(uv.y * 10.0, uTime * 3.0))));
//       vec2 blockOffset = vec2(blockGlitch * 0.15 * rand(vec2(uv.y * 100.0, uTime)), 0.0);
//       vec4 blockColor = texture2D(uTexture, uv + blockOffset);
//       color.rgb = mix(color.rgb, blockColor.rgb, blockGlitch);

//       // Grungy static noise overlay
//       float n = noise(uv * 10.0 + uTime * 0.5);
//       color.rgb += (n - 0.5) * 0.1 * uProgress;

//       // Scanline flicker
//       float scanline = 0.015 * sin(uv.y * 300.0 + uTime * 80.0);
//       color.rgb += scanline * uProgress;

//       gl_FragColor = color;
//     }
//   `
// });

//     const material5 = new THREE.ShaderMaterial({
//   uniforms,
//   transparent: true,
//   vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   fragmentShader: `
//     varying vec2 vUv;
//     uniform sampler2D uTexture;
//     uniform float uTime;
//     uniform float uProgress;

//     float rand(vec2 co) {
//       return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
//     }

//     float noise(vec2 p){
//       vec2 i = floor(p);
//       vec2 f = fract(p);
//       float a = rand(i);
//       float b = rand(i + vec2(1.0, 0.0));
//       float c = rand(i + vec2(0.0, 1.0));
//       float d = rand(i + vec2(1.0, 1.0));
//       vec2 u = f * f * (3.0 - 2.0 * f);
//       return mix(a, b, u.x) +
//              (c - a)* u.y * (1.0 - u.x) +
//              (d - b) * u.x * u.y;
//     }

//     void main() {
//       vec2 uv = vUv;
//       vec2 center = vec2(0.5);
//       vec2 toCenter = uv - center;
//       float dist = length(toCenter);

//       // Glitchy chromatic offset
//       float chromaJitter = step(0.9, rand(vec2(uTime * 2.0, uv.y * 100.0)));
//       float chromaStrength = mix(0.005, 0.025, rand(vec2(uv.y * 40.0, uTime)));
//       vec2 chromaOffset = toCenter * chromaStrength * chromaJitter * uProgress;

//       vec4 r = texture2D(uTexture, uv + chromaOffset);
//       vec4 g = texture2D(uTexture, uv);
//       vec4 b = texture2D(uTexture, uv - chromaOffset);
//       vec4 color = vec4(r.r, g.g, b.b, 1.0);

//       // Glitch bar distortion
//       float bar = step(0.94, rand(vec2(uTime * 0.2, floor(uv.y * 40.0)))) * 0.1;
//       color.rgb += bar;

//       // Heavy pixel-span glitch (horizontal blocks)
//       float blockGlitch = step(0.96, rand(floor(vec2(uv.y * 10.0, uTime * 3.0))));
//       vec2 blockOffset = vec2(blockGlitch * 0.1 * rand(vec2(uv.y * 100.0, uTime)), 0.0);
//       vec4 blockColor = texture2D(uTexture, uv + blockOffset);
//       color.rgb = mix(color.rgb, blockColor.rgb, blockGlitch);

//       // Grunge noise overlay
//       float n = noise(uv * 10.0 + uTime * 0.5);
//       color.rgb += (n - 0.5) * 0.12 * uProgress;

//       // Scanline flicker
//       float scanline = 0.02 * sin(uv.y * 300.0 + uTime * 80.0);
//       color.rgb += scanline * uProgress;

//       gl_FragColor = color;
//     }
//   `
// });


//     const material4 = new THREE.ShaderMaterial({
//   uniforms,
//   transparent: true,
//   vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   fragmentShader: `
//     varying vec2 vUv;
//     uniform sampler2D uTexture;
//     uniform float uTime;
//     uniform float uProgress;

//     float rand(vec2 co) {
//       return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
//     }

//     // Simple 2D noise
//     float noise(vec2 p){
//       vec2 i = floor(p);
//       vec2 f = fract(p);
//       float a = rand(i);
//       float b = rand(i + vec2(1.0, 0.0));
//       float c = rand(i + vec2(0.0, 1.0));
//       float d = rand(i + vec2(1.0, 1.0));
//       vec2 u = f * f * (3.0 - 2.0 * f);
//       return mix(a, b, u.x) +
//              (c - a)* u.y * (1.0 - u.x) +
//              (d - b) * u.x * u.y;
//     }

//     void main() {
//       vec2 uv = vUv;

//       // Chromatic aberration (slight RGB misalignment based on distance from center)
//       vec2 center = vec2(0.5);
//       vec2 toCenter = uv - center;
//       float dist = length(toCenter);
//       vec2 aberration = toCenter * 0.01 * uProgress;

//       vec4 r = texture2D(uTexture, uv + aberration);
//       vec4 g = texture2D(uTexture, uv);
//       vec4 b = texture2D(uTexture, uv - aberration);
//       vec4 color = vec4(r.r, g.g, b.b, 1.0);

//       // Glitch bars
//       float bar = step(0.96, rand(vec2(uTime * 0.2, floor(uv.y * 40.0)))) * 0.08;
//       color.rgb += bar;

//       // Digital block glitch
//       float block = step(0.995, rand(floor(uv * 20.0 + uTime * 2.0)));
//       vec2 glitchOffset = vec2(block * 0.05 * uProgress, 0.0);
//       vec4 glitchColor = texture2D(uTexture, uv + glitchOffset);
//       color.rgb = mix(color.rgb, glitchColor.rgb, block);

//       // Grunge overlay (noise based)
//       float n = noise(uv * 10.0 + uTime * 0.5);
//       color.rgb += (n - 0.5) * 0.15 * uProgress;

//       // Scanline flicker
//       float scanline = 0.02 * sin(uv.y * 300.0 + uTime * 80.0);
//       color.rgb += scanline * uProgress;

//       gl_FragColor = color;
//     }
//   `,
// });

//     const material2 = new THREE.ShaderMaterial({
//       uniforms,
//       transparent: true,
//       vertexShader: `
//         varying vec2 vUv;
//         void main() {
//           vUv = uv;
//           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//       `,
//       fragmentShader: `
//         varying vec2 vUv;
//         uniform sampler2D uTexture;
//         uniform float uTime;
//         uniform float uProgress;

//         float rand(vec2 co) {
//           return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
//         }

//         void main() {
//           vec2 uv = vUv;

//           float yNoise = step(0.95, rand(vec2(uTime * 0.2, uv.y * 40.0))) * 0.05;
//           float xShake = sin(uv.y * 80.0 + uTime * 10.0) * 0.005;
//           vec2 offset = vec2((rand(uv + uTime) - 0.5) * 0.02 * uProgress, 0.0);

//           vec4 r = texture2D(uTexture, uv + offset);
//           vec4 g = texture2D(uTexture, uv);
//           vec4 b = texture2D(uTexture, uv - offset);

//           vec4 color = vec4(r.r, g.g, b.b, 1.0);
//           color.rgb += yNoise;
//           uv.x += xShake * uProgress;

//           gl_FragColor = color;
//         }
//       `
//     });

//    const material3 = new THREE.ShaderMaterial({
//   uniforms,
//   transparent: true,
//   vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   fragmentShader: `
//     varying vec2 vUv;
//     uniform sampler2D uTexture;
//     uniform float uTime;
//     uniform float uProgress;

//     float rand(vec2 co) {
//       return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
//     }

//     void main() {
//       vec2 uv = vUv;

//       // Subtle RGB split
//       vec2 offset = vec2((rand(uv + uTime * 0.5) - 0.5) * 0.01 * uProgress, 0.0);
//       vec4 r = texture2D(uTexture, uv + offset);
//       vec4 g = texture2D(uTexture, uv);
//       vec4 b = texture2D(uTexture, uv - offset);
//       vec4 color = vec4(r.r, g.g, b.b, 1.0);

//       // Occasional horizontal shake
//       float xShake = sin(uv.y * 100.0 + uTime * 10.0) * 0.003 * step(0.95, rand(vec2(uTime, uv.y * 20.0)));
//       uv.x += xShake * uProgress;

//       // Sparse block glitch
//       float blockGlitch = step(0.995, rand(floor(uv * 10.0 + uTime * 2.0)));
//       vec2 glitchOffset = vec2(blockGlitch * 0.05 * uProgress, 0.0);
//       vec4 glitchColor = texture2D(uTexture, uv + glitchOffset);
//       color.rgb = mix(color.rgb, glitchColor.rgb, blockGlitch);

//       // Soft scanline flicker
//       float scanline = 0.03 * sin(uv.y * 300.0 + uTime * 60.0);
//       color.rgb += scanline * uProgress;

//       gl_FragColor = color;
//     }
//   `,
// });
    

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);

    const loader = new THREE.TextureLoader();

    // Hover logic for .hover_image elements
    const images = document.querySelectorAll('.hover_image');

    images.forEach(img => {
      img.addEventListener('mouseenter', () => {
        const rect = img.getBoundingClientRect();
        loader.load(img.src, texture => {
          uniforms.uTexture.value = texture;
          uniforms.uProgress.value = 1.0;

          mesh.scale.set(rect.width, rect.height, 1);
          mesh.position.set(
            rect.left + rect.width / 2 - window.innerWidth / 2,
            -rect.top - rect.height / 2 + window.innerHeight / 2,
            0
          );

          mesh.visible = true;
        });
      });

      img.addEventListener('mouseleave', () => {
        uniforms.uProgress.value = 0.0;
        mesh.visible = false;
      });
    });

    function animate(time) {
      uniforms.uTime.value = time * 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.left = -window.innerWidth / 2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = -window.innerHeight / 2;
      camera.updateProjectionMatrix();
    });
  });

// dif verisons of glitch shaders
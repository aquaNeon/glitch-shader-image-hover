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
      uProgress: { value: 0 }
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
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;

          float yNoise = step(0.95, rand(vec2(uTime * 0.2, uv.y * 40.0))) * 0.05;
          float xShake = sin(uv.y * 80.0 + uTime * 10.0) * 0.005;
          vec2 offset = vec2((rand(uv + uTime) - 0.5) * 0.02 * uProgress, 0.0);

          vec4 r = texture2D(uTexture, uv + offset);
          vec4 g = texture2D(uTexture, uv);
          vec4 b = texture2D(uTexture, uv - offset);

          vec4 color = vec4(r.r, g.g, b.b, 1.0);
          color.rgb += yNoise;
          uv.x += xShake * uProgress;

          gl_FragColor = color;
        }
      `
    });

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


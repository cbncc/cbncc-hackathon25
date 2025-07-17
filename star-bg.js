// Minimal Three.js starry purple background animation
let scene, camera, renderer, particles;

function initBackgroundAnimation() {
    const backgroundCanvas = document.getElementById('background-canvas');
    if (!backgroundCanvas) return;

    // Three.js setup for background
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: backgroundCanvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create background particles (distant stars)
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Purple color for stars
    const material = new THREE.PointsMaterial({
        size: 0.08,
        color: 0xA259F7, // purple
        transparent: true,
        opacity: 0.5
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 50;

    function animateBackground() {
        requestAnimationFrame(animateBackground);
        particles.rotation.x += 0.0002;
        particles.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    animateBackground();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
} 
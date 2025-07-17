// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Global variables
let scene, camera, renderer, particles;
let heroScene, heroCamera, heroRenderer, heroParticles, heroLines;
let aboutScene, aboutCamera, aboutRenderer, aboutParticles;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// --- PLANET AND AUDIO GLOBALS ---
let isAudioEnabled = true;
let audioContext, ambientGain, uiGain;
let audioToggle;

// --- NEW GLOBALS FOR MERGE ANIMATION ---
let keepLearningSun = null;
let workTeamCenterPlanet = null;
let keepLearningRenderer = null;
let keepLearningScene = null;
let keepLearningCamera = null;
let keepLearningCanvas = null;
let workTeamScene = null;
let workTeamRenderer = null;
let workTeamCamera = null;
let workTeamCanvas = null;

// --- ENHANCED ANIMATION UTILITIES ---
const Easing = {
    // Smooth cubic bezier curves
    smooth: (t) => t * t * (3 - 2 * t),
    smoothIn: (t) => t * t * t,
    smoothOut: (t) => 1 - Math.pow(1 - t, 3),
    smoothInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

    // Elastic effects
    elastic: (t) => {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },

    // Bounce effect
    bounce: (t) => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    },

    // Back easing functions
    back: {
        in: (t) => {
            const s = 1.70158;
            return t * t * ((s + 1) * t - s);
        },
        out: (t) => {
            const s = 1.70158;
            return --t * t * ((s + 1) * t + s) + 1;
        },
        inOut: (t) => {
            const s = 1.70158 * 1.525;
            if ((t *= 2) < 1) {
                return 0.5 * (t * t * ((s + 1) * t - s));
            } else {
                return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
            }
        }
    },

    // Sine wave oscillation
    sine: (t) => Math.sin(t * Math.PI * 2),
    sineIn: (t) => 1 - Math.cos(t * Math.PI / 2),
    sineOut: (t) => Math.sin(t * Math.PI / 2),
    sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2
};

// --- PLANET ANIMATION SYSTEM ---
function initPlanetAnimation() {
    const planetCanvas = document.getElementById('planet-canvas');
    if (!planetCanvas) return;

    // Three.js setup for planet
    planetScene = new THREE.Scene();
    planetCamera = new THREE.PerspectiveCamera(75, planetCanvas.clientWidth / planetCanvas.clientHeight, 0.1, 1000);
    planetRenderer = new THREE.WebGLRenderer({ canvas: planetCanvas, alpha: true, antialias: true });
    planetRenderer.setSize(planetCanvas.clientWidth, planetCanvas.clientHeight);
    planetRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create planet geometry with more detail
    const planetGeometry = new THREE.SphereGeometry(3, 64, 64);

    // Create planet material with custom shader for better visual effect
    const planetMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a90e2,
        shininess: 100,
        transparent: true,
        opacity: 0.9
    });

    planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetScene.add(planetMesh);

    // Add atmospheric glow
    const glowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    planetGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    planetScene.add(planetGlow);

    // Add rings around the planet
    const ringGeometry = new THREE.RingGeometry(4, 6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x64ffda,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planetScene.add(ring);

    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    planetScene.add(ambientLight);

    // Add directional light for planet shading
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    planetScene.add(directionalLight);

    planetCamera.position.z = 10;

    // Animation loop for planet
    function animatePlanet() {
        requestAnimationFrame(animatePlanet);

        // Rotate planet slowly
        planetMesh.rotation.y += 0.005;
        planetMesh.rotation.x += 0.002;

        // Rotate glow and ring
        planetGlow.rotation.y += 0.003;
        ring.rotation.z += 0.01;

        // Pulse the glow
        planetGlow.material.opacity = 0.2 + Math.sin(Date.now() * 0.003) * 0.1;

        // Add subtle mouse interaction
        const mouseInfluence = 0.0001;
        planetMesh.rotation.x += (mouseY - windowHalfY) * mouseInfluence;
        planetMesh.rotation.y += (mouseX - windowHalfX) * mouseInfluence;

        planetRenderer.render(planetScene, planetCamera);
    }

    animatePlanet();

    // Handle resize
    window.addEventListener('resize', () => {
        planetCamera.aspect = planetCanvas.clientWidth / planetCanvas.clientHeight;
        planetCamera.updateProjectionMatrix();
        planetRenderer.setSize(planetCanvas.clientWidth, planetCanvas.clientHeight);
    });
}

// --- AUDIO SYSTEM ---
function initAudioSystem() {
    // Get audio toggle button
    audioToggle = document.getElementById('audio-toggle');

    if (!audioToggle) return;

    // Initialize Web Audio API only after user interaction
    let audioInitialized = false;

    function initializeAudio() {
        if (audioInitialized) return;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes for volume control
            ambientGain = audioContext.createGain();
            uiGain = audioContext.createGain();

            // Set initial volumes
            ambientGain.gain.value = 0.2;
            uiGain.gain.value = 0.3;

            // Connect gain nodes to destination
            ambientGain.connect(audioContext.destination);
            uiGain.connect(audioContext.destination);

            audioInitialized = true;
            console.log('Audio system initialized successfully');

        } catch (error) {
            console.log('Web Audio API not supported, using fallback');
        }
    }

    // Audio toggle functionality
    audioToggle.addEventListener('click', () => {
        // Initialize audio on first click
        if (!audioInitialized) {
            initializeAudio();
        }

        isAudioEnabled = !isAudioEnabled;

        if (isAudioEnabled) {
            audioToggle.textContent = '🔊';
            audioToggle.style.borderColor = '#64ffda';
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (ambientGain) {
                ambientGain.gain.value = 0.2;
                // Start ambient music only after user interaction
                generateAmbientMusic();
            }
        } else {
            audioToggle.textContent = '🔇';
            audioToggle.style.borderColor = '#666';
            if (ambientGain) {
                ambientGain.gain.value = 0;
            }
            // Clear ambient music when disabled
            clearAmbientMusic();
        }

        // Play UI sound
        playUISound('click');
    });

    // Add hover sounds to interactive elements
    addHoverSounds();
}

// Generate ambient music using Web Audio API
let ambientOscillators = [];
let ambientInterval = null;

function generateAmbientMusic() {
    if (!audioContext || !isAudioEnabled) return;

    // Clear any existing ambient music
    clearAmbientMusic();

    // Create oscillator for ambient drone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Set up oscillator
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3

    // Create a slow frequency modulation
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 10);
    oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 20);

    // Set up gain for volume control
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ambientGain);

    // Start the oscillator
    oscillator.start();
    ambientOscillators.push(oscillator);

    // Create a second oscillator for harmony
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(330, audioContext.currentTime); // E4

    // Different modulation pattern
    oscillator2.frequency.setValueAtTime(330, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 15);
    oscillator2.frequency.exponentialRampToValueAtTime(330, audioContext.currentTime + 30);

    gainNode2.gain.setValueAtTime(0.05, audioContext.currentTime);

    oscillator2.connect(gainNode2);
    gainNode2.connect(ambientGain);

    oscillator2.start();
    ambientOscillators.push(oscillator2);

    // Loop the ambient music with proper cleanup
    ambientInterval = setInterval(() => {
        if (isAudioEnabled && audioContext) {
            generateAmbientMusic();
        }
    }, 30000); // Restart every 30 seconds
}

// Clear ambient music
function clearAmbientMusic() {
    // Stop all oscillators
    ambientOscillators.forEach(osc => {
        try {
            osc.stop();
        } catch (e) {
            // Oscillator might already be stopped
        }
    });
    ambientOscillators = [];

    // Clear interval
    if (ambientInterval) {
        clearInterval(ambientInterval);
        ambientInterval = null;
    }
}

// Play UI sounds
let lastUISoundTime = 0;
const UI_SOUND_COOLDOWN = 100; // Minimum time between UI sounds in ms

function playUISound(type) {
    if (!isAudioEnabled || !audioContext) return;

    // Prevent too many sounds at once
    const now = Date.now();
    if (now - lastUISoundTime < UI_SOUND_COOLDOWN) return;
    lastUISoundTime = now;

    try {
        if (type === 'click') {
            // Generate click sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(uiGain);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);

        } else if (type === 'hover') {
            // Generate hover sound - only play occasionally to reduce spam
            if (Math.random() > 0.3) return; // 30% chance to play hover sound

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

            oscillator.connect(gainNode);
            gainNode.connect(uiGain);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
        }
    } catch (error) {
        console.log('UI sound generation failed:', error);
    }
}

// Add hover sounds to interactive elements
function addHoverSounds() {
    const interactiveElements = document.querySelectorAll('button, a, .nav-link, .work-item, .contact-link, .cta-button');

    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => playUISound('hover'));
        element.addEventListener('click', () => playUISound('click'));
    });
}

// Performance monitoring
let fps = 60;
let frameCount = 0;
let lastFpsUpdate = 0;
let isLowPerformance = false;

function updateFPS(currentTime) {
    frameCount++;
    if (currentTime - lastFpsUpdate >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsUpdate = currentTime;

        // Auto-adjust performance if FPS drops - less aggressive logging
        if (fps < 30 && !isLowPerformance) {
            isLowPerformance = true;
            console.log('Performance mode: Low (FPS:', fps, ')');
        } else if (fps > 50 && isLowPerformance) {
            isLowPerformance = false;
            console.log('Performance mode: High (FPS:', fps, ')');
        }
    }
    requestAnimationFrame(updateFPS);
}

// Enhanced particle system
class EnhancedParticle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 2;
        this.vy = options.vy || (Math.random() - 0.5) * 2;
        this.size = options.size || Math.random() * 3 + 1;
        this.color = options.color || '#ffffff';
        this.opacity = options.opacity || 0.8;
        this.life = 0;
        this.maxLife = options.maxLife || 1;
        this.easing = options.easing || Easing.sine;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.life += deltaTime * 0.01;

        // Oscillate opacity
        this.opacity = 0.3 + 0.7 * Math.sin(this.life * Math.PI * 2);

        // Bounce off edges
        if (this.x <= 0 || this.x >= window.innerWidth) this.vx *= -1;
        if (this.y <= 0 || this.y >= window.innerHeight) this.vy *= -1;

        return this.life < this.maxLife;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.size * 2;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// DOM elements
const loadingScreen = document.getElementById('loading');
const loadingProgress = document.querySelector('.loading-progress');
const customCursor = document.querySelector('.custom-cursor');
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const navLinks = document.querySelectorAll('.nav-link');
const ctaButton = document.querySelector('.cta-button');

// Loading animation
function initLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        loadingProgress.style.width = progress + '%';

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    initApp();
                }, 500);
            }, 500);
        }
    }, 100);
}

// Initialize the application
function initApp() {
    initCustomCursor();
    initNavigation();
    initHeroAnimation();
    initWorkAnimations();
    initAboutAnimation();
    initContactAnimations();
    initBackgroundAnimation();
    initScrollAnimations();
    initSmokeEffects();
    initAudioSystem();
}

// Custom cursor
function initCustomCursor() {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';

        cursorRing.style.left = mouseX + 'px';
        cursorRing.style.top = mouseY + 'px';
    });

    // Cursor hover effects
    const hoverElements = document.querySelectorAll('a, button, .work-item');
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorRing.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorRing.style.borderColor = '#64ffda';
        });

        element.addEventListener('mouseleave', () => {
            cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorRing.style.borderColor = 'rgba(100, 255, 218, 0.5)';
        });
    });
}

// Navigation
function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }

            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Update active nav on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Hero section animation with space-like effects
function initHeroAnimation() {
    const heroCanvas = document.getElementById('hero-canvas');
    if (!heroCanvas) return;

    // Three.js setup
    heroScene = new THREE.Scene();
    heroCamera = new THREE.PerspectiveCamera(75, heroCanvas.clientWidth / heroCanvas.clientHeight, 0.1, 1000);
    heroRenderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true });
    heroRenderer.setSize(heroCanvas.clientWidth, heroCanvas.clientHeight);
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Adaptive particle count based on performance
    const baseParticleCount = 800;
    const particleCount = isLowPerformance ? Math.floor(baseParticleCount * 0.6) : baseParticleCount;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3); // Add velocity for movement

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        // Add subtle velocity for dynamic movement
        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

        // Create different colored stars with enhanced variety
        const colorChoice = Math.random();
        if (colorChoice < 0.25) {
            colors[i * 3] = 1.0;     // White
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
        } else if (colorChoice < 0.5) {
            colors[i * 3] = 0.4;     // Blue
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 1.0;
        } else if (colorChoice < 0.75) {
            colors[i * 3] = 1.0;     // Cyan
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 0.8;
        } else {
            colors[i * 3] = 0.7;     // Purple
            colors[i * 3 + 1] = 0.5;
            colors[i * 3 + 2] = 1.0;
        }

        sizes[i] = Math.random() * 0.3 + 0.05;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending // Enhanced blending for better glow
    });

    heroParticles = new THREE.Points(geometry, material);
    heroScene.add(heroParticles);

    // Create line geometry for scrolling effect with enhanced visuals
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    const lineColors = [];

    const lineCount = isLowPerformance ? 2 : 4;

    for (let i = 0; i < lineCount; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;

        const lineLength = 0.5 + Math.random() * 1;
        linePositions.push(x, y - lineLength / 2, z);
        linePositions.push(x, y + lineLength / 2, z);

        const colorChoice = Math.random();
        let r, g, b;
        if (colorChoice < 0.3) {
            r = 1.0; g = 1.0; b = 1.0; // White
        } else if (colorChoice < 0.6) {
            r = 0.4; g = 0.8; b = 1.0; // Blue
        } else {
            r = 1.0; g = 1.0; b = 0.8; // Cyan
        }

        lineColors.push(r, g, b);
        lineColors.push(r, g, b);
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });

    heroLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    heroLines.visible = false;
    heroScene.add(heroLines);

    heroCamera.position.z = 50;

    // Enhanced scroll detection with smooth transitions
    let heroIsScrolling = false;
    let heroScrollTimeout;
    let scrollIntensity = 0; // Smooth transition value

    function handleHeroScroll() {
        heroIsScrolling = true;
        scrollIntensity = Math.min(1, scrollIntensity + 0.1);

        if (heroScrollTimeout) {
            clearTimeout(heroScrollTimeout);
        }

        heroScrollTimeout = setTimeout(() => {
            heroIsScrolling = false;
        }, 150);
    }

    // Enhanced animation loop with performance monitoring
    let lastTime = 0;
    function animateHero(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Smooth scroll intensity transition
        if (heroIsScrolling) {
            scrollIntensity = Math.min(1, scrollIntensity + 0.1);
        } else {
            scrollIntensity = Math.max(0, scrollIntensity - 0.05);
        }

        // Update particle positions with velocity
        const positions = heroParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;

            // Wrap around boundaries
            if (Math.abs(positions[i]) > 50) velocities[i] *= -1;
            if (Math.abs(positions[i + 1]) > 50) velocities[i + 1] *= -1;
            if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1;
        }
        heroParticles.geometry.attributes.position.needsUpdate = true;

        // Update visibility based on scroll state with smooth transitions
        heroParticles.visible = true;
        heroLines.visible = scrollIntensity > 0.1;
        heroLines.material.opacity = scrollIntensity * 0.3;

        // Enhanced rotation with easing
        const rotationSpeed = isLowPerformance ? 0.5 : 1;
        heroParticles.rotation.x += 0.0005 * rotationSpeed;
        heroParticles.rotation.y += 0.001 * rotationSpeed;
        heroLines.rotation.x += 0.0005 * rotationSpeed;
        heroLines.rotation.y += 0.001 * rotationSpeed;

        // Enhanced mouse interaction with smooth interpolation
        const mouseInfluence = isLowPerformance ? 0.5 : 1;
        heroParticles.rotation.x += (mouseY - windowHalfY) * 0.000001 * mouseInfluence;
        heroParticles.rotation.y += (mouseX - windowHalfX) * 0.000001 * mouseInfluence;
        heroLines.rotation.x += (mouseY - windowHalfY) * 0.000001 * mouseInfluence;
        heroLines.rotation.y += (mouseX - windowHalfX) * 0.000001 * mouseInfluence;

        heroRenderer.render(heroScene, heroCamera);
        requestAnimationFrame(animateHero);
    }

    animateHero(performance.now());

    window.addEventListener('scroll', handleHeroScroll);

    // Enhanced resize handling
    window.addEventListener('resize', () => {
        heroCamera.aspect = heroCanvas.clientWidth / heroCanvas.clientHeight;
        heroCamera.updateProjectionMatrix();
        heroRenderer.setSize(heroCanvas.clientWidth, heroCanvas.clientHeight);
    });
}

// Enhanced smoke effects
function initSmokeEffects() {
    const smokeParticles = document.querySelectorAll('.smoke-particle');

    smokeParticles.forEach((particle, index) => {
        // Add random variations to smoke particles
        const randomX = Math.random() * 20 - 10;
        const randomDelay = Math.random() * 5;
        const randomDuration = 8 + Math.random() * 6;

        particle.style.left = `calc(${particle.style.left} + ${randomX}px)`;
        particle.style.animationDelay = `${randomDelay}s`;
        particle.style.animationDuration = `${randomDuration}s`;

        // Add glow effect
        particle.style.boxShadow = `0 0 10px rgba(100, 255, 218, 0.8)`;
    });
}

// Work section animations
function initWorkAnimations() {
    const workItems = document.querySelectorAll('.work-item');

    workItems.forEach((item, index) => {
        gsap.fromTo(item, {
            opacity: 0,
            y: 100
        }, {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: index * 0.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: item,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

// About section animation
function initAboutAnimation() {
    const aboutCanvas = document.getElementById('about-canvas');
    if (!aboutCanvas) return;

    // Three.js setup for about section
    aboutScene = new THREE.Scene();
    aboutCamera = new THREE.PerspectiveCamera(75, aboutCanvas.clientWidth / aboutCanvas.clientHeight, 0.1, 1000);
    aboutRenderer = new THREE.WebGLRenderer({ canvas: aboutCanvas, alpha: true, antialias: true });
    aboutRenderer.setSize(aboutCanvas.clientWidth, aboutCanvas.clientHeight);
    aboutRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create geometric shapes
    const geometry = new THREE.IcosahedronGeometry(2, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0x64ffda,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    aboutScene.add(mesh);

    aboutCamera.position.z = 5;

    // Animation loop
    function animateAbout() {
        requestAnimationFrame(animateAbout);

        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;

        aboutRenderer.render(aboutScene, aboutCamera);
    }

    animateAbout();

    // Handle resize
    window.addEventListener('resize', () => {
        aboutCamera.aspect = aboutCanvas.clientWidth / aboutCanvas.clientHeight;
        aboutCamera.updateProjectionMatrix();
        aboutRenderer.setSize(aboutCanvas.clientWidth, aboutCanvas.clientHeight);
    });
}

// Contact section animations
function initContactAnimations() {
    const contactLinks = document.querySelectorAll('.contact-link');

    contactLinks.forEach((link, index) => {
        gsap.fromTo(link, {
            opacity: 0,
            scale: 0.8
        }, {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: index * 0.2,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: link,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

// Background animation with space theme
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
    const particleCount = 200; // reduced from 500
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        size: 0.08, // much smaller
        color: 0x64ffda,
        transparent: true,
        opacity: 0.2
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 50;

    // Animation loop
    function animateBackground() {
        requestAnimationFrame(animateBackground);

        particles.rotation.x += 0.0002;
        particles.rotation.y += 0.0005;

        renderer.render(scene, camera);
    }

    animateBackground();

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Scroll animations
function initScrollAnimations() {
    // Enhanced hero section parallax with smooth easing
    gsap.to('.hero-content', {
        yPercent: -30,
        ease: "power2.out",
        scrollTrigger: {
            trigger: '.hero-section',
            start: "top bottom",
            end: "bottom top",
            scrub: 1, // Smoother scrubbing
            onUpdate: (self) => {
                // Performance-based updates
                if (isLowPerformance && self.progress % 0.1 > 0.05) return;
            }
        }
    });

    // Enhanced section titles animation with staggered entrance
    gsap.utils.toArray('.section-title').forEach((title, index) => {
        gsap.fromTo(title, {
            opacity: 0,
            y: 50,
            scale: 0.95
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            delay: index * 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: title,
                start: "top 85%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Enhanced section subtitles with elastic effect
    gsap.utils.toArray('.section-subtitle').forEach((subtitle, index) => {
        gsap.fromTo(subtitle, {
            opacity: 0,
            y: 30,
            x: -20
        }, {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 1,
            delay: 0.2 + index * 0.1,
            ease: "elastic.out(1, 0.5)",
            scrollTrigger: {
                trigger: subtitle,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Enhanced about description with smooth slide
    gsap.fromTo('.about-description', {
        opacity: 0,
        x: -50,
        rotationY: -15
    }, {
        opacity: 1,
        x: 0,
        rotationY: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: '.about-description',
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
        }
    });

    // Enhanced skills animation with staggered entrance
    gsap.utils.toArray('.skill-category').forEach((category, index) => {
        gsap.fromTo(category, {
            opacity: 0,
            y: 30,
            scale: 0.9
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: index * 0.15,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: category,
                start: "top 85%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Enhanced challenge details with bounce effect
    gsap.utils.toArray('.detail-card').forEach((card, index) => {
        gsap.fromTo(card, {
            opacity: 0,
            y: 50,
            rotationX: -10
        }, {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: "bounce.out",
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Enhanced work items with 3D effect
    gsap.utils.toArray('.work-item').forEach((item, index) => {
        gsap.fromTo(item, {
            opacity: 0,
            y: 60,
            rotationY: -15,
            scale: 0.8
        }, {
            opacity: 1,
            y: 0,
            rotationY: 0,
            scale: 1,
            duration: 1,
            delay: index * 0.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: item,
                start: "top 85%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

// CTA button interaction
if (ctaButton) {
    ctaButton.addEventListener('click', () => {
        const problemSection = document.querySelector('#problem');
        if (problemSection) {
            problemSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Smooth scroll for all internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Enhanced parallax effect for mouse movement
document.addEventListener('mousemove', (e) => {
    const moveX = (e.clientX - window.innerWidth / 2) * 0.02;
    const moveY = (e.clientY - window.innerHeight / 2) * 0.02;

    gsap.to('.hero-content', {
        x: moveX,
        y: moveY,
        duration: 1,
        ease: "power2.out"
    });

    // Move smoke particles slightly with mouse
    gsap.to('.smoke-container', {
        x: moveX * 0.5,
        y: moveY * 0.5,
        duration: 1,
        ease: "power2.out"
    });
});

// Falling stars animation
function initFallingStars() {
    const canvas = document.getElementById('falling-stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Scroll detection variables
    let isScrolling = false;
    let scrollTimeout;
    let lastTime = 0;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);

    // Enhanced Star object with better physics
    function Star() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.length = 40 + Math.random() * 60;
        this.speed = 4 + Math.random() * 4;
        this.alpha = 0.7 + Math.random() * 0.3;
        this.size = 3 + Math.random() * 3;
        this.isLine = false;
        this.trail = []; // Store trail positions for smoother effect
        this.maxTrailLength = 10;
        this.oscillation = Math.random() * Math.PI * 2;
        this.oscillationSpeed = 0.02 + Math.random() * 0.03;
    }

    Star.prototype.draw = function (ctx) {
        ctx.save();

        // Draw trail with fade effect
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);

            for (let i = 1; i < this.trail.length; i++) {
                const point = this.trail[i];
                const alpha = (i / this.trail.length) * this.alpha;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = this.size * (i / this.trail.length);
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }

        // Draw main star
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 40;
        ctx.lineWidth = 2;

        if (this.isLine) {
            // Draw as a simple line when scrolling
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.length);
            ctx.stroke();
        } else {
            // Draw as star with trail and head when not scrolling
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.length);
            ctx.stroke();

            // Draw star head with oscillation
            const headX = this.x + Math.sin(this.oscillation) * 2;
            const headY = this.y + this.length;
            ctx.beginPath();
            ctx.arc(headX, headY, this.size, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 60;
            ctx.fill();
        }

        ctx.restore();
    };

    Star.prototype.update = function (deltaTime) {
        // Update oscillation
        this.oscillation += this.oscillationSpeed;

        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.y += this.speed;
        if (this.y > height + 40) {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.length = 40 + Math.random() * 60;
            this.speed = 4 + Math.random() * 4;
            this.alpha = 0.7 + Math.random() * 0.3;
            this.size = 3 + Math.random() * 3;
            this.trail = []; // Clear trail on reset
            this.oscillation = Math.random() * Math.PI * 2;
        }

        // Update shape based on scroll state
        this.isLine = isScrolling;
    };

    // Create stars with performance adjustment
    const starCount = isLowPerformance ? 4 : 6;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
        stars.push(new Star());
    }

    // Scroll detection with debouncing
    function handleScroll() {
        isScrolling = true;

        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    }

    // Enhanced animation loop with delta time
    function animate(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        ctx.clearRect(0, 0, width, height);

        // Apply performance-based updates
        const updateFrequency = isLowPerformance ? 2 : 1;
        for (let i = 0; i < stars.length; i++) {
            if (i % updateFrequency === 0) {
                stars[i].update(deltaTime);
            }
            stars[i].draw(ctx);
        }

        requestAnimationFrame(animate);
    }

    // Only animate when section is in view with smooth transitions
    function onScroll() {
        const section = document.getElementById('falling-stars-section');
        const rect = section.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isInView) {
            if (!canvas._animating) {
                canvas._animating = true;
                lastTime = performance.now();
                animate(lastTime);
            }
        } else {
            canvas._animating = false;
        }
    }

    // Add scroll event listeners with throttling
    let scrollThrottle;
    window.addEventListener('scroll', () => {
        if (!scrollThrottle) {
            scrollThrottle = requestAnimationFrame(() => {
                handleScroll();
                onScroll();
                scrollThrottle = null;
            });
        }
    });

    onScroll();
}

// Starfield for falling stars section
function initFallingStarsStarfield() {
    const canvas = document.getElementById('falling-stars-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);

    // Enhanced star generation with different types
    const starCount = isLowPerformance ? 120 : 180;
    const stars = [];

    for (let i = 0; i < starCount; i++) {
        const starType = Math.random();
        let star;

        if (starType < 0.1) {
            // Bright stars (10%)
            star = {
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.2 + 0.8,
                alpha: Math.random() * 0.3 + 0.7,
                twinkle: Math.random() * 0.2 + 0.8,
                color: '#ffffff',
                pulseSpeed: 0.02 + Math.random() * 0.03,
                pulsePhase: Math.random() * Math.PI * 2
            };
        } else if (starType < 0.3) {
            // Colored stars (20%)
            const colors = ['#b388ff', '#7c4dff', '#64ffda'];
            star = {
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 0.8 + 0.4,
                alpha: Math.random() * 0.4 + 0.6,
                twinkle: Math.random() * 0.3 + 0.7,
                color: colors[Math.floor(Math.random() * colors.length)],
                pulseSpeed: 0.015 + Math.random() * 0.025,
                pulsePhase: Math.random() * Math.PI * 2
            };
        } else {
            // Regular stars (70%)
            star = {
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 0.7 + 0.3,
                alpha: Math.random() * 0.5 + 0.5,
                twinkle: Math.random() * 0.5 + 0.75,
                color: '#ffffff',
                pulseSpeed: 0.01 + Math.random() * 0.02,
                pulsePhase: Math.random() * Math.PI * 2
            };
        }

        stars.push(star);
    }

    let lastTime = 0;
    function animate(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        ctx.clearRect(0, 0, width, height);

        // Performance-based update frequency
        const updateFrequency = isLowPerformance ? 2 : 1;

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];

            // Update pulse phase
            s.pulsePhase += s.pulseSpeed * deltaTime;

            // Calculate twinkle with multiple sine waves for more natural effect
            const twinkle1 = Math.sin(s.pulsePhase) * 0.5 + 0.5;
            const twinkle2 = Math.sin(s.pulsePhase * 2.3) * 0.3 + 0.7;
            const twinkle3 = Math.sin(s.pulsePhase * 0.7) * 0.2 + 0.8;

            const finalTwinkle = (twinkle1 * twinkle2 * twinkle3) * s.twinkle;

            // Only update every few frames for performance
            if (i % updateFrequency === 0) {
                s.alpha += (Math.random() - 0.5) * 0.02;
                s.alpha = Math.max(0.2, Math.min(1, s.alpha));
            }

            ctx.save();
            ctx.globalAlpha = s.alpha * finalTwinkle;
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = s.r * 3;

            // Draw star with subtle glow
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
            ctx.fill();

            // Add cross pattern for brighter stars
            if (s.r > 0.8) {
                ctx.globalAlpha = s.alpha * finalTwinkle * 0.3;
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = s.color;
                ctx.beginPath();
                ctx.moveTo(s.x - s.r * 1.5, s.y);
                ctx.lineTo(s.x + s.r * 1.5, s.y);
                ctx.moveTo(s.x, s.y - s.r * 1.5);
                ctx.lineTo(s.x, s.y + s.r * 1.5);
                ctx.stroke();
            }

            ctx.restore();
        }

        requestAnimationFrame(animate);
    }

    animate(performance.now());
}

// Glowing line for HELLO
function drawHelloLine() {
    const canvas = document.getElementById('hello-line-canvas');
    const hello = document.querySelector('.hello-text');
    if (!canvas || !hello) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    function getHelloCenter() {
        const rect = hello.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY
        };
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const center = getHelloCenter();
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.shadowColor = '#64ffda';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(center.x, 0);
        ctx.lineTo(center.x, center.y + 10); // 10px into the text
        ctx.stroke();
        ctx.restore();
    }

    draw();
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        draw();
    });
    // Redraw on scroll and animation
    window.addEventListener('scroll', draw);
    setInterval(draw, 30);
}

// --- HERO LINES CANVAS EFFECT ---
function initHeroLinesEffect() {
    const canvas = document.getElementById('hero-lines-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    function resizeCanvas() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);

    // Line parameters
    const lineCount = 3;
    const lineSpacing = width / (lineCount + 1);
    const lineColor = 'rgba(255,255,255,0.85)';
    const glowColor = 'rgba(255,255,255,0.25)';
    const squareSize = 18;
    const rippleMaxRadius = 48;
    const rippleMinRadius = 18;
    const rippleAlpha = 0.18;
    const fallSpeed = 1.2; // px per frame

    // Each line has its own y position and ripple animation
    const lines = Array.from({ length: lineCount }).map((_, i) => ({
        x: (i + 1) * width / (lineCount + 1),
        y: -Math.random() * height, // start at random heights
        rippleRadius: rippleMinRadius,
        rippleGrowing: true
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        // Recalculate spacing on resize
        for (let i = 0; i < lineCount; i++) {
            lines[i].x = (i + 1) * width / (lineCount + 1);
        }
        // Draw each line
        lines.forEach(line => {
            // Animate fall
            line.y += fallSpeed;
            if (line.y > height * 0.7) line.y = -100;

            // Glow
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.shadowColor = lineColor;
            ctx.shadowBlur = 32;
            ctx.beginPath();
            ctx.moveTo(line.x, 0);
            ctx.lineTo(line.x, line.y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // Glowing square at the end - REMOVED
            // ctx.save();
            // ctx.shadowColor = lineColor;
            // ctx.shadowBlur = 24;
            // ctx.fillStyle = '#fff';
            // ctx.globalAlpha = 1;
            // ctx.fillRect(line.x - squareSize / 2, line.y - squareSize / 2, squareSize, squareSize);
            // ctx.restore();

            // Ripple effect at the bottom
            ctx.save();
            ctx.globalAlpha = rippleAlpha;
            ctx.beginPath();
            ctx.arc(line.x, line.y + 8, line.rippleRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.restore();

            // Animate ripple
            if (line.rippleGrowing) {
                line.rippleRadius += 0.7;
                if (line.rippleRadius > rippleMaxRadius) line.rippleGrowing = false;
            } else {
                line.rippleRadius -= 0.7;
                if (line.rippleRadius < rippleMinRadius) line.rippleGrowing = true;
            }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- HERO TO LINES TRANSITION EFFECT ---
function initTransitionLinesEffect() {
    const canvas = document.getElementById('transition-lines-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight * 2; // covers hero + next section

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight * 2;
    }
    window.addEventListener('resize', resizeCanvas);

    // Line/cube parameters
    const lineCount = 3;
    const cubeSize = 24;
    const lineColor = 'rgba(255,255,255,0.85)';
    const squareColor = '#fff';
    const glowColor = 'rgba(255,255,255,0.25)';
    const rippleMaxRadius = 48;
    const rippleMinRadius = 18;
    const rippleAlpha = 0.18;
    const dropDistance = window.innerHeight * 0.7; // how far the cubes drop
    const startY = window.innerHeight * 0.35; // vertical center of hero section
    const endY = startY + dropDistance;
    const margin = 60; // margin from left/right edge

    // Generate random x positions for each cube/line (once per load)
    const xPositions = [];
    for (let i = 0; i < lineCount; i++) {
        xPositions.push(Math.random() * (width - 2 * margin) + margin);
    }

    function getScrollProgress() {
        // 0 = top of hero, 1 = bottom of hero/top of next section
        const hero = document.getElementById('home');
        const next = document.getElementById('falling-stars-section');
        const heroRect = hero.getBoundingClientRect();
        const nextRect = next.getBoundingClientRect();
        const total = heroRect.height;
        let progress = Math.min(1, Math.max(0, -heroRect.top / total));
        return progress;
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        const progress = getScrollProgress();
        // Ease the progress for a smooth drop
        const eased = progress < 0.5 ? (2 * progress * progress) : (1 - Math.pow(-2 * progress + 2, 2) / 2);

        for (let i = 0; i < lineCount; i++) {
            const x = xPositions[i];
            // Interpolate y from startY to endY
            const y = startY + (endY - startY) * eased;

            // Draw cube at the end of the line - REMOVED
            // ctx.save();
            // ctx.shadowColor = lineColor;
            // ctx.shadowBlur = 24;
            // ctx.fillStyle = squareColor;
            // ctx.globalAlpha = 1;
            // ctx.fillRect(x - cubeSize / 2, y - cubeSize / 2, cubeSize, cubeSize);
            // ctx.restore();

            // Draw ripple at the end only when dropped
            if (progress > 0.7) {
                const rippleRadius = rippleMinRadius + (rippleMaxRadius - rippleMinRadius) * ((progress - 0.7) / 0.3);
                ctx.save();
                ctx.globalAlpha = rippleAlpha;
                ctx.beginPath();
                ctx.arc(x, y + 8, rippleRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 16;
                ctx.stroke();
                ctx.restore();
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// --- HORIZON HERO EFFECTS ---
function initHorizonHero() {
    // Background stars and lines
    const bgCanvas = document.getElementById('horizon-bg');
    const bgCtx = bgCanvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    function resizeBg() {
        width = bgCanvas.width = window.innerWidth;
        height = bgCanvas.height = window.innerHeight;
    }
    resizeBg();
    window.addEventListener('resize', resizeBg);

    // Generate stars
    const starCount = 48;
    const stars = Array.from({ length: starCount }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5
    }));
    // Generate angled lines (top left)
    const lineCount = 7;
    const lines = Array.from({ length: lineCount }).map((_, i) => ({
        x1: 40 + i * 38 + Math.random() * 20,
        y1: 30 + Math.random() * 30,
        x2: 320 + i * 60 + Math.random() * 40,
        y2: 120 + Math.random() * 40
    }));

    function drawBg() {
        bgCtx.clearRect(0, 0, width, height);
        // Draw lines
        bgCtx.save();
        bgCtx.strokeStyle = 'rgba(180,180,180,0.13)';
        bgCtx.lineWidth = 1.1;
        lines.forEach(line => {
            bgCtx.beginPath();
            bgCtx.moveTo(line.x1, line.y1);
            bgCtx.lineTo(line.x2, line.y2);
            bgCtx.stroke();
        });
        bgCtx.restore();
        // Draw stars
        bgCtx.save();
        bgCtx.fillStyle = '#fff';
        stars.forEach(star => {
            bgCtx.globalAlpha = 0.7 + Math.random() * 0.3;
            bgCtx.fillRect(star.x, star.y, star.size, star.size);
        });
        bgCtx.restore();
    }
    setInterval(drawBg, 60);
    drawBg();

    // Animated wavy stripes
    const waveCanvas = document.getElementById('horizon-waves');
    const waveCtx = waveCanvas.getContext('2d');
    let wWidth = waveCanvas.width = window.innerWidth;
    let wHeight = waveCanvas.height = Math.round(window.innerHeight * 0.4);
    function resizeWaves() {
        wWidth = waveCanvas.width = window.innerWidth;
        wHeight = waveCanvas.height = Math.round(window.innerHeight * 0.4);
    }
    window.addEventListener('resize', resizeWaves);

    function drawWaves(time) {
        waveCtx.clearRect(0, 0, wWidth, wHeight);
        const stripes = 18;
        const lineW = wHeight / stripes;
        const amp = wHeight * 0.18;
        const freq = 2.2;
        const speed = 0.0012;
        for (let i = 0; i < stripes; i++) {
            waveCtx.save();
            // Black and white alternating
            waveCtx.strokeStyle = i % 2 === 0 ? '#222' : '#bbb';
            waveCtx.lineWidth = lineW;
            waveCtx.globalAlpha = 0.98;
            waveCtx.beginPath();
            // Evenly spaced y for each stripe, so lines touch
            const baseY = (i + 0.5) * lineW;
            for (let x = 0; x <= wWidth; x += 2) {
                // Sine wave for each line
                const y = baseY + Math.sin((x / wWidth) * Math.PI * freq + i * 0.5 + time * speed) * amp * 0.5;
                if (x === 0) waveCtx.moveTo(x, y);
                else waveCtx.lineTo(x, y);
            }
            waveCtx.stroke();
            waveCtx.restore();
        }
        requestAnimationFrame(drawWaves);
    }
    requestAnimationFrame(drawWaves);
}

// --- HORIZON/WAVE TO PROBLEM STATEMENT TRANSITION ---
function initWaveToWorkTransition() {
    const waveSection = document.querySelector('.horizon-hero');
    const workSection = document.querySelector('.work-section');
    if (!waveSection || !workSection) return;

    // Start with work-section hidden
    workSection.classList.remove('visible');

    // Use IntersectionObserver to detect when wave is out of view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio < 0.2) {
                // Wave mostly out of view: fade out wave, fade in work
                waveSection.classList.add('fade-out');
                workSection.classList.add('visible');
            } else {
                // Wave mostly in view: show wave, hide work
                waveSection.classList.remove('fade-out');
                workSection.classList.remove('visible');
            }
        });
    }, {
        threshold: [0, 0.2, 1],
        rootMargin: '0px 0px 0px 0px'
    });
    observer.observe(waveSection);
}

// --- FALLING STARS BACKGROUND STARFIELD ---
function initFallingStarsBgStarfield() {
    const canvas = document.getElementById('falling-stars-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);

    // Generate static stars
    const starCount = 120;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 0.7 + 0.3,
            alpha: Math.random() * 0.5 + 0.5,
            twinkle: Math.random() * 0.5 + 0.75
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            // Twinkle effect
            s.alpha += (Math.random() - 0.5) * 0.03;
            s.alpha = Math.max(0.3, Math.min(1, s.alpha));
            ctx.save();
            ctx.globalAlpha = s.alpha * s.twinkle;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.restore();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// --- KEEP LEARNING LOW-POLY LANDSCAPE ---
function initKeepLearningScene() {
    const canvas = document.getElementById('keep-learning-canvas');
    keepLearningCanvas = canvas;
    if (!canvas) {
        console.log('Keep learning canvas not found');
        return;
    }

    console.log('Initializing keep learning scene...');

    // Test if canvas is working with a simple 2D context first
    const testCtx = canvas.getContext('2d');
    if (testCtx) {
        testCtx.fillStyle = 'red';
        testCtx.fillRect(0, 0, 100, 100);
        console.log('Canvas 2D context working');
    }

    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.error('THREE.js not loaded!');
        return;
    }

    console.log('THREE.js available, creating scene...');

    // Three.js setup
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
    });
    keepLearningRenderer = renderer;

    let width = window.innerWidth;
    let height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background

    const scene = new THREE.Scene();
    keepLearningScene = scene;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    keepLearningCamera = camera;
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);

    // Low-poly landscape - simpler version
    const geometry = new THREE.PlaneGeometry(40, 20, 20, 10);
    geometry.rotateX(-Math.PI / 2);

    // Displace vertices for low-poly effect
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        const y = geometry.attributes.position.getY(i);
        let z = geometry.attributes.position.getZ(i);
        let x = geometry.attributes.position.getX(i);

        // Create more dramatic terrain
        let factor = 1.5 - Math.abs(x) / 20;
        let height = (Math.random() - 0.5) * 3 * factor + Math.max(0, z * 0.3);
        geometry.attributes.position.setY(i, y + height);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        flatShading: true,
        roughness: 0.9,
        metalness: 0.1,
        transparent: true,
        opacity: 1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -3;
    scene.add(mesh);

    // Glowing sun/moon - simpler without external texture
    const sunGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(0, 6, -8);
    scene.add(sun);
    keepLearningSun = sun;

    // Add a second larger sphere for glow effect
    const glowGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(sun.position);
    scene.add(glow);

    // Lighting - brighter
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(0, 15, 15);
    scene.add(dirLight);

    // Add some point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight1.position.set(10, 5, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.3, 50);
    pointLight2.position.set(-10, 3, 5);
    scene.add(pointLight2);

    console.log('Scene created, starting animation...');

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Rotate landscape slowly
        mesh.rotation.y = Math.sin(Date.now() * 0.0001) * 0.1;

        // Rotate sun/glow
        sun.rotation.y += 0.005;
        glow.rotation.y += 0.005;

        // Pulse the glow
        glow.material.opacity = 0.1 + Math.sin(Date.now() * 0.003) * 0.1;

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    console.log('Keep learning scene initialized successfully');
}

// --- WORK AS A TEAM SOLAR SYSTEM ---
function initWorkTeamSolarSystem(withSunMesh, sunStartPos) {
    const canvas = document.getElementById('work-team-canvas');
    workTeamCanvas = canvas;
    if (!canvas) return;

    // Three.js setup
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    workTeamRenderer = renderer;
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x111111, 1);

    const scene = new THREE.Scene();
    workTeamScene = scene;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    workTeamCamera = camera;
    camera.position.set(0, 0, 32);
    camera.lookAt(0, 0, 0);

    // Tilt the solar system
    scene.rotation.x = -1.1;

    // Add stars (Points)
    const starCount = 120;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 60;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, opacity: 0.7, transparent: true });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Orbit data (radius, size, color, speed)
    const planets = [
        { radius: 0, size: 3.5, color: 0xffffff, speed: 0 }, // Center
        { radius: 7, size: 1.2, color: 0x888888, speed: 0.18 },
        { radius: 11, size: 0.8, color: 0xffffff, speed: 0.11 },
        { radius: 15, size: 1.7, color: 0x222222, speed: 0.07 },
        { radius: 19, size: 0.9, color: 0x444444, speed: 0.09 }
    ];
    const planetMeshes = [];
    const orbitAngles = [];
    planets.forEach((p, i) => {
        const geo = new THREE.SphereGeometry(p.size, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: p.color });
        const mesh = new THREE.Mesh(geo, mat);
        if (p.radius === 0) {
            mesh.position.set(0, 0, 0);
            mesh.visible = false; // Hide center planet initially
            workTeamCenterPlanet = mesh;
        } else {
            mesh.position.set(p.radius, 0, 0);
        }
        scene.add(mesh);
        planetMeshes.push(mesh);
        orbitAngles.push(Math.random() * Math.PI * 2);
    });
    // Add orbit lines
    planets.forEach((p, i) => {
        if (p.radius === 0) return;
        const segments = 128;
        const orbitGeo = new THREE.BufferGeometry();
        const orbitVerts = [];
        for (let j = 0; j <= segments; j++) {
            const theta = (j / segments) * Math.PI * 2;
            orbitVerts.push(Math.cos(theta) * p.radius, Math.sin(theta) * p.radius, 0);
        }
        orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitVerts, 3));
        const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.13, transparent: true });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        scene.add(orbitLine);
    });

    // If a sun mesh is provided, add it to the scene at the given position
    let mergingSun = null;
    if (withSunMesh && sunStartPos) {
        mergingSun = withSunMesh;
        mergingSun.position.copy(sunStartPos);
        scene.add(mergingSun);
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        // Animate planets
        planets.forEach((p, i) => {
            if (p.radius === 0) return;
            orbitAngles[i] += p.speed * 0.01;
            planetMeshes[i].position.x = Math.cos(orbitAngles[i]) * p.radius;
            planetMeshes[i].position.y = Math.sin(orbitAngles[i]) * p.radius;
        });
        // Subtle rotation for the whole system
        scene.rotation.z += 0.0005;
        renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    // Expose for merge animation
    return { mergingSun, workTeamCenterPlanet, scene, renderer };
}

// --- MERGE ANIMATION ON SECTION VISIBILITY ---
function setupMergeAnimation() {
    const workTeamSection = document.getElementById('work-team-section');
    if (!workTeamSection) return;
    let hasMerged = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasMerged && keepLearningSun) {
                hasMerged = true;
                // Remove Keep Learning scene/canvas and nullify
                if (keepLearningRenderer) keepLearningRenderer.dispose && keepLearningRenderer.dispose();
                if (keepLearningCanvas && keepLearningCanvas.parentNode) keepLearningCanvas.parentNode.removeChild(keepLearningCanvas);
                keepLearningRenderer = null;
                keepLearningScene = null;
                keepLearningCamera = null;
                keepLearningCanvas = null;
                // Move sun mesh to solar system scene after a short delay
                const sunMesh = keepLearningSun;
                const sunStartPos = sunMesh.position.clone();
                setTimeout(() => {
                    const { mergingSun, workTeamCenterPlanet } = initWorkTeamSolarSystem(sunMesh, sunStartPos);
                    // Animate sun mesh to center
                    gsap.to(mergingSun.position, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 1.6,
                        ease: 'power2.inOut',
                    });
                    gsap.to(mergingSun.scale, {
                        x: 2.33,
                        y: 2.33,
                        z: 2.33,
                        duration: 1.6,
                        ease: 'power2.inOut',
                    });
                    // Dramatic flash and scale burst at the end
                    setTimeout(() => {
                        gsap.to(mergingSun.scale, {
                            x: 4.5,
                            y: 4.5,
                            z: 4.5,
                            duration: 0.35,
                            ease: 'power4.out',
                        });
                        if (mergingSun.material) {
                            gsap.to(mergingSun.material, {
                                opacity: 1,
                                duration: 0.15,
                                yoyo: true,
                                repeat: 1,
                                ease: 'power1.inOut',
                            });
                            gsap.to(mergingSun.material, {
                                opacity: 0,
                                delay: 0.18,
                                duration: 0.25,
                                ease: 'power1.in',
                            });
                        }
                    }, 1600);
                    // Show center planet after flash
                    setTimeout(() => {
                        if (workTeamCenterPlanet) workTeamCenterPlanet.visible = true;
                    }, 2000);
                }, 100); // 100ms delay to allow context release
            }
        });
    }, { threshold: 0.4 });
    observer.observe(workTeamSection);
}

// --- 3D CARD REVEAL FOR PROBLEM STATEMENT ---
function init3DTunnelEffect() {
    const problemSection = document.getElementById('problem');
    if (!problemSection) return;

    // Create 3D canvas overlay
    const revealCanvas = document.createElement('canvas');
    revealCanvas.id = 'reveal-canvas';
    revealCanvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
        pointer-events: auto;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    problemSection.style.position = 'relative';
    problemSection.appendChild(revealCanvas);

    const ctx = revealCanvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    revealCanvas.width = width;
    revealCanvas.height = height;

    // Theme cards data with detailed problems
    const themes = [
        {
            title: 'Smart Energy Management',
            color: '#b388ff',
            icon: '⚡',
            description: 'IoT • Machine Learning • Sustainability',
            problem: 'Design an intelligent energy management system that optimizes power consumption in urban buildings using real-time data from IoT sensors. The system should predict energy demand, automatically adjust settings, and provide actionable insights to reduce carbon footprint by at least 30%.',
            challenges: ['Real-time data processing', 'Predictive analytics', 'IoT integration', 'User interface design']
        },
        {
            title: 'Urban Mobility Platform',
            color: '#64ffda',
            icon: '🚗',
            description: 'Real-time Data • Optimization • User Experience',
            problem: 'Create a comprehensive urban mobility platform that integrates public transport, ride-sharing, and micro-mobility options. The platform should provide real-time route optimization, reduce travel time by 25%, and encourage sustainable transportation choices through gamification.',
            challenges: ['Multi-modal routing', 'Real-time optimization', 'Gamification system', 'Mobile app development']
        },
        {
            title: 'Waste Management System',
            color: '#ff6b6b',
            icon: '♻️',
            description: 'Computer Vision • Automation • Analytics',
            problem: 'Develop an AI-powered waste management system that uses computer vision to automatically sort recyclables, track waste generation patterns, and optimize collection routes. The system should increase recycling rates by 40% and reduce operational costs.',
            challenges: ['Computer vision implementation', 'Route optimization', 'Data analytics', 'Automation systems']
        },
        {
            title: 'Community Engagement App',
            color: '#4ecdc4',
            icon: '👥',
            description: 'Social Platform • Gamification • Local Impact',
            problem: 'Build a community engagement platform that connects local residents, businesses, and government to collaborate on neighborhood improvement projects. The app should facilitate communication, track project progress, and measure community impact.',
            challenges: ['Social networking features', 'Project management', 'Impact measurement', 'Community building']
        }
    ];

    // Card positions and states
    const cards = [];
    const problemBoxes = [];
    let isRevealActive = false;
    let revealProgress = 0;
    let selectedCard = null;
    let mouseX = 0, mouseY = 0;

    // Initialize cards in a grid layout
    const cols = 2;
    const rows = 2;
    const cardWidth = 300;
    const cardHeight = 200;
    const spacing = 50;

    for (let i = 0; i < themes.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        cards.push({
            x: (width / 2) - (cardWidth + spacing) / 2 + col * (cardWidth + spacing),
            y: (height / 2) - (cardHeight + spacing) / 2 + row * (cardHeight + spacing),
            z: -1000,
            rotationX: 0,
            rotationY: 0,
            scale: 0,
            opacity: 0,
            theme: themes[i],
            delay: i * 200,
            revealed: false,
            hovered: false,
            clicked: false,
            index: i
        });

        // Initialize problem boxes
        problemBoxes.push({
            x: 0,
            y: 0,
            z: -2000,
            scale: 0,
            opacity: 0,
            rotationY: 0,
            theme: themes[i],
            visible: false,
            animationProgress: 0
        });
    }

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        revealCanvas.width = width;
        revealCanvas.height = height;

        // Update card positions for new size
        cards.forEach((card, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            card.x = (width / 2) - (cardWidth + spacing) / 2 + col * (cardWidth + spacing);
            card.y = (height / 2) - (cardHeight + spacing) / 2 + row * (cardHeight + spacing);
        });
    }
    window.addEventListener('resize', resizeCanvas);

    function project3D(x, y, z) {
        const scale = 1000 / (1000 + z);
        return {
            x: width / 2 + x * scale,
            y: height / 2 + y * scale,
            scale: scale
        };
    }

    function isPointInCard(x, y, card) {
        const projected = project3D(card.x, card.y, card.z);
        const cardWidth = 300 * projected.scale * card.scale;
        const cardHeight = 200 * projected.scale * card.scale;

        return x >= projected.x - cardWidth / 2 &&
            x <= projected.x + cardWidth / 2 &&
            y >= projected.y - cardHeight / 2 &&
            y <= projected.y + cardHeight / 2;
    }

    function handleMouseMove(e) {
        const rect = revealCanvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;

        // Check hover states
        cards.forEach(card => {
            if (card.revealed) {
                card.hovered = isPointInCard(mouseX, mouseY, card);
            }
        });
    }

    function handleClick(e) {
        const rect = revealCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        cards.forEach((card, index) => {
            if (card.revealed && isPointInCard(clickX, clickY, card)) {
                if (selectedCard === card) {
                    // Hide problem box
                    selectedCard = null;
                    problemBoxes[index].visible = false;
                    problemBoxes[index].animationProgress = 0;
                } else {
                    // Show problem box
                    selectedCard = card;
                    problemBoxes[index].visible = true;
                    problemBoxes[index].animationProgress = 0;

                    // Position problem box next to card
                    const projected = project3D(card.x, card.y, card.z);
                    problemBoxes[index].x = projected.x + 200;
                    problemBoxes[index].y = projected.y;
                    problemBoxes[index].z = card.z;
                }
            }
        });
    }

    function handleMouseLeave() {
        // Hide all problem boxes when mouse leaves canvas
        selectedCard = null;
        problemBoxes.forEach(box => {
            box.visible = false;
            box.animationProgress = 0;
        });
    }

    // Add event listeners
    revealCanvas.addEventListener('mousemove', handleMouseMove);
    revealCanvas.addEventListener('click', handleClick);
    revealCanvas.addEventListener('mouseleave', handleMouseLeave);

    function drawCard(card, time) {
        const projected = project3D(card.x, card.y, card.z);

        if (projected.scale > 0.1) {
            ctx.save();

            // Apply transformations
            ctx.translate(projected.x, projected.y);
            ctx.scale(projected.scale * card.scale, projected.scale * card.scale);

            // Add hover effect - reduced for performance
            if (card.hovered && !isLowPerformance) {
                ctx.scale(1.05, 1.05);
                ctx.rotate(card.rotationY + 0.02);
            } else {
                ctx.rotate(card.rotationY);
            }

            // Card shadow - optimized for performance
            ctx.shadowColor = card.theme.color;
            ctx.shadowBlur = card.hovered ? (isLowPerformance ? 15 : 30) : (isLowPerformance ? 10 : 20);
            ctx.shadowOffsetX = card.hovered ? (isLowPerformance ? 8 : 15) : (isLowPerformance ? 5 : 10);
            ctx.shadowOffsetY = card.hovered ? (isLowPerformance ? 8 : 15) : (isLowPerformance ? 5 : 10);

            // Card background
            const gradient = ctx.createLinearGradient(-150, -100, 150, 100);
            gradient.addColorStop(0, card.hovered ? 'rgba(30, 30, 30, 0.95)' : 'rgba(20, 20, 20, 0.95)');
            gradient.addColorStop(1, card.hovered ? 'rgba(50, 50, 50, 0.95)' : 'rgba(40, 40, 40, 0.95)');

            ctx.fillStyle = gradient;
            ctx.strokeStyle = card.theme.color;
            ctx.lineWidth = card.hovered ? 4 : 3;

            // Draw card with rounded corners
            const radius = 15;
            const x = -150;
            const y = -100;
            const w = 300;
            const h = 200;

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Reset shadow for content
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw icon
            ctx.fillStyle = card.theme.color;
            ctx.font = `bold 48px Inter`;
            ctx.textAlign = 'center';
            ctx.fillText(card.theme.icon, 0, -30);

            // Draw title
            ctx.font = `bold 20px Inter`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(card.theme.title, 0, 20);

            // Draw description
            ctx.font = `14px Inter`;
            ctx.fillStyle = '#b0b0b0';
            ctx.fillText(card.theme.description, 0, 50);

            // Click indicator - only show if not in low performance mode
            if (card.hovered && !isLowPerformance) {
                ctx.font = `12px Inter`;
                ctx.fillStyle = card.theme.color;
                ctx.fillText('Click to view details', 0, 80);
            }

            // Reveal glow effect - reduced for performance
            if (card.revealed) {
                ctx.globalAlpha = isLowPerformance ? 0.2 : 0.3;
                ctx.fillStyle = card.theme.color;
                ctx.shadowColor = card.theme.color;
                ctx.shadowBlur = isLowPerformance ? 15 : 30;
                ctx.fillRect(-150, -100, 300, 200);
            }

            ctx.restore();
        }
    }

    function drawProblemBox(box, time) {
        if (!box.visible) return;

        const projected = project3D(box.x, box.y, box.z);

        if (projected.scale > 0.1) {
            ctx.save();

            // Animate box appearance with performance check
            if (!isLowPerformance) {
                box.animationProgress = Math.min(1, box.animationProgress + 0.05);
            } else {
                box.animationProgress = Math.min(1, box.animationProgress + 0.02);
            }
            const progress = Easing.back.out(box.animationProgress);

            ctx.translate(projected.x, projected.y);
            ctx.scale(projected.scale * progress, projected.scale * progress);
            ctx.rotate(box.rotationY);

            // Box shadow - reduced for performance
            ctx.shadowColor = box.theme.color;
            ctx.shadowBlur = isLowPerformance ? 20 : 40;
            ctx.shadowOffsetX = isLowPerformance ? 10 : 20;
            ctx.shadowOffsetY = isLowPerformance ? 10 : 20;

            // Box background
            const gradient = ctx.createLinearGradient(-200, -150, 200, 150);
            gradient.addColorStop(0, 'rgba(10, 10, 10, 0.98)');
            gradient.addColorStop(1, 'rgba(25, 25, 25, 0.98)');

            ctx.fillStyle = gradient;
            ctx.strokeStyle = box.theme.color;
            ctx.lineWidth = 4;

            // Draw box with rounded corners
            const radius = 20;
            const x = -200;
            const y = -150;
            const w = 400;
            const h = 300;

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Reset shadow for content
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw title
            ctx.fillStyle = box.theme.color;
            ctx.font = `bold 24px Inter`;
            ctx.textAlign = 'center';
            ctx.fillText(box.theme.title, 0, -100);

            // Draw problem description - simplified for performance
            ctx.font = `14px Inter`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';

            // Simplified text rendering for better performance
            const maxWidth = 350;
            const lineHeight = 20;
            const words = box.theme.problem.split(' ');
            let line = '';
            let yPos = -60;
            let lineCount = 0;
            const maxLines = isLowPerformance ? 8 : 12; // Limit lines for performance

            words.forEach(word => {
                if (lineCount >= maxLines) return;

                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    ctx.fillText(line, -175, yPos);
                    line = word + ' ';
                    yPos += lineHeight;
                    lineCount++;
                } else {
                    line = testLine;
                }
            });
            if (lineCount < maxLines) {
                ctx.fillText(line, -175, yPos);
            }

            // Draw challenges - simplified
            yPos += 30;
            ctx.font = `bold 16px Inter`;
            ctx.fillStyle = box.theme.color;
            ctx.fillText('Key Challenges:', -175, yPos);

            yPos += 25;
            ctx.font = `14px Inter`;
            ctx.fillStyle = '#b0b0b0';
            const maxChallenges = isLowPerformance ? 3 : 4;
            box.theme.challenges.slice(0, maxChallenges).forEach(challenge => {
                ctx.fillText(`• ${challenge}`, -175, yPos);
                yPos += 20;
            });

            ctx.restore();
        }
    }

    function animate(time) {
        ctx.clearRect(0, 0, width, height);

        // Performance-based animation frequency
        const animationFrequency = isLowPerformance ? 2 : 1;
        const frameCount = Math.floor(time / 16) % animationFrequency;

        if (frameCount === 0) {
            // Animate cards
            cards.forEach((card, index) => {
                const delay = card.delay;
                const elapsed = time - delay;

                if (elapsed > 0) {
                    // Reveal animation
                    const progress = Math.min(1, elapsed / 1000);
                    card.scale = Easing.back.out(progress);
                    card.opacity = progress;
                    card.z = -1000 + progress * 1000;

                    // Add subtle rotation - reduced for performance
                    card.rotationY = Math.sin(progress * Math.PI) * (isLowPerformance ? 0.05 : 0.1);

                    // Mark as revealed after animation
                    if (progress > 0.8) {
                        card.revealed = true;
                    }
                }

                drawCard(card, time);
            });

            // Animate problem boxes
            problemBoxes.forEach(box => {
                drawProblemBox(box, time);
            });
        } else {
            // Just draw without animation updates for performance
            cards.forEach(card => drawCard(card, time));
            problemBoxes.forEach(box => drawProblemBox(box, time));
        }

        if (isRevealActive) {
            requestAnimationFrame(animate);
        }
    }

    // Intersection Observer for reveal activation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isRevealActive = true;
                revealCanvas.style.opacity = '1';
                animate(performance.now());
            } else {
                isRevealActive = false;
                revealCanvas.style.opacity = '0';
            }
        });
    }, { threshold: 0.3 });

    observer.observe(problemSection);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initLoading();
    initFallingStarsStarfield(); // Enable background stars for falling stars section
    initFallingStars(); // ensure falling stars animation runs
    // drawHelloLine(); // removed since we removed the canvas
    // initHeroLinesEffect();
    // initTransitionLinesEffect();
    // initHorizonHero(); // removed to prevent error from missing canvas
    // initWaveToWorkTransition();
    // initFallingStarsBgStarfield();
    // initKeepLearningScene(); // commented out, section removed
    // setupMergeAnimation(); // commented out, section removed
});

// Performance optimization
let ticking = false;

function updateOnScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            // Update any scroll-based animations here
            ticking = false;
        });
        ticking = true;
    }
}

window.addEventListener('scroll', updateOnScroll);

// Handle visibility change for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when tab is not visible
        if (ambientGain) {
            ambientGain.gain.value = 0;
        }
    } else {
        // Resume animations when tab becomes visible
        if (ambientGain && isAudioEnabled) {
            ambientGain.gain.value = 0.2;
        }
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearAmbientMusic();
    if (audioContext) {
        audioContext.close();
    }
});


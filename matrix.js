const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    let tempCanvas = null;
    if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (tempCanvas) {
        ctx.putImageData(tempCanvas, 0, 0);
    }
}

resizeCanvas();

// Configuration for styles
let currentStyle = sessionStorage.getItem('matrixStyle') || 'custom';

// Characters to use in the custom matrix rain (binary + some tech symbols)
const customChars = '01';

// Characters to use in the classic matrix rain
const classicAlphabet = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890";
const classicChars = classicAlphabet.split("");

// Determine initials color based on the current page
function getInitialsColor() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('ap.html')) return 'rgba(239, 68, 68, 0.5)'; // red-500
    if (path.includes('bgp.html')) return 'rgba(168, 85, 247, 0.5)'; // purple-500
    if (path.includes('englisch.html')) return 'rgba(234, 179, 8, 0.5)'; // yellow-500
    if (path.includes('itag.html')) return 'rgba(249, 115, 22, 0.5)'; // orange-500
    if (path.includes('itt.html')) return 'rgba(59, 130, 246, 0.5)'; // blue-500
    if (path.includes('pug.html')) return 'rgba(148, 163, 184, 0.5)'; // slate-400
    if (path.includes('its.html')) return 'rgba(16, 185, 129, 0.5)'; // emerald-500
    return 'rgba(255, 255, 255, 0.4)'; // default white for index.html
}
const initialsColor = getInitialsColor();

let fontSize = currentStyle === 'classic' ? 16 : 14;
let columns = canvas.width / fontSize;
let drops = [];
let lastKpDrop = [];
let activeKPs = [];
let particles = [];

// Create explosion function
function createExplosion(x, y) {
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, // alpha
            decay: Math.random() * 0.05 + 0.02
        });
    }
}

// Draw particles function
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            // Extract rgb from initialsColor to apply dynamic alpha
            const rgbMatch = initialsColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbMatch) {
                ctx.fillStyle = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${p.life})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Initialize drops
const isInitialized = sessionStorage.getItem('matrixInitialized');

function initDrops() {
    fontSize = currentStyle === 'classic' ? 16 : 14;
    columns = canvas.width / fontSize;
    drops = [];
    lastKpDrop = [];

    for (let x = 0; x < columns; x++) {
        lastKpDrop[x] = -100; // Initialize to a negative value so it doesn't block initial spawns
        if (isInitialized) {
            // Random start positions if already visited to pre-fill screen
            drops[x] = Math.random() * (canvas.height / fontSize);
        } else {
            // Start from top on initial load
            drops[x] = 1;
        }
    }
}
initDrops();

if (!isInitialized) {
    sessionStorage.setItem('matrixInitialized', 'true');
}

function draw() {
    if (currentStyle === 'classic') {
        drawClassic();
    } else {
        drawCustom();
    }
    drawParticles();
}

function drawClassic() {
    // Semi-transparent black background to create trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text color to classic matrix green
    ctx.fillStyle = '#0F0';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = classicChars[Math.floor(Math.random() * classicChars.length)];

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    }
}

function drawCustom() {
    // Semi-transparent black background to create trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clean up old activeKPs (older than 3 seconds)
    const now = Date.now();
    activeKPs = activeKPs.filter(kp => now - kp.timestamp < 3000);

    // Indigo/Slate color for the characters, low opacity so it's not distracting
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'; // Indigo-500 with 30% opacity
    ctx.font = fontSize + 'px "Fira Code", monospace';

    for (let i = 0; i < drops.length; i++) {
        // Random character
        let text = customChars.charAt(Math.floor(Math.random() * customChars.length));

        // Ensure distance between K/P blocks
        const minVerticalDistance = 20;
        let isFarEnoughVertically = Math.abs(drops[i] - lastKpDrop[i]) > minVerticalDistance;
        let isFarEnoughHorizontally = true;

        // Check adjacent columns to prevent spawning side-by-side
        if (i > 0 && Math.abs(drops[i] - lastKpDrop[i-1]) < minVerticalDistance) isFarEnoughHorizontally = false;
        if (i < drops.length - 1 && Math.abs(drops[i] - lastKpDrop[i+1]) < minVerticalDistance) isFarEnoughHorizontally = false;

        // Occasionally use initials K on top of P
        if (Math.random() < 0.005 && isFarEnoughVertically && isFarEnoughHorizontally) {
            ctx.fillStyle = initialsColor;
            ctx.fillText('K', i * fontSize, drops[i] * fontSize);
            ctx.fillText('P', i * fontSize, (drops[i] + 1) * fontSize);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'; // Restore normal color
            lastKpDrop[i] = drops[i]; // Update the last drop position

            // Track active K/P pairs
            activeKPs.push({
                col: i,
                row: drops[i],
                timestamp: Date.now()
            });

            drops[i]++; // Skip an extra drop so P isn't immediately overwritten
        } else {
            // Draw the normal character
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }

        // Reset drop to top randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    }
}

// Handle resize properly by resetting columns only if width changes
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
    resizeCanvas();
    if (window.innerWidth !== lastWidth) {
        initDrops();
        lastWidth = window.innerWidth;
    }
});

// If already initialized, simulate drawing frames to populate screen immediately
if (isInitialized) {
    // Fill background black once
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw ahead 50 frames
    for (let i = 0; i < 50; i++) {
        draw();
    }
}

let matrixInterval = null;
let isGlobalPaused = sessionStorage.getItem('matrixPaused') === 'true';
const currentPath = window.location.pathname.toLowerCase();
const isOverviewPage = ['index.html', 'ap.html', 'bgp.html', 'englisch.html', 'itag.html', 'its.html', 'itt.html', 'pug.html', 'einstellungen.html'].some(p => currentPath.endsWith(p)) || currentPath.endsWith('/');
// Automatically paused in tools to avoid distraction, resumes on overview based on global state
let isPaused = isGlobalPaused;

// Populate screen immediately if on tool page and not initialized
if (!isOverviewPage && !isInitialized) {
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 50; i++) {
        draw();
    }
}

function toggleMatrixStyle() {
    currentStyle = currentStyle === 'custom' ? 'classic' : 'custom';
    sessionStorage.setItem('matrixStyle', currentStyle);

    // Update button text if it exists
    const styleBtn = document.getElementById('settings-matrix-style-toggle');
    if (styleBtn) {
        styleBtn.textContent = currentStyle === 'custom' ? 'Wechseln zu Classic' : 'Wechseln zu Custom';
    }

    // Clear canvas and re-init
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    initDrops();
}

function updatePauseButtonIcon() {
    const pauseBtn = document.getElementById('matrix-pause-btn');
    if (!pauseBtn) return;

    if (isPaused) {
        // Play icon
        pauseBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
            </svg>
        `;
    } else {
        // Pause icon
        pauseBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
        `;
    }
}

function togglePause() {
    isGlobalPaused = !isGlobalPaused;
    isPaused = isGlobalPaused;
    sessionStorage.setItem('matrixPaused', isGlobalPaused);
    updatePauseButtonIcon();

    if (isPaused) {
        if (matrixInterval) {
            clearInterval(matrixInterval);
            matrixInterval = null;
        }
    } else {
        if (!matrixInterval) {
            matrixInterval = setInterval(draw, 33);
        }
    }
}

// Start animation if not paused
if (!isPaused) {
    matrixInterval = setInterval(draw, 33);
}

document.addEventListener('DOMContentLoaded', () => {
    const styleBtn = document.getElementById('settings-matrix-style-toggle');
    if (styleBtn) {
        styleBtn.textContent = currentStyle === 'custom' ? 'Wechseln zu Classic' : 'Wechseln zu Custom';
        styleBtn.addEventListener('click', toggleMatrixStyle);
    }

    const pauseBtn = document.getElementById('matrix-pause-btn');
    if (pauseBtn) {
        updatePauseButtonIcon();
        pauseBtn.addEventListener('click', togglePause);
    }
});

// Click event listener for minigame interaction
canvas.addEventListener('click', (event) => {
    // Only active in custom mode
    if (currentStyle !== 'custom') return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // We expand the bounding box slightly to make clicking easier
    const hitPadding = 10;

    for (let i = activeKPs.length - 1; i >= 0; i--) {
        let kp = activeKPs[i];

        const kpX = kp.col * fontSize;
        const kpY1 = kp.row * fontSize; // K
        const kpY2 = (kp.row + 1) * fontSize; // P

        // The overall bounding box for the K/P pair
        const minX = kpX - hitPadding;
        const maxX = kpX + fontSize + hitPadding;
        const minY = kpY1 - fontSize - hitPadding; // text is drawn from bottom-left
        const maxY = kpY2 + hitPadding;

        if (clickX >= minX && clickX <= maxX && clickY >= minY && clickY <= maxY) {
            // Hit detected!
            createExplosion(kpX + fontSize / 2, kpY1);

            // Immediately draw black square over it to visually clear it
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fillRect(kpX, kpY1 - fontSize, fontSize, fontSize * 2.5);

            // Remove from active
            activeKPs.splice(i, 1);

            // Only hit one per click
            break;
        }
    }
});

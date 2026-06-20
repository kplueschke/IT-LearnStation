const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Characters to use in the matrix rain (binary + some tech symbols)
const chars = '01';

// Determine initials color based on the current page
function getInitialsColor() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('ap.html')) return 'rgba(239, 68, 68, 0.3)'; // red-500
    if (path.includes('bgp.html')) return 'rgba(168, 85, 247, 0.3)'; // purple-500
    if (path.includes('englisch.html')) return 'rgba(234, 179, 8, 0.3)'; // yellow-500
    if (path.includes('itag.html')) return 'rgba(249, 115, 22, 0.3)'; // orange-500
    if (path.includes('itt.html')) return 'rgba(59, 130, 246, 0.3)'; // blue-500
    if (path.includes('pug.html')) return 'rgba(180, 83, 9, 0.3)'; // amber-700
    if (path.includes('its.html')) return 'rgba(16, 185, 129, 0.3)'; // emerald-500
    return 'rgba(255, 255, 255, 0.2)'; // default white for index.html
}
const initialsColor = getInitialsColor();
const fontSize = 14;
let columns = canvas.width / fontSize;
let drops = [];

// Initialize drops
const isInitialized = sessionStorage.getItem('matrixInitialized');

function initDrops() {
    for (let x = 0; x < columns; x++) {
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
    // Semi-transparent black background to create trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Indigo/Slate color for the characters, low opacity so it's not distracting
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'; // Indigo-500 with 30% opacity
    ctx.font = fontSize + 'px "Fira Code", monospace';

    for (let i = 0; i < drops.length; i++) {
        // Random character
        let text = chars.charAt(Math.floor(Math.random() * chars.length));

        // Occasionally use initials K on top of P
        if (Math.random() < 0.01) {
            ctx.fillStyle = initialsColor;
            ctx.fillText('K', i * fontSize, drops[i] * fontSize);
            ctx.fillText('P', i * fontSize, (drops[i] + 1) * fontSize);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'; // Restore normal color
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

// Handle resize properly by resetting columns
window.addEventListener('resize', () => {
    columns = canvas.width / fontSize;
    drops = [];
    initDrops();
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

let isMatrixPaused = sessionStorage.getItem('matrixPaused') === 'true';
let matrixInterval = null;

function updatePauseButtonIcon() {
    const btn = document.getElementById('matrix-pause-btn');
    if (!btn) return;
    if (isMatrixPaused) {
        // Play icon
        btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>';
    } else {
        // Pause icon
        btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>';
    }
}

function toggleMatrix() {
    isMatrixPaused = !isMatrixPaused;
    sessionStorage.setItem('matrixPaused', isMatrixPaused.toString());
    updatePauseButtonIcon();

    if (isMatrixPaused) {
        if (matrixInterval) clearInterval(matrixInterval);
    } else {
        matrixInterval = setInterval(draw, 33);
    }
}

// Run animation at ~30 FPS for a calmer effect
if (!isMatrixPaused) {
    matrixInterval = setInterval(draw, 33);
}

document.addEventListener('DOMContentLoaded', () => {
    updatePauseButtonIcon();
    const btn = document.getElementById('matrix-pause-btn');
    if (btn) {
        btn.addEventListener('click', toggleMatrix);
    }
});

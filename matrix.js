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

        // Occasionally use initials K or P
        if (Math.random() < 0.05) {
            text = Math.random() < 0.5 ? 'K' : 'P';
        }

        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

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

// Run animation at ~30 FPS for a calmer effect
setInterval(draw, 33);

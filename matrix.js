const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

let matrixInterval = null;

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

// Start animation
matrixInterval = setInterval(draw, 33);

document.addEventListener('DOMContentLoaded', () => {
    const styleBtn = document.getElementById('settings-matrix-style-toggle');
    if (styleBtn) {
        styleBtn.textContent = currentStyle === 'custom' ? 'Wechseln zu Classic' : 'Wechseln zu Custom';
        styleBtn.addEventListener('click', toggleMatrixStyle);
    }
});

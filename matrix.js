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
    if (path.includes('ap1.html')) return 'rgba(239, 68, 68, 0.5)'; // red-500
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
let minigameScore = parseInt(sessionStorage.getItem('matrixScore') || '0');
let floatingTexts = [];
let crashPhase = 0;

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

// Draw floating texts function
function drawFloatingTexts() {
    ctx.font = 'bold 16px "Fira Code", monospace';
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y -= 1; // Float up
        ft.life -= 0.02; // Fade out

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        } else {
            ctx.fillStyle = `rgba(16, 185, 129, ${ft.life})`; // emerald-500
            ctx.fillText('+1', ft.x, ft.y);
        }
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
    if (crashPhase > 0) {
        drawCrash();
    } else if (currentStyle === 'classic') {
        drawClassic();
    } else {
        drawCustom();
    }
    drawParticles();
    drawFloatingTexts();
}

function drawCrash() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // slightly faster fade
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = initialsColor;
    ctx.font = fontSize + 'px "Fira Code", monospace';

    for (let i = 0; i < drops.length; i++) {
        let text = Math.random() > 0.5 ? 'K' : 'P';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (crashPhase === 1) {
            // Normal reset
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.9) {
                drops[i] = 0;
            }
        }
        // In Phase 2, drops don't reset when they fall off screen

        drops[i] += 1.5; // Fall faster
    }
}

function triggerKPCrash() {
    crashPhase = 1;

    // Phase 2: Drops stop resetting
    setTimeout(() => {
        crashPhase = 2;
    }, 3000);

    // Phase 3: Text Overlay
    setTimeout(() => {
        crashPhase = 3;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease-in-out';
        document.body.appendChild(overlay);

        const textContainer = document.createElement('div');
        textContainer.style.color = '#EF4444'; // red-500 for error
        textContainer.style.fontFamily = '"Fira Code", monospace';
        textContainer.style.fontSize = '3rem';
        textContainer.style.fontWeight = 'bold';
        textContainer.style.textAlign = 'center';
        textContainer.innerHTML = 'FATAL ERROR<br/>KP OVERLOAD';
        // Add glitch effect classes (simulated by simple animation in css or just raw style)
        textContainer.style.animation = 'pulse 0.5s infinite';
        overlay.appendChild(textContainer);

        // Fade in
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 50);

        // Cleanup and Reset
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
                crashPhase = 0;
                ctx.fillStyle = 'rgba(0, 0, 0, 1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                initDrops();
            }, 500);
        }, 3000);

    }, 5000);
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

function updateScoreDisplay() {
    let scoreDisplay = document.getElementById('matrix-score-display');
    if (!scoreDisplay) {
        scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'matrix-score-display';
        scoreDisplay.className = 'fixed top-16 left-4 md:top-4 md:left-1/2 md:-translate-x-1/2 inline-flex items-center justify-center px-4 h-10 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 font-mono text-sm z-50 pointer-events-none transition-opacity duration-300';
        document.body.appendChild(scoreDisplay);
    }

    scoreDisplay.textContent = `Score: ${minigameScore}`;

    if (isGameEnabled && currentStyle === 'custom') {
        scoreDisplay.style.opacity = '1';
    } else {
        scoreDisplay.style.opacity = '0';
    }
}

function toggleMatrixStyle() {
    currentStyle = currentStyle === 'custom' ? 'classic' : 'custom';
    sessionStorage.setItem('matrixStyle', currentStyle);
    updateScoreDisplay();

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

// Game state
let isGameEnabled = sessionStorage.getItem('matrixGameEnabled') !== 'false';

document.addEventListener('DOMContentLoaded', () => {
    const styleBtn = document.getElementById('settings-matrix-style-toggle');
    if (styleBtn) {
        styleBtn.textContent = currentStyle === 'custom' ? 'Wechseln zu Classic' : 'Wechseln zu Custom';
        styleBtn.addEventListener('click', toggleMatrixStyle);
    }

    const gameBtn = document.getElementById('settings-matrix-game-toggle');
    if (gameBtn) {
        gameBtn.textContent = isGameEnabled ? 'Deaktivieren' : 'Aktivieren';
        if (!isGameEnabled) {
            gameBtn.classList.replace('bg-indigo-500/20', 'bg-slate-800');
            gameBtn.classList.replace('text-indigo-400', 'text-slate-400');
            gameBtn.classList.replace('border-indigo-500/30', 'border-slate-700');
        }
        gameBtn.addEventListener('click', () => {
            isGameEnabled = !isGameEnabled;
            sessionStorage.setItem('matrixGameEnabled', isGameEnabled);
            gameBtn.textContent = isGameEnabled ? 'Deaktivieren' : 'Aktivieren';

            if (isGameEnabled) {
                gameBtn.classList.replace('bg-slate-800', 'bg-indigo-500/20');
                gameBtn.classList.replace('text-slate-400', 'text-indigo-400');
                gameBtn.classList.replace('border-slate-700', 'border-indigo-500/30');
            } else {
                gameBtn.classList.replace('bg-indigo-500/20', 'bg-slate-800');
                gameBtn.classList.replace('text-indigo-400', 'text-slate-400');
                gameBtn.classList.replace('border-indigo-500/30', 'border-slate-700');
            }
            updateScoreDisplay();
        });
    }

    const pauseBtn = document.getElementById('matrix-pause-btn');
    if (pauseBtn) {
        updatePauseButtonIcon();
        pauseBtn.addEventListener('click', togglePause);
    }

    updateScoreDisplay();
});

// --- Minigame ---
window.addEventListener('click', (e) => {
    if (!isGameEnabled || isGlobalPaused || currentStyle !== 'custom') return;

    const x = e.clientX;
    const y = e.clientY;

    // Check if clicked near any active K/P
    const clickRadius = fontSize * 3; // Tolerance

    for (let i = activeKPs.length - 1; i >= 0; i--) {
        const kp = activeKPs[i];
        const kpX = kp.col * fontSize;
        const kpY = kp.row * fontSize;

        // Check distance to K or P (P is one row down)
        const distK = Math.hypot(x - kpX, y - kpY);
        const distP = Math.hypot(x - kpX, y - (kpY + fontSize));

        if (distK < clickRadius || distP < clickRadius) {
            // Create explosion at click
            createExplosion(kpX, kpY + (fontSize/2));

            // Score update and floating text
            minigameScore++;
            sessionStorage.setItem('matrixScore', minigameScore.toString());
            floatingTexts.push({ x: kpX, y: kpY, life: 1.0 });
            updateScoreDisplay();

            // Remove the hit block to prevent double-clicking
            activeKPs.splice(i, 1);

            // Check for crash event
            if (minigameScore > 0 && minigameScore % 50 === 0 && crashPhase === 0) {
                triggerKPCrash();
            }

            break;
        }
    }
});

// --- Easter Eggs ---
let neoSequence = '';
const neoTarget = 'neo';
let isNeoActive = false;

window.addEventListener('keydown', (e) => {
    // Ignore if typing in input or textarea
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    // Check for "neo"
    if (e.key && e.key.length === 1) {
        neoSequence += e.key.toLowerCase();
        if (neoSequence.length > neoTarget.length) {
            neoSequence = neoSequence.slice(-neoTarget.length);
        }
        if (neoSequence === neoTarget && !isNeoActive) {
            triggerNeoEasterEgg();
            neoSequence = '';
        }
    }
});

function triggerNeoEasterEgg() {
    isNeoActive = true;
    const wasPaused = isGlobalPaused;

    // Pause matrix globally but don't save to session storage yet
    if (!wasPaused) togglePause();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'black';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 1s ease-in-out';
    document.body.appendChild(overlay);

    const textContainer = document.createElement('div');
    textContainer.style.color = '#0F0';
    textContainer.style.fontFamily = '"Fira Code", monospace';
    textContainer.style.fontSize = '2rem';
    textContainer.style.whiteSpace = 'pre';
    overlay.appendChild(textContainer);

    // Fade in
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);

    const lines = ["Wake up, Neo...", "The Matrix has you..."];
    let lineIndex = 0;
    let charIndex = 0;

    function typeWriter() {
        if (lineIndex < lines.length) {
            if (charIndex < lines[lineIndex].length) {
                textContainer.textContent += lines[lineIndex].charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, 150 + Math.random() * 100); // Random delay for realistic typing
            } else {
                lineIndex++;
                charIndex = 0;
                if (lineIndex < lines.length) {
                    textContainer.textContent += '\n';
                    setTimeout(typeWriter, 1000); // Pause between lines
                } else {
                    // Done typing
                    setTimeout(() => {
                        overlay.style.opacity = '0';
                        // Activate classic matrix rain during fade back if not already active
                        if (currentStyle !== 'classic') {
                            if (typeof toggleMatrixStyle === 'function') {
                                toggleMatrixStyle();
                            }
                        }
                        setTimeout(() => {
                            document.body.removeChild(overlay);
                            if (!wasPaused) togglePause(); // Resume if it was playing
                            isNeoActive = false;
                        }, 1000);
                    }, 3000); // Wait before fade out
                }
            }
        }
    }

    // Start typing after fade in
    setTimeout(typeWriter, 1500);
}
// -------------------

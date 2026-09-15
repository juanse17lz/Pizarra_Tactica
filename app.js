// Canvas setup
let canvas, ctx;

// Game state
let elements = []; // Todos los elementos (jugadores, conos, flechas, áreas)
let frames = [];
let draggedElement = null;
let isDrawing = false;
let drawStart = null;
let currentDraw = null;
let currentMode = 'move'; // 'move', 'arrow', 'area', 'delete'
let currentColor = '#3b82f6'; // Color actual seleccionado
let dragOffset = { x: 0, y: 0 };

// Team colors tracking
let homeTeamColor = null;
let awayTeamColor = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    canvas = document.getElementById('fieldCanvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    
    // Setup event listeners
    setupEventListeners();
    
    // Set initial mode
    setMode('move');
    setCurrentColor('#3b82f6');
    
    // Show notification ad after 5 seconds
    setTimeout(() => {
        const ad = document.getElementById('notification-ad');
        if (ad) ad.classList.remove('hidden');
    }, 5000);
}

// Set canvas size - proportions based on FIFA standard (105m x 68m = 1.544:1)
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 32; // padding
    const containerHeight = window.innerHeight - 250; // reduced space for header
    
    // FIFA standard proportions: 105m x 68m
    const fieldRatio = 105 / 68; // ≈ 1.544
    
    let width = containerWidth;
    let height = width / fieldRatio;
    
    // Check if height exceeds available space
    if (height > containerHeight) {
        height = containerHeight;
        width = height * fieldRatio;
    }
    
    // Ensure minimum size
    if (width < 400) width = 400;
    if (height < 260) height = 260;
    
    canvas.width = width;
    canvas.height = height;
    drawField();
    redrawCanvas();
}

// Classes for different elements
class Player {
    constructor(x, y, type, color = '#3b82f6') {
        this.x = x;
        this.y = y;
        this.type = type; // 'home', 'away', 'ball', 'cone'
        this.color = color;
        this.radius = type === 'ball' ? 10 : (type === 'cone' ? 12 : 20);
        this.elementType = 'player';
    }
    
    draw() {
        ctx.save();
        
        if (this.type === 'home' || this.type === 'away') {
            // Player with 3D effect
            const gradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, this.darkenColor(this.color, 0.3));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(this.x + 2, this.y + this.radius + 3, this.radius * 0.8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'ball') {
            // Soccer ball
            const gradient = ctx.createRadialGradient(this.x - 3, this.y - 3, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, '#e5e7eb');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(this.x + 2, this.y + this.radius + 2, this.radius * 0.8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'cone') {
            // Traffic cone with custom color
            ctx.fillStyle = this.color;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            
            // Cone shape
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 15);
            ctx.lineTo(this.x - 10, this.y + 10);
            ctx.lineTo(this.x + 10, this.y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // White stripe
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(this.x - 5, this.y);
            ctx.lineTo(this.x + 5, this.y);
            ctx.lineTo(this.x + 3, this.y + 5);
            ctx.lineTo(this.x - 3, this.y + 5);
            ctx.closePath();
            ctx.fill();
            
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 12, 10, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius + 5;
    }
    
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
    
    darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.floor(Math.max(0, (num >> 16) - amount * 255));
        const g = Math.floor(Math.max(0, ((num >> 8) & 0x00FF) - amount * 255));
        const b = Math.floor(Math.max(0, (num & 0x0000FF) - amount * 255));
        
        // Convert to hex and pad with zeros if necessary
        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');
        
        return '#' + rHex + gHex + bHex;
    }
}

class Arrow {
    constructor(fromX, fromY, toX, toY, color = '#ef4444') {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.color = color;
        this.elementType = 'arrow';
        // Calculate center for moving
        this.centerX = (fromX + toX) / 2;
        this.centerY = (fromY + toY) / 2;
    }
    
    draw() {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(this.fromX, this.fromY);
        ctx.lineTo(this.toX, this.toY);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(this.toY - this.fromY, this.toX - this.fromX);
        const headLength = 15;
        
        ctx.beginPath();
        ctx.moveTo(this.toX, this.toY);
        ctx.lineTo(
            this.toX - headLength * Math.cos(angle - Math.PI / 6),
            this.toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            this.toX - headLength * Math.cos(angle + Math.PI / 6),
            this.toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    contains(x, y) {
        // Check if point is near the line
        const dist = this.distanceToSegment(x, y, this.fromX, this.fromY, this.toX, this.toY);
        return dist < 10;
    }
    
    distanceToSegment(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq != 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    move(dx, dy) {
        this.fromX += dx;
        this.fromY += dy;
        this.toX += dx;
        this.toY += dy;
        this.centerX += dx;
        this.centerY += dy;
    }
}

class Area {
    constructor(x, y, width, height, color = 'rgba(59, 130, 246, 0.3)') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.elementType = 'area';
    }
    
    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = this.color.replace('0.3', '0.8');
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    
    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}

// Draw football field with premium pattern (FIFA proportions: 105m x 68m)
function drawField() {
    const fieldWidth = canvas.width;
    const fieldHeight = canvas.height;
    const margin = fieldWidth * 0.05; // 5% margin
    const playableWidth = fieldWidth - (margin * 2);
    const playableHeight = fieldHeight - (margin * 2);
    
    // Green field with vertical stripe pattern
    const stripeWidth = fieldWidth / 20; // 20 vertical stripes
    for (let i = 0; i < fieldWidth; i += stripeWidth) {
        const stripeIndex = Math.floor(i / stripeWidth);
        ctx.fillStyle = stripeIndex % 2 === 0 ? '#22a822' : '#2db12d';
        ctx.fillRect(i, 0, stripeWidth, fieldHeight);
    }
    
    // White lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = Math.max(2, fieldWidth * 0.003);
    ctx.lineCap = 'square';
    
    // Border (touchline and goal line)
    ctx.strokeRect(margin, margin, playableWidth, playableHeight);
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(fieldWidth / 2, margin);
    ctx.lineTo(fieldWidth / 2, fieldHeight - margin);
    ctx.stroke();
    
    // Center circle (radius 9.15m from 105m = 9.15/105 ≈ 0.087)
    const centerCircleRadius = playableWidth * 0.087;
    ctx.beginPath();
    ctx.arc(fieldWidth / 2, fieldHeight / 2, centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center spot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(fieldWidth / 2, fieldHeight / 2, fieldWidth * 0.004, 0, Math.PI * 2);
    ctx.fill();
    
    // Penalty areas (16.5m from goal line = 16.5/105 ≈ 0.157)
    // Penalty area width (40.32m from 68m = 40.32/68 ≈ 0.593)
    const penaltyAreaDepth = playableWidth * 0.157;
    const penaltyAreaWidth = playableHeight * 0.593;
    const penaltyAreaY = (fieldHeight - penaltyAreaWidth) / 2;
    
    // Left penalty area
    ctx.strokeRect(margin, penaltyAreaY, penaltyAreaDepth, penaltyAreaWidth);
    
    // Right penalty area
    ctx.strokeRect(fieldWidth - margin - penaltyAreaDepth, penaltyAreaY, penaltyAreaDepth, penaltyAreaWidth);
    
    // Goal areas (5.5m from goal line = 5.5/105 ≈ 0.052)
    // Goal area width (18.32m from 68m = 18.32/68 ≈ 0.269)
    const goalAreaDepth = playableWidth * 0.052;
    const goalAreaWidth = playableHeight * 0.269;
    const goalAreaY = (fieldHeight - goalAreaWidth) / 2;
    
    // Left goal area
    ctx.strokeRect(margin, goalAreaY, goalAreaDepth, goalAreaWidth);
    
    // Right goal area
    ctx.strokeRect(fieldWidth - margin - goalAreaDepth, goalAreaY, goalAreaDepth, goalAreaWidth);
    
    // Penalty spots (11m from goal = 11/105 ≈ 0.105)
    const penaltySpotDistance = playableWidth * 0.105;
    const spotRadius = fieldWidth * 0.003;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(margin + penaltySpotDistance, fieldHeight / 2, spotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(fieldWidth - margin - penaltySpotDistance, fieldHeight / 2, spotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Penalty arcs (radius 9.15m from penalty spot)
    const penaltyArcRadius = centerCircleRadius;
    
    // Calculate the angle where the arc intersects the penalty area line
    // Distance from penalty spot to penalty area line
    const distanceToPenaltyLine = penaltyAreaDepth - penaltySpotDistance;
    // Calculate angle using inverse cosine
    const arcAngle = Math.acos(distanceToPenaltyLine / penaltyArcRadius);
    
    // Left penalty arc (only the part outside the penalty area)
    ctx.beginPath();
    ctx.arc(margin + penaltySpotDistance, fieldHeight / 2, penaltyArcRadius, -arcAngle, arcAngle);
    ctx.stroke();
    
    // Right penalty arc (only the part outside the penalty area)
    ctx.beginPath();
    ctx.arc(fieldWidth - margin - penaltySpotDistance, fieldHeight / 2, penaltyArcRadius, Math.PI - arcAngle, Math.PI + arcAngle);
    ctx.stroke();
    
    // Corner arcs (radius 1m = 1/105 ≈ 0.0095)
    const cornerRadius = playableWidth * 0.0095;
    
    // Top-left corner
    ctx.beginPath();
    ctx.arc(margin, margin, cornerRadius, 0, Math.PI / 2);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.arc(fieldWidth - margin, margin, cornerRadius, Math.PI / 2, Math.PI);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.arc(margin, fieldHeight - margin, cornerRadius, -Math.PI / 2, 0);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.arc(fieldWidth - margin, fieldHeight - margin, cornerRadius, Math.PI, Math.PI * 1.5);
    ctx.stroke();
}

// Redraw entire canvas
function redrawCanvas() {
    drawField();
    
    // Draw all elements
    elements.forEach(element => {
        element.draw();
    });
    
    // Draw current drawing
    if (isDrawing && drawStart && currentDraw) {
        if (currentMode === 'arrow') {
            ctx.save();
            ctx.strokeStyle = currentColor;
            ctx.fillStyle = currentColor;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(drawStart.x, drawStart.y);
            ctx.lineTo(currentDraw.x, currentDraw.y);
            ctx.stroke();
            ctx.restore();
        } else if (currentMode === 'area') {
            ctx.save();
            const width = currentDraw.x - drawStart.x;
            const height = currentDraw.y - drawStart.y;
            ctx.fillStyle = hexToRgba(currentColor, 0.3);
            ctx.fillRect(drawStart.x, drawStart.y, width, height);
            ctx.strokeStyle = hexToRgba(currentColor, 0.8);
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(drawStart.x, drawStart.y, width, height);
            ctx.restore();
        }
    }
}

// Utility function to convert hex to rgba
function hexToRgba(hex, alpha) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16);
    const g = ((num >> 8) & 0x00FF);
    const b = (num & 0x0000FF);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Mode management
function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const btnId = 'btn-' + mode;
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.classList.add('active');
    }
    
    // Update cursor
    if (canvas) {
        switch(mode) {
            case 'move':
                canvas.style.cursor = 'grab';
                break;
            case 'arrow':
                canvas.style.cursor = 'crosshair';
                break;
            case 'area':
                canvas.style.cursor = 'crosshair';
                break;
            case 'delete':
                canvas.style.cursor = 'not-allowed';
                break;
        }
    }
}

// Color management
function setCurrentColor(color) {
    currentColor = color;
    
    // Update button states
    document.querySelectorAll('[id^="color-"]').forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderColor = 'white'
    });
    
    const colorName = {
        '#3b82f6': 'blue',
        '#ef4444': 'red',
        '#22c55e': 'green',
        '#eab308': 'yellow'
    }[color];
    
    const btn = document.getElementById('color-' + colorName);
    if (btn) {
        btn.classList.add('active');
        btn.style.borderColor = '#1d4ed8';
    }
}

// Add element
function addElement(type) {
    if (!canvas) {
        return;
    }
    
    let color = currentColor;
    
    // Check team color restrictions
    if (type === 'home') {
        if (awayTeamColor && currentColor === awayTeamColor) {
            showMessage('⚠️ Color No Disponible', 'Este color ya está siendo usado por el equipo visitante. Por favor elige otro color.', 'warning');
            return;
        }
        homeTeamColor = currentColor;
        color = currentColor;
        updateTeamColorsUI();
    } else if (type === 'away') {
        if (homeTeamColor && currentColor === homeTeamColor) {
            showMessage('⚠️ Color No Disponible', 'Este color ya está siendo usado por el equipo local. Por favor elige otro color.', 'warning');
            return;
        }
        awayTeamColor = currentColor;
        color = currentColor;
        updateTeamColorsUI();
    } else if (type === 'cone') {
        color = currentColor;
    }
    
    const x = canvas.width / 2 + (Math.random() - 0.5) * 100;
    const y = canvas.height / 2 + (Math.random() - 0.5) * 80;
    
    const newElement = new Player(x, y, type, color);
    elements.push(newElement);
    redrawCanvas();
}

// Get mouse/touch position
function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // Mouse/Touch events
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
}

function handleStart(e) {
    e.preventDefault();
    const pos = getPosition(e);
    
    if (currentMode === 'move') {
        // Find clicked element (reverse order for top element)
        for (let i = elements.length - 1; i >= 0; i--) {
            if (elements[i].contains(pos.x, pos.y)) {
                draggedElement = elements[i];
                dragOffset.x = pos.x - elements[i].x;
                dragOffset.y = pos.y - elements[i].y;
                canvas.style.cursor = 'grabbing';
                break;
            }
        }
    } else if (currentMode === 'arrow' || currentMode === 'area') {
        isDrawing = true;
        drawStart = pos;
        currentDraw = pos;
    } else if (currentMode === 'delete') {
        // Find and delete clicked element
        for (let i = elements.length - 1; i >= 0; i--) {
            if (elements[i].contains(pos.x, pos.y)) {
                const deletedElement = elements[i];
                elements.splice(i, 1);
                
                // Check if we need to reset team colors
                checkAndResetTeamColors();
                
                redrawCanvas();
                break;
            }
        }
    }
}

// Check if team colors should be reset when no players of that team exist
function checkAndResetTeamColors() {
    const hasHomePlayer = elements.some(el => el.elementType === 'player' && el.type === 'home');
    const hasAwayPlayer = elements.some(el => el.elementType === 'player' && el.type === 'away');
    
    if (!hasHomePlayer) {
        homeTeamColor = null;
    }
    if (!hasAwayPlayer) {
        awayTeamColor = null;
    }
    
    updateTeamColorsUI();
}

// Update UI to show which colors are assigned to teams
function updateTeamColorsUI() {
    const info = document.getElementById('team-colors-info');
    if (!info) return;
    
    let html = '';
    
    if (homeTeamColor) {
        const colorName = getColorName(homeTeamColor);
        html += `<div class="flex items-center gap-1"><span class="w-3 h-3 rounded-full" style="background-color: ${homeTeamColor}"></span><span class="text-gray-600">Local: ${colorName}</span></div>`;
    }
    
    if (awayTeamColor) {
        const colorName = getColorName(awayTeamColor);
        html += `<div class="flex items-center gap-1"><span class="w-3 h-3 rounded-full" style="background-color: ${awayTeamColor}"></span><span class="text-gray-600">Visitante: ${colorName}</span></div>`;
    }
    
    if (!homeTeamColor && !awayTeamColor) {
        html = '<span class="text-gray-400">Sin colores asignados</span>';
    }
    
    info.innerHTML = html;
}

function getColorName(color) {
    const colorNames = {
        '#3b82f6': 'Azul',
        '#ef4444': 'Rojo',
        '#22c55e': 'Verde',
        '#eab308': 'Amarillo'
    };
    return colorNames[color] || 'Desconocido';
}

function handleMove(e) {
    e.preventDefault();
    const pos = getPosition(e);
    
    if (currentMode === 'move' && draggedElement) {
        draggedElement.x = pos.x - dragOffset.x;
        draggedElement.y = pos.y - dragOffset.y;
        redrawCanvas();
    } else if (isDrawing && (currentMode === 'arrow' || currentMode === 'area')) {
        currentDraw = pos;
        redrawCanvas();
    }
}

function handleEnd(e) {
    e.preventDefault();
    
    if (currentMode === 'move' && draggedElement) {
        draggedElement = null;
        canvas.style.cursor = 'grab';
    } else if (isDrawing && drawStart && currentDraw) {
        if (currentMode === 'arrow') {
            const distance = Math.sqrt(
                Math.pow(currentDraw.x - drawStart.x, 2) + 
                Math.pow(currentDraw.y - drawStart.y, 2)
            );
            
            if (distance > 20) {
                const newArrow = new Arrow(drawStart.x, drawStart.y, currentDraw.x, currentDraw.y, currentColor);
                elements.push(newArrow);
            }
        } else if (currentMode === 'area') {
            const width = currentDraw.x - drawStart.x;
            const height = currentDraw.y - drawStart.y;
            
            if (Math.abs(width) > 20 && Math.abs(height) > 20) {
                const newArea = new Area(drawStart.x, drawStart.y, width, height, hexToRgba(currentColor, 0.3));
                elements.push(newArea);
            }
        }
        
        isDrawing = false;
        drawStart = null;
        currentDraw = null;
        redrawCanvas();
    }
}

// Clear canvas
function clearCanvas() {
    showConfirmation(
        '🗑️ Limpiar Todo',
        '¿Deseas limpiar todo? Se perderán las escenas guardadas y todos los elementos de la cancha.',
        () => {
            elements = [];
            frames = [];
            homeTeamColor = null;
            awayTeamColor = null;
            updateFrameCounter();
            redrawCanvas();
            showMessage('✅ Limpiado', 'La pizarra ha sido limpiada completamente.', 'success');
        }
    );
}

// Animation functions
function saveFrame() {
    const frame = {
        elements: JSON.parse(JSON.stringify(elements.map(e => {
            if (e.elementType === 'player') {
                return { type: 'player', x: e.x, y: e.y, playerType: e.type, color: e.color, radius: e.radius };
            } else if (e.elementType === 'arrow') {
                return { type: 'arrow', fromX: e.fromX, fromY: e.fromY, toX: e.toX, toY: e.toY, color: e.color };
            } else if (e.elementType === 'area') {
                return { type: 'area', x: e.x, y: e.y, width: e.width, height: e.height, color: e.color };
            }
        })))
    };
    frames.push(frame);
    updateFrameCounter();
    
    // Visual feedback
    showMessage('✅ Escena Guardada', `Se guardó la escena ${frames.length}`, 'success');
}

function updateFrameCounter() {
    const counter = document.getElementById('frameCounter');
    if (counter) {
        counter.textContent = `Escenas: ${frames.length}`;
    }
}

async function playAnimation() {
    if (frames.length < 2) {
        showMessage('⚠️ Faltan Escenas', 'Necesitas guardar al menos 2 escenas para ver la animación.', 'warning');
        return;
    }
    
    const steps = 20;
    
    for (let i = 0; i < frames.length - 1; i++) {
        const currentFrame = frames[i];
        const nextFrame = frames[i + 1];
        
        for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            
            // Reconstruct elements with interpolation
            elements = [];
            
            currentFrame.elements.forEach((ce, idx) => {
                if (nextFrame.elements[idx]) {
                    const ne = nextFrame.elements[idx];
                    
                    if (ce.type === 'player') {
                        const x = ce.x + (ne.x - ce.x) * t;
                        const y = ce.y + (ne.y - ce.y) * t;
                        elements.push(new Player(x, y, ce.playerType, ce.color));
                    } else if (ce.type === 'arrow') {
                        elements.push(new Arrow(ce.fromX, ce.fromY, ce.toX, ce.toY, ce.color));
                    } else if (ce.type === 'area') {
                        elements.push(new Area(ce.x, ce.y, ce.width, ce.height, ce.color));
                    }
                } else {
                    // Element doesn't exist in next frame, keep current
                    if (ce.type === 'player') {
                        elements.push(new Player(ce.x, ce.y, ce.playerType, ce.color));
                    } else if (ce.type === 'arrow') {
                        elements.push(new Arrow(ce.fromX, ce.fromY, ce.toX, ce.toY, ce.color));
                    } else if (ce.type === 'area') {
                        elements.push(new Area(ce.x, ce.y, ce.width, ce.height, ce.color));
                    }
                }
            });
            
            redrawCanvas();
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}

// Show message popup
function showMessage(title, text, type = 'info') {
    const popup = document.getElementById('message-popup');
    const icon = document.getElementById('message-icon');
    const titleEl = document.getElementById('message-title');
    const textEl = document.getElementById('message-text');
    const btnContainer = document.getElementById('message-btn-container');
    
    titleEl.textContent = title;
    textEl.textContent = text;
    
    if (type === 'success') {
        icon.textContent = '✅';
    } else if (type === 'warning') {
        icon.textContent = '⚠️';
    } else if (type === 'error') {
        icon.textContent = '❌';
    } else {
        icon.textContent = 'ℹ️';
    }
    
    // Show only accept button
    btnContainer.innerHTML = `
        <button onclick="closeMessagePopup()" class="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 px-4 font-medium transition">
            Aceptar
        </button>
    `;
    
    popup.classList.remove('hidden');
    
    // Auto close success messages
    if (type === 'success') {
        setTimeout(() => {
            closeMessagePopup();
        }, 2000);
    }
}

function closeMessagePopup() {
    document.getElementById('message-popup').classList.add('hidden');
}

// Show confirmation popup with two buttons
function showConfirmation(title, text, onConfirm) {
    const popup = document.getElementById('message-popup');
    const icon = document.getElementById('message-icon');
    const titleEl = document.getElementById('message-title');
    const textEl = document.getElementById('message-text');
    const btnContainer = document.getElementById('message-btn-container');
    
    titleEl.textContent = title;
    textEl.textContent = text;
    icon.textContent = '❓';
    
    // Show confirm and cancel buttons
    btnContainer.innerHTML = `
        <div class="flex gap-3">
            <button onclick="closeMessagePopup()" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg py-3 px-4 font-medium transition">
                Cancelar
            </button>
            <button id="confirm-btn" class="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 px-4 font-medium transition">
                Confirmar
            </button>
        </div>
    `;
    
    popup.classList.remove('hidden');
    
    // Add event listener to confirm button
    document.getElementById('confirm-btn').onclick = () => {
        closeMessagePopup();
        onConfirm();
    };
}

// GIF Export with ad
function showAdAndExportGIF() {
    if (frames.length < 2) {
        showMessage('⚠️ Faltan Escenas', 'Necesitas guardar al menos 2 escenas para exportar un GIF.', 'warning');
        return;
    }
    
    // Show notification ad
    const notifAd = document.getElementById('notification-ad');
    notifAd.classList.remove('hidden');
    
    // Show popup ad
    const popupAd = document.getElementById('popup-ad');
    popupAd.classList.remove('hidden');
    
    // Start GIF generation in background
    setTimeout(() => {
        exportGIF();
    }, 1000);
}

function closeNotificationAd() {
    document.getElementById('notification-ad').classList.add('hidden');
}

function closePopupAd() {
    document.getElementById('popup-ad').classList.add('hidden');
}

async function exportGIF() {
    try {
        if (typeof GIF === 'undefined') {
            throw new Error('GIF.js no está cargado');
        }
        
        const gif = new GIF({
            workers: 1,
            quality: 10,
            width: canvas.width,
            height: canvas.height,
            workerScript: './gif.worker.js'
        });
        
        const steps = 15;
        const savedElements = [...elements]; // Save current state
        
        for (let i = 0; i < frames.length - 1; i++) {
            const currentFrame = frames[i];
            const nextFrame = frames[i + 1];
            
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                
                // Reconstruct elements
                elements = [];
                currentFrame.elements.forEach((ce, idx) => {
                    if (nextFrame.elements[idx]) {
                        const ne = nextFrame.elements[idx];
                        
                        if (ce.type === 'player') {
                            const x = ce.x + (ne.x - ce.x) * t;
                            const y = ce.y + (ne.y - ce.y) * t;
                            elements.push(new Player(x, y, ce.playerType, ce.color));
                        } else if (ce.type === 'arrow') {
                            elements.push(new Arrow(ce.fromX, ce.fromY, ce.toX, ce.toY, ce.color));
                        } else if (ce.type === 'area') {
                            elements.push(new Area(ce.x, ce.y, ce.width, ce.height, ce.color));
                        }
                    } else {
                        if (ce.type === 'player') {
                            elements.push(new Player(ce.x, ce.y, ce.playerType, ce.color));
                        } else if (ce.type === 'arrow') {
                            elements.push(new Arrow(ce.fromX, ce.fromY, ce.toX, ce.toY, ce.color));
                        } else if (ce.type === 'area') {
                            elements.push(new Area(ce.x, ce.y, ce.width, ce.height, ce.color));
                        }
                    }
                });
                
                redrawCanvas();
                gif.addFrame(canvas, { delay: 100, copy: true });
            }
        }
        
        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jugada-tactica-' + Date.now() + '.gif';
            a.click();
            URL.revokeObjectURL(url);
            
            // Restore original state
            elements = savedElements;
            redrawCanvas();
            
            setTimeout(() => {
                closePopupAd();
                showMessage('✅ GIF Descargado', 'Tu animación se ha descargado correctamente.', 'success');
            }, 2000);
        });
        
        gif.on('error', function(error) {
            console.error('GIF generation error:', error);
            closePopupAd();
            showMessage('❌ Error al Generar GIF', 'Ocurrió un error al generar el GIF. Por favor intenta de nuevo.', 'error');
            elements = savedElements;
            redrawCanvas();
        });
        
        gif.render();
        
    } catch (error) {
        console.error('Error generating GIF:', error);
        closePopupAd();
        showMessage('❌ Error al Generar GIF', error.message || 'Por favor intenta de nuevo.', 'error');
    }
}

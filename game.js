class LockGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = this.createPoints();
        this.selectedPoints = [];
        this.targetPoints = [];
        this.isDrawing = false;
        this.currentPos = { x: 0, y: 0 };
        this.difficulty = parseInt(document.getElementById('difficulty').value);
        this.highScores = {
            3: localStorage.getItem('highScore_3') || 0,
            4: localStorage.getItem('highScore_4') || 0,
            5: localStorage.getItem('highScore_5') || 0,
            6: localStorage.getItem('highScore_6') || 0
        };
        this.sequencePoints = [];
        this.bonusPosition = Math.floor(Math.random() * 4) + 1;
        
        this.setupEventListeners();
    }

    createPoints() {
        const points = [];
        const spacing = this.canvas.width / 4;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                points.push({
                    x: spacing + j * spacing,
                    y: spacing + i * spacing,
                    id: i * 3 + j
                });
            }
        }
        return points;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        });
    }

    handleStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const point = this.findNearestPoint(x, y);
        if (point) {
            this.isDrawing = true;
            this.selectedPoints = [point];
            this.currentPos = { x: point.x, y: point.y };
            this.draw();
        }
    }

    handleMove(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.currentPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        const point = this.findNearestPoint(this.currentPos.x, this.currentPos.y);
        if (point && !this.selectedPoints.includes(point)) {
            this.selectedPoints.push(point);
        }
        
        this.draw();
    }

    handleEnd() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.checkPattern();
        this.draw();
    }

    findNearestPoint(x, y) {
        const threshold = 20;
        return this.points.find(point => {
            const distance = Math.sqrt(
                Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
            );
            return distance < threshold;
        });
    }

    getPointPosition(id) {
        return {
            row: Math.floor(id / 3),
            col: id % 3
        };
    }

    calculateComplexity() {
        let complexity = 0;
        for (let i = 0; i < this.selectedPoints.length - 1; i++) {
            const current = this.selectedPoints[i];
            const next = this.selectedPoints[i + 1];
            
            const currentPos = this.getPointPosition(current.id);
            const nextPos = this.getPointPosition(next.id);
            
            const rowDiff = Math.abs(currentPos.row - nextPos.row);
            const colDiff = Math.abs(currentPos.col - nextPos.col);
            
            let stepComplexity = rowDiff + colDiff;
            
            if (this.difficulty === 6 && (i + 1) === this.bonusPosition) {
                stepComplexity *= 2;
            }
            
            complexity += stepComplexity;
        }
        return complexity;
    }

    checkPattern() {
        const selectedIds = this.selectedPoints.map(p => p.id);
        const targetIds = this.targetPoints.map(p => p.id);
        
        const hasInvalidPoint = this.selectedPoints.some(point => !this.targetPoints.includes(point));
        
        const containsAllTargets = targetIds.every(id => selectedIds.includes(id));
        
        if (hasInvalidPoint || !containsAllTargets) {
            document.getElementById('complexity').textContent = '无效路线';
            return;
        }
        
        const complexity = this.calculateComplexity();
        document.getElementById('complexity').textContent = complexity;
        
        this.difficulty = parseInt(document.getElementById('difficulty').value);
        if (complexity > this.highScores[this.difficulty]) {
            this.highScores[this.difficulty] = complexity;
            localStorage.setItem(`highScore_${this.difficulty}`, complexity);
            document.getElementById('highScore').textContent = complexity;
            alert('新纪录！');
        }
    }

    calculateStepComplexity(current, next, stepIndex) {
        if (!this.targetPoints.includes(current) || !this.targetPoints.includes(next)) {
            return 0;
        }
        
        const currentPos = this.getPointPosition(current.id);
        const nextPos = this.getPointPosition(next.id);
        
        const rowDiff = Math.abs(currentPos.row - nextPos.row);
        const colDiff = Math.abs(currentPos.col - nextPos.col);
        
        let stepComplexity = rowDiff + colDiff;
        
        if (this.difficulty === 6 && stepIndex === this.bonusPosition) {
            stepComplexity *= 2;
        }
        
        return stepComplexity;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.points.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
            
            if (this.targetPoints.includes(point)) {
                this.ctx.fillStyle = 'red';
            } else {
                this.ctx.fillStyle = '#666';
            }
            this.ctx.fill();
        });
        
        if (this.selectedPoints.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.selectedPoints[0].x, this.selectedPoints[0].y);
            
            for (let i = 0; i < this.selectedPoints.length - 1; i++) {
                const current = this.selectedPoints[i];
                const next = this.selectedPoints[i + 1];
                this.ctx.lineTo(next.x, next.y);
                
                const stepComplexity = this.calculateStepComplexity(current, next, i + 1);
                
                if (stepComplexity > 0) {
                    const midX = (current.x + next.x) / 2;
                    const midY = (current.y + next.y) / 2;
                    
                    const dx = next.x - current.x;
                    const dy = next.y - current.y;
                    
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const perpX = -dy / length;
                    const perpY = dx / length;
                    
                    const offset = 15;
                    const textX = midX + perpX * offset;
                    const textY = midY + perpY * offset;
                    
                    this.ctx.save();
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    
                    const text = stepComplexity.toString();
                    const padding = 2;
                    const metrics = this.ctx.measureText(text);
                    const textHeight = 14;
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(
                        textX - metrics.width/2 - padding,
                        textY - textHeight/2 - padding,
                        metrics.width + padding*2,
                        textHeight + padding*2
                    );
                    
                    this.ctx.fillStyle = this.difficulty === 6 && (i + 1) === this.bonusPosition ? '#e74c3c' : '#2980b9';
                    this.ctx.fillText(text, textX, textY);
                    this.ctx.restore();
                }
            }
            
            if (this.isDrawing) {
                this.ctx.lineTo(this.currentPos.x, this.currentPos.y);
            }
            
            this.ctx.strokeStyle = '#0066cc';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    setTargetPoints(count) {
        this.difficulty = count;
        this.targetPoints = [];
        this.selectedPoints = [];
        this.isDrawing = false;
        
        const targetCount = count === 6 ? 5 : count;
        while (this.targetPoints.length < targetCount) {
            const randomPoint = this.points[Math.floor(Math.random() * this.points.length)];
            if (!this.targetPoints.includes(randomPoint)) {
                this.targetPoints.push(randomPoint);
            }
        }
        
        if (count === 6) {
            this.bonusPosition = Math.floor(Math.random() * 4) + 1;
        }
        
        document.getElementById('complexity').textContent = '0';
        document.getElementById('highScore').textContent = this.highScores[this.difficulty];
        
        if (count === 6) {
            document.getElementById('targetPoints').textContent = 
                `${this.targetPoints.map(p => p.id + 1).join(', ')} (第${this.bonusPosition}步双倍分数)`;
        } else {
            document.getElementById('targetPoints').textContent = 
                this.targetPoints.map(p => p.id + 1).join(', ');
        }
        
        this.draw();
    }
}

let game;

function startNewGame() {
    if (!game) {
        game = new LockGame(document.getElementById('gameCanvas'));
    }
    const difficulty = parseInt(document.getElementById('difficulty').value);
    game.setTargetPoints(difficulty);
}

window.onload = startNewGame; 
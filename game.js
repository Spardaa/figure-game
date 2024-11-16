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
        this.isDaily = false;
        this.canStartNewAttempt = true;
        this.particles = [];
        
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
        if (!this.canStartNewAttempt) return;
        
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

    calculateStepComplexity(current, next, stepIndex) {
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

    calculatePathComplexity(path, bonusPosition = this.bonusPosition) {
        let complexity = 0;
        for (let i = 0; i < path.length - 1; i++) {
            complexity += this.calculateStepComplexity(path[i], path[i + 1], i + 1);
        }
        return complexity;
    }

    checkPattern() {
        const selectedIds = this.selectedPoints.map(p => p.id);
        const targetIds = this.targetPoints.map(p => p.id);
        
        const hasInvalidPoint = this.selectedPoints.some(point => !this.targetPoints.includes(point));
        const containsAllTargets = targetIds.every(id => selectedIds.includes(id));
        
        if (hasInvalidPoint || !containsAllTargets) {
            if (this.isDaily) {
                document.getElementById('dailyComplexity').textContent = '无效路线';
            } else {
                document.getElementById('complexity').textContent = '无效路线';
            }
            return;
        }
        
        const complexity = this.calculatePathComplexity(this.selectedPoints);
        
        if (this.isDaily) {
            const dailySeed = this.getDailySeed();
            const attempts = parseInt(localStorage.getItem(`dailyAttempts_${dailySeed}`) || 0) + 1;
            localStorage.setItem(`dailyAttempts_${dailySeed}`, attempts);
            document.getElementById('dailyAttempts').textContent = attempts;
            document.getElementById('dailyComplexity').textContent = complexity;

            const dailyHighScore = parseInt(localStorage.getItem(`dailyHighScore_${dailySeed}`) || 0);
            const maxScore = this.calculateMaxScore();
            
            if (complexity >= maxScore) {
                this.createParticles();
                alert(`太棒了！你完成了今天的挑战！\n你达到了理论最高分 ${maxScore}！`);
            }
            
            if (complexity > dailyHighScore) {
                localStorage.setItem(`dailyHighScore_${dailySeed}`, complexity);
                document.getElementById('dailyHighScore').textContent = complexity;
            }
            
            this.canStartNewAttempt = false;
            document.getElementById('dailyChallengeBtn').textContent = '再试一次';
        } else {
            document.getElementById('complexity').textContent = complexity;
            
            const maxScore = this.calculateMaxScore();
            
            this.difficulty = parseInt(document.getElementById('difficulty').value);
            if (complexity > this.highScores[this.difficulty]) {
                this.highScores[this.difficulty] = complexity;
                localStorage.setItem(`highScore_${this.difficulty}`, complexity);
                document.getElementById('highScore').textContent = complexity;
                
                if (complexity >= maxScore) {
                    document.getElementById('maxScoreText').style.display = 'block';
                    document.getElementById('maxScore').textContent = maxScore;
                    alert('恭喜！你达到了本局理论最高分！');
                } else {
                    alert('新纪录！');
                }
            } else if (complexity >= maxScore) {
                document.getElementById('maxScoreText').style.display = 'block';
                document.getElementById('maxScore').textContent = maxScore;
                alert('恭喜！你达到了本局理论最高分！');
            }
        }
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
                
                if (this.targetPoints.includes(current) && this.targetPoints.includes(next)) {
                    const stepComplexity = this.calculateStepComplexity(current, next, i + 1);
                    
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
        
        document.getElementById('maxScoreText').style.display = 'none';
    }

    calculateMaxScore() {
        const allPaths = this.generateAllPaths(this.targetPoints);
        let maxScore = 0;
        
        if (this.difficulty === 6) {
            for (const path of allPaths) {
                const score = this.calculatePathComplexity(path, this.bonusPosition);
                maxScore = Math.max(maxScore, score);
            }
        } else {
            for (const path of allPaths) {
                const score = this.calculatePathComplexity(path);
                maxScore = Math.max(maxScore, score);
            }
        }
        
        return maxScore;
    }

    getDailySeed() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    setDailyTargetPoints() {
        this.isDaily = true;
        this.difficulty = 6;
        this.targetPoints = [];
        this.selectedPoints = [];
        this.isDrawing = false;
        this.canStartNewAttempt = true;

        // 检查并清除旧的记录
        const currentDate = this.getDailySeed();
        const lastPlayedDate = localStorage.getItem('lastPlayedDate');
        
        if (lastPlayedDate !== currentDate) {
            localStorage.removeItem(`dailyAttempts_${lastPlayedDate}`);
            localStorage.removeItem(`dailyHighScore_${lastPlayedDate}`);
            localStorage.setItem('lastPlayedDate', currentDate);
        }

        let seed = 0;
        const dailySeed = this.getDailySeed();
        for (let i = 0; i < dailySeed.length; i++) {
            seed += dailySeed.charCodeAt(i);
        }

        // 修改为生成6个目标点
        const usedIndices = new Set();
        while (this.targetPoints.length < 6) {  // 改为6个点
            seed++;
            const index = Math.floor(this.seededRandom(seed) * 9);
            if (!usedIndices.has(index)) {
                usedIndices.add(index);
                this.targetPoints.push(this.points[index]);
            }
        }

        // 设置加倍步骤（现在是5步，所以范围是1-5）
        this.bonusPosition = 1 + Math.floor(this.seededRandom(seed + 100) * 5);  // 改为1-5

        // 计算并显示理论最高分
        const maxScore = this.calculateMaxScore();
        document.getElementById('dailyMaxScore').textContent = maxScore || 0;

        // 显示目标点
        document.getElementById('dailyTargetPoints').textContent = 
            `${this.targetPoints.map(p => p.id + 1).join(', ')} (第${this.bonusPosition}步双倍分数)`;
        
        // 获取并显示今日尝试次数
        const attempts = parseInt(localStorage.getItem(`dailyAttempts_${currentDate}`) || 0);
        document.getElementById('dailyAttempts').textContent = attempts;
        document.getElementById('dailyChallengeBtn').textContent = attempts > 0 ? '再试一次' : '开始挑战';

        // 获取并显示今日最高分
        const dailyHighScore = parseInt(localStorage.getItem(`dailyHighScore_${currentDate}`) || 0);
        document.getElementById('dailyHighScore').textContent = dailyHighScore;

        // 清除当前复杂度显示
        document.getElementById('dailyComplexity').textContent = '0';

        this.draw();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                life: 100
            });
        }
        this.animateParticles();
    }

    animateParticles() {
        if (this.particles.length === 0) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();  // 先绘制游戏基本内容

        // 更新和绘制粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        }

        if (this.particles.length > 0) {
            requestAnimationFrame(this.animateParticles.bind(this));
        }
    }

    // 添加生成所有可能路径的方法
    generateAllPaths(points, path = [], paths = []) {
        if (points.length === 0) {
            paths.push([...path]);
            return paths;
        }
        
        for (let i = 0; i < points.length; i++) {
            const current = points[i];
            const remaining = points.filter((_, index) => index !== i);
            path.push(current);
            this.generateAllPaths(remaining, path, paths);
            path.pop();
        }
        return paths;
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

function switchToNormalMode() {
    document.getElementById('normalMode').style.display = 'block';
    document.getElementById('dailyMode').style.display = 'none';
    document.getElementById('normalModeBtn').classList.add('active');
    document.getElementById('dailyModeBtn').classList.remove('active');
    startNewGame();
}

function switchToDailyMode() {
    document.getElementById('normalMode').style.display = 'none';
    document.getElementById('dailyMode').style.display = 'block';
    document.getElementById('normalModeBtn').classList.remove('active');
    document.getElementById('dailyModeBtn').classList.add('active');
    startDailyChallenge();
}

function startDailyChallenge() {
    if (!game) {
        game = new LockGame(document.getElementById('gameCanvas'));
    }
    game.setDailyTargetPoints();
}

window.onload = function() {
    startNewGame();
    const difficulty = parseInt(document.getElementById('difficulty').value);
    const highScore = localStorage.getItem(`highScore_${difficulty}`) || 0;
    document.getElementById('highScore').textContent = highScore;
} 
const TILE_SIZE = 32;

const levelMaps = [
    // World 1-1 (Easy)
    [
        ".................................................................................",
        ".................................................................................",
        ".................................................................................",
        ".................................................................................",
        "..........................?......................................................",
        ".......................................M.........c.............................F.",
        "....................c.?.#.M.....................###............................|.",
        "...................###.....................g...............S....g...k..........|.",
        "..........c......................##.......###.............###..###.............|.",
        ".....g...###....................###............................................|.",
        "...............................####............................................|.",
        "#########################...#####################################################",
        "#########################...#####################################################"
    ],
    // World 1-2 (Jumps & Enemies)
    [
        ".................................................................................",
        ".................................................................................",
        ".................................................................................",
        ".....................................M........................................F..",
        "..................?...###..........####.......................................|..",
        "............................g......................c.c.c......................|..",
        "..........#.#.M............###.....................#####..........k...........|..",
        ".........................................##......................###..........|..",
        ".....k.............................g....####................g.................|..",
        "...#####.........####............####..######..............###................|..",
        "..............................................................................|..",
        "#########...###.........######..................#######..........################",
        "#########...###.........######..................#######..........################"
    ],
    // World 1-3 (Harder)
    [
        ".................................................................................",
        ".................................................................................",
        "................................................S................................",
        ".............................M.................###............................F..",
        "..................c.c.c.....###...............................................|..",
        "..................#####...................k...................#...............|..",
        ".........................................###.................##...............|..",
        "...........k...................g....................g.......###...............|..",
        "..........###.................###..................###.....####...............|..",
        "..........................................................#####...............|..",
        ".........................................................######...............|..",
        "#######.........#####....................####...######..#######..################",
        "#######.........#####....................####...######..#######..################"
    ]
];

class Level {
    constructor(levelIndex) {
        this.index = levelIndex;
        this.map = [];
        this.width = 0;
        this.height = 0;
        this.startX = 50;
        this.startY = 100;
        this.enemies = [];
        this.particles = [];
        this.items = [];
        this.parseLevel(levelMaps[levelIndex]);
    }

    parseLevel(mapData) {
        this.height = mapData.length * TILE_SIZE;
        this.width = mapData[0].length * TILE_SIZE;
        
        for (let y = 0; y < mapData.length; y++) {
            let row = [];
            for (let x = 0; x < mapData[y].length; x++) {
                const char = mapData[y][x];
                let block = null;
                
                if (char === '#') block = { type: 'ground' };
                else if (char === '?') block = { type: 'question', item: 'coin', used: false };
                else if (char === 'M') block = { type: 'question', item: 'mushroom', used: false };
                else if (char === 'S') block = { type: 'question', item: 'star', used: false };
                else if (char === 'c') block = { type: 'coin' };
                else if (char === 'F') block = { type: 'flagtop' };
                else if (char === '|') block = { type: 'flagpole' };
                else if (char === 'g') {
                    this.enemies.push(new Goomba(x * TILE_SIZE, y * TILE_SIZE));
                } else if (char === 'k') {
                    this.enemies.push(new Koopa(x * TILE_SIZE, y * TILE_SIZE));
                }
                row.push(block);
            }
            this.map.push(row);
        }
    }

    getBlock(x, y) {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        if (col < 0 || col >= this.map[0].length || row < 0 || row >= this.map.length) return null;
        return this.map[row][col];
    }

    setBlock(x, y, block) {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        if (col >= 0 && col < this.map[0].length && row >= 0 && row < this.map.length) {
            this.map[row][col] = block;
        }
    }

    draw(ctx, cameraX) {
        const startCol = Math.floor(cameraX / TILE_SIZE);
        const endCol = startCol + (800 / TILE_SIZE) + 1;

        for (let y = 0; y < this.map.length; y++) {
            for (let x = Math.max(0, startCol); x < Math.min(this.map[0].length, endCol); x++) {
                const block = this.map[y][x];
                if (!block) continue;
                
                const px = x * TILE_SIZE - cameraX;
                const py = y * TILE_SIZE;

                if (block.type === 'ground') {
                    ctx.fillStyle = '#C84C0C';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#00A800';
                    ctx.fillRect(px, py, TILE_SIZE, 4);
                } else if (block.type === 'question') {
                    ctx.fillStyle = block.used ? '#888' : '#F8B800';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#000';
                    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                    if (!block.used) {
                        ctx.fillStyle = '#000';
                        ctx.font = '20px Arial';
                        ctx.fillText('?', px + 10, py + 24);
                    }
                } else if (block.type === 'coin') {
                    ctx.fillStyle = '#F8D820';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 10, 0, Math.PI*2);
                    ctx.fill();
                } else if (block.type === 'flagpole') {
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(px + 14, py, 4, TILE_SIZE);
                } else if (block.type === 'flagtop') {
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(px + 14, py, 4, TILE_SIZE);
                    ctx.fillStyle = '#00A800';
                    ctx.beginPath();
                    ctx.arc(px + 16, py + 8, 8, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }

        // Draw items (Mushrooms/Stars)
        this.items.forEach(item => {
            if (item.type === 'mushroom') {
                ctx.fillStyle = '#F83800';
                ctx.fillRect(item.x - cameraX, item.y, item.w, item.h);
                ctx.fillStyle = '#FFF';
                ctx.fillRect(item.x - cameraX + 4, item.y + 4, 6, 6);
                ctx.fillRect(item.x - cameraX + 22, item.y + 4, 6, 6);
            } else if (item.type === 'star') {
                ctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? '#F8D820' : '#FFF';
                ctx.fillRect(item.x - cameraX, item.y, item.w, item.h);
            }
        });

        // Draw Enemies
        this.enemies.forEach(enemy => enemy.draw(ctx, cameraX));
    }

    update(dt) {
        this.enemies.forEach(enemy => enemy.update(dt, this));
        this.enemies = this.enemies.filter(e => !e.dead);
        
        this.items.forEach(item => {
            item.vy += 1000 * dt; // gravity
            item.y += item.vy * dt;
            if (item.type === 'mushroom' || item.type === 'star') {
                item.x += item.vx * dt;
                // Basic horizontal collision
                const centerCol = Math.floor((item.x + item.w/2)/TILE_SIZE);
                const botRow = Math.floor((item.y + item.h - 1)/TILE_SIZE);
                if (this.getBlock(item.x + (item.vx>0?item.w:0), item.y + item.h/2)) item.vx *= -1;
                // Basic floor collision
                if (this.getBlock(item.x + item.w/2, item.y + item.h)) {
                    item.y = botRow * TILE_SIZE - item.h;
                    item.vy = 0;
                    if (item.type === 'star') item.vy = -300; // Bounce
                }
            }
        });
    }

    spawnItem(x, y, type) {
        this.items.push({ x: x, y: y - TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE, vx: 100, vy: -200, type: type });
    }
}

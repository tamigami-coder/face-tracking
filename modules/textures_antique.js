/**
 * THE LOST BOX - Texture Generator
 * Canvas2Dを使用して木箱の各面のテクスチャを動的に生成します。
 */

class TextureGenerator {
    constructor() {
        this.size = 1024;
    }

    /**
     * 木目のベースを描画
     */
    drawWoodBase(ctx) {
        const size = this.size;
        // 背景色
        ctx.fillStyle = '#4a2f24';
        ctx.fillRect(0, 0, size, size);

        // 木目の筋
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < 200; i++) {
            ctx.lineWidth = Math.random() * 5;
            ctx.beginPath();
            const x = Math.random() * size;
            ctx.moveTo(x, 0);
            ctx.bezierCurveTo(
                x + (Math.random() - 0.5) * 100, size * 0.3,
                x + (Math.random() - 0.5) * 100, size * 0.7,
                x + (Math.random() - 0.5) * 50, size
            );
            ctx.stroke();
        }

        // 角の金具（縁取り）
        ctx.fillStyle = '#222'; // 鉄
        const edge = 60;
        ctx.fillRect(0, 0, size, edge); // Top
        ctx.fillRect(0, size - edge, size, edge); // Bottom
        ctx.fillRect(0, 0, edge, size); // Left
        ctx.fillRect(size - edge, 0, edge, size); // Right

        // ネジ
        ctx.fillStyle = '#555';
        const drawScrew = (x, y) => {
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 10, y);
            ctx.lineTo(x + 10, y);
            ctx.stroke();
        };
        drawScrew(30, 30);
        drawScrew(size - 30, 30);
        drawScrew(30, size - 30);
        drawScrew(size - 30, size - 30);
    }

    /**
     * 正面: 星座（7個の点）
     */
    generateFront() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawWoodBase(ctx);

        // 星座
        ctx.fillStyle = '#ffcc88';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffcc88';
        
        const stars = [
            [300, 300], [500, 250], [700, 350], [600, 500],
            [400, 600], [250, 450], [500, 400]
        ];
        
        stars.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        });

        // かすかな線
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 204, 136, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(stars[0][0], stars[0][1]);
        for(let i=1; i<stars.length; i++) ctx.lineTo(stars[i][0], stars[i][1]);
        ctx.closePath();
        ctx.stroke();

        return canvas;
    }

    /**
     * 右面: アナモルフォーシス「3」
     */
    generateRight() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawWoodBase(ctx);

        ctx.strokeStyle = '#111';
        ctx.lineWidth = 15;
        
        // 歪んだ「3」
        // 正面（特定の角度）から見たときだけ「3」に見えるように、横に引き伸ばす
        ctx.save();
        ctx.translate(512, 512);
        ctx.scale(0.5, 2.0); // 縦に引き伸ばし、横に縮める（斜めから見ると正しくなる）
        
        ctx.font = 'bold 600px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('3', 0, 0);
        ctx.restore();

        // 飾り線（カモフラージュ）
        for(let i=0; i<10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random()*1024, 0);
            ctx.lineTo(Math.random()*1024, 1024);
            ctx.stroke();
        }

        return canvas;
    }

    /**
     * 左面: モザイクと「5」
     */
    generateLeft() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawWoodBase(ctx);

        // 2色のモザイクの境界線が「5」を描く
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        // 5の形を塗りつぶす
        ctx.font = 'bold 800px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('5', 512, 512);

        // 上からモザイク状のテクスチャを重ねる
        ctx.globalCompositeOperation = 'source-atop';
        for(let i=0; i<20; i++) {
            for(let j=0; j<20; j++) {
                ctx.fillStyle = (i+j)%2 === 0 ? 'rgba(80,40,20,0.5)' : 'rgba(40,20,10,0.5)';
                ctx.fillRect(i*52, j*52, 52, 52);
            }
        }

        return canvas;
    }

    /**
     * 上面: 古地図と「2」
     */
    generateTop() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawWoodBase(ctx);

        // 地図のグリッド
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 5;
        for(let i=1; i<4; i++) {
            ctx.beginPath(); ctx.moveTo(i*256, 0); ctx.lineTo(i*256, 1024); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i*256); ctx.lineTo(1024, i*256); ctx.stroke();
        }

        // 「X」マーク
        ctx.strokeStyle = '#c00';
        ctx.lineWidth = 20;
        const x = 256 + 128; // 2列目
        const y = 128; // 1行目
        ctx.beginPath();
        ctx.moveTo(x-50, y-50); ctx.lineTo(x+50, y+50);
        ctx.moveTo(x+50, y-50); ctx.lineTo(x-50, y+50);
        ctx.stroke();

        ctx.fillStyle = '#111';
        ctx.font = 'italic 40px serif';
        ctx.fillText('The Second Key', 100, 100);

        return canvas;
    }

    /**
     * 背面 / 底面: 通常の木目
     */
    generatePlain() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawWoodBase(ctx);
        return canvas;
    }
}

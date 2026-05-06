/**
 * THE LOST BOX - Modern Texture Generator
 * Canvas2Dを使用してモダンな質感とパズルを描画します。
 */

class TextureGenerator {
    constructor() {
        this.size = 1024;
    }

    /**
     * モダンなベース（マットブラック・カーボン調）を描画
     */
    drawModernBase(ctx) {
        const size = this.size;
        
        // ベースカラー（洗練されたグレー / スペースグレイ調）
        ctx.fillStyle = '#6c6c75';
        ctx.fillRect(0, 0, size, size);

        // 微細なカーボン/グリッドパターン
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        const step = 32;
        for (let i = 0; i <= size; i += step) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
        }

        // シャープなエッジ（ネオンブルーのハイライト）
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, size - 4, size - 4);
        
        // 四隅のサイバーなネジ穴
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#444';
        const drawScrew = (x, y) => {
            ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#0a0a0c'; ctx.fill();
        };
        drawScrew(40, 40); drawScrew(size - 40, 40);
        drawScrew(40, size - 40); drawScrew(size - 40, size - 40);
    }

    /**
     * 裏世界（異世界）のベース（深紫・発光ノイズ）を描画
     */
    drawReverseBase(ctx) {
        const size = this.size;
        
        // ベースカラー（深紫）
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(0, 0, size, size);

        // サイバーな光の脈（青白いノイズ線）
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * size, 0);
            ctx.lineTo(Math.random() * size, size);
            ctx.stroke();
        }

        // 発光するエッジ
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f0ff';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, size - 4, size - 4);
        ctx.shadowBlur = 0;
    }


    /**
     * 謎を解く順番を示すマークを右下に描画
     */
    drawOrderMark(ctx, text) {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '600 40px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        // ネジ穴（size-40付近）と被らないように少し内側に配置
        ctx.fillText(text, this.size - 80, this.size - 80);
        ctx.restore();
    }

    /**
     * ブラックライトで浮かび上がる隠し数字を中央に描画（Stage 2用）
     */
    drawHiddenDigit(ctx, digit) {
        ctx.save();
        // 蛍光色（黄緑）を極めて低い不透明度で描画
        ctx.fillStyle = 'rgba(120, 255, 0, 0.05)';
        ctx.font = 'bold 400px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(digit, this.size / 2, this.size / 2);
        ctx.restore();
    }

    /**
     * 正面: デジタルノード（7個の点）
     */
    generateFront() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawModernBase(ctx);

        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f0ff';
        
        const nodes = [
            [300, 300], [500, 250], [700, 350], [600, 500],
            [400, 600], [250, 450], [500, 400]
        ];
        
        // 接続線
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(nodes[0][0], nodes[0][1]);
        for(let i=1; i<nodes.length; i++) ctx.lineTo(nodes[i][0], nodes[i][1]);
        ctx.closePath();
        ctx.stroke();

        // ノード
        ctx.shadowBlur = 15;
        nodes.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
        });

        this.drawOrderMark(ctx, '①');
        this.drawHiddenDigit(ctx, '3'); // 1桁目

        return canvas;
    }

    /**
     * 右面: デジタルアナモルフォーシス「3」
     */
    generateRight() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawModernBase(ctx);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // 背景に溶け込む薄い色
        ctx.lineWidth = 10;
        
        ctx.save();
        ctx.translate(512, 512);
        // 縦に極端に引き伸ばし、横を圧縮。正面から見るとただの縦線（ノイズ）に見える。
        ctx.scale(0.3, 2.0); 
        
        ctx.font = '900 600px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // ネオンの発光を消し、単なる模様としてカモフラージュ
        ctx.shadowBlur = 0;
        ctx.strokeText('3', 0, 0);
        ctx.restore();

        // 縦方向のグリッチライン（ダミー）を大量に配置し、3の形を「バーコードの一部」のように隠す
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for(let i=0; i<80; i++) {
            ctx.fillRect(Math.random()*1024, Math.random()*1024, 4, Math.random()*300 + 100);
        }

        this.drawOrderMark(ctx, '②');
        this.drawHiddenDigit(ctx, '7'); // 2桁目

        return canvas;
    }

    /**
     * 左面: データモザイクと「5」
     */
    generateLeft() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawModernBase(ctx);

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.font = 'bold 800px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('5', 512, 512);

        // サイバーなピクセルモザイク
        ctx.globalCompositeOperation = 'source-atop';
        for(let i=0; i<25; i++) {
            for(let j=0; j<25; j++) {
                if (Math.random() > 0.5) {
                    ctx.fillStyle = (i+j)%2 === 0 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                    ctx.fillRect(i*41, j*41, 41, 41);
                }
            }
        }
        ctx.globalCompositeOperation = 'source-over'; // リセット

        this.drawOrderMark(ctx, '③');

        return canvas;
    }

    /**
     * 上面: iPhone風 電卓
     */
    generateTop() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        this.drawModernBase(ctx);

        // ボタンのレイアウト設定
        const btnRadius = 60;
        const gapX = 140;
        const gapY = 130;
        
        // 4列 x 5行 の配置
        // 全体の幅: (4-1) * 140 = 420
        // 全体の高さ: (5-1) * 130 = 520
        // 箱の中央(512, 512)に配置するための開始座標
        const btnStartX = 512 - (420 / 2);
        const btnStartY = 512 - (520 / 2);

        const layout = [
            ['AC', '+/-', '%', '÷'],
            ['7', '8', '9', '×'],
            ['4', '5', '6', '-'],
            ['1', '2', '3', '+'],
            ['0', '0', '.', '='] // '0' は幅広にするためのダミー配置
        ];

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                const label = layout[row][col];
                if (label === '0' && col === 1) continue; // 0の2セル目をスキップ

                const cx = btnStartX + col * gapX;
                const cy = btnStartY + row * gapY;

                // ボタンの背景色
                if (col === 3) ctx.fillStyle = '#FF9500'; // オレンジ（演算子）
                else if (row === 0) ctx.fillStyle = '#A5A5A5'; // ライトグレー（上段）
                else ctx.fillStyle = '#333333'; // ダークグレー（数字）

                // 「2」ボタンだけ特別な演出（白く光っている / ハイライト）
                if (label === '2') {
                    ctx.fillStyle = '#ffffff'; // ピカッと白く光らせる
                    ctx.shadowBlur = 30;
                    ctx.shadowColor = '#00f0ff';
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.beginPath();
                if (label === '0') {
                    // 0ボタンは幅広
                    ctx.roundRect(cx - btnRadius, cy - btnRadius, gapX + btnRadius * 2, btnRadius * 2, btnRadius);
                } else {
                    ctx.arc(cx, cy, btnRadius, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.shadowBlur = 0; // 他の描画用にリセット
            }
        }

        this.drawOrderMark(ctx, '④');
        this.drawHiddenDigit(ctx, '2'); // 3桁目

        return canvas;
    }

    /**
     * 状態（通常/裏）に応じたテクスチャセットを一括生成
     */
    generateSet(isReverse = false) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');

        if (isReverse) {
            this.drawReverseBase(ctx);
            // 裏世界用の記号などを描画
            ctx.fillStyle = '#00f0ff';
            ctx.font = 'bold 300px serif';
            ctx.textAlign = 'center';
            ctx.fillText('ᚠ', this.size / 2, this.size / 2);
        } else {
            this.drawModernBase(ctx);
        }

        return canvas;
    }

    /**
     * 背面 / 底面: プレーンなモダンテクスチャ
     */
    generatePlain(hiddenDigit = null, isReverse = false) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        
        if (isReverse) {
            this.drawReverseBase(ctx);
        } else {
            this.drawModernBase(ctx);
        }
        
        if (hiddenDigit) {
            this.drawHiddenDigit(ctx, hiddenDigit);
        }

        return canvas;
    }
}

// Interactive Math Visualizers Module
const visualizers = {
    // Current state values
    fractionNum: 3,
    fractionDen: 4,
    decimalVal: 0.25,
    discountPercent: 20,
    geoWidth: 6,
    geoHeight: 4,
    geoShape: "rectangle", // rectangle or parallelogram

    // Polar-to-cartesian coordinate helper for SVG sectors
    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    },

    // Sector path generator
    describeSector(cx, cy, r, startAngle, endAngle) {
        const start = this.polarToCartesian(cx, cy, r, endAngle);
        const end = this.polarToCartesian(cx, cy, r, startAngle);
        // Handle full circle edge case
        if (endAngle - startAngle >= 360) {
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
        }
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return [
            "M", cx, cy,
            "L", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
            "Z"
        ].join(" ");
    },

    // 1. RENDER FRACTION VISUALIZER
    renderFraction(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="fraction-visualizer">
                <div class="fraction-output-card">
                    <h5>แผนภาพเศษส่วนเสมือนจริง</h5>
                    <div class="fraction-math-display">
                        <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
                            <span id="fracNumDisp" style="border-bottom: 2px solid var(--text-primary); padding-bottom: 4px; font-weight: bold; color: var(--color-primary);">${this.fractionNum}</span>
                            <span id="fracDenDisp" style="padding-top: 4px; font-weight: bold;">${this.fractionDen}</span>
                        </div>
                        <span style="font-size: 20px; color: var(--text-muted);">=</span>
                        <span id="fracDecimalVal" style="font-weight: 500; font-family: var(--font-mono);">${(this.fractionNum / this.fractionDen).toFixed(3)}</span>
                    </div>
                </div>

                <div class="fraction-rendering-box">
                    <svg viewBox="0 0 100 100" class="fraction-svg" id="fractionCircleSvg"></svg>
                </div>

                <div style="margin-bottom: 10px;">
                    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-align: center;">แผนภาพเศษส่วนแบบแท่ง (Fraction Bar)</div>
                    <svg class="fraction-bar-svg" id="fractionBarSvg"></svg>
                </div>

                <div class="fraction-controls">
                    <div class="range-wrap">
                        <div class="range-label">
                            <span>ตัวเศษ (ตัวเลือกระบายสี)</span>
                            <span id="fracNumLabelVal">3</span>
                        </div>
                        <input type="range" min="1" max="12" value="3" class="fraction-slider" id="fracNumSlider">
                    </div>
                    <div class="range-wrap">
                        <div class="range-label">
                            <span>ตัวส่วน (ช่องแบ่งทั้งหมด)</span>
                            <span id="fracDenLabelVal">4</span>
                        </div>
                        <input type="range" min="1" max="12" value="4" class="fraction-slider" id="fracDenSlider">
                    </div>
                </div>
            </div>
        `;

        // Bind events
        const numSlider = document.getElementById("fracNumSlider");
        const denSlider = document.getElementById("fracDenSlider");

        const updateData = () => {
            let den = parseInt(denSlider.value);
            let num = parseInt(numSlider.value);
            // Numerator cannot exceed denominator in simple fractions visualizer
            if (num > den) {
                num = den;
                numSlider.value = num;
            }
            numSlider.max = den; // Dynamic limit

            this.fractionNum = num;
            this.fractionDen = den;

            // Update Labels
            document.getElementById("fracNumDisp").innerText = num;
            document.getElementById("fracDenDisp").innerText = den;
            document.getElementById("fracNumLabelVal").innerText = num;
            document.getElementById("fracDenLabelVal").innerText = den;
            document.getElementById("fracDecimalVal").innerText = (num / den).toFixed(3);

            this.drawFractionCircle();
            this.drawFractionBar();
        };

        numSlider.addEventListener("input", updateData);
        denSlider.addEventListener("input", updateData);

        // Initial draw
        updateData();
    },

    drawFractionCircle() {
        const svg = document.getElementById("fractionCircleSvg");
        if (!svg) return;

        svg.innerHTML = "";
        const cx = 50, cy = 50, r = 45;
        const den = this.fractionDen;
        const num = this.fractionNum;
        const sliceAngle = 360 / den;

        // Draw sectors
        for (let i = 0; i < den; i++) {
            const startAngle = i * sliceAngle;
            const endAngle = (i + 1) * sliceAngle;
            
            const isFilled = i < num;
            const pathD = this.describeSector(cx, cy, r, startAngle, endAngle);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("fill", isFilled ? "var(--color-primary-light)" : "transparent");
            path.setAttribute("stroke", isFilled ? "var(--color-primary)" : "var(--border-color)");
            path.setAttribute("stroke-width", "1");
            svg.appendChild(path);
        }

        // Outer border circle
        const borderCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        borderCircle.setAttribute("cx", cx);
        borderCircle.setAttribute("cy", cy);
        borderCircle.setAttribute("r", r);
        borderCircle.setAttribute("fill", "none");
        borderCircle.setAttribute("stroke", "var(--border-color)");
        borderCircle.setAttribute("stroke-width", "1.5");
        svg.appendChild(borderCircle);
    },

    drawFractionBar() {
        const svg = document.getElementById("fractionBarSvg");
        if (!svg) return;

        svg.innerHTML = "";
        const den = this.fractionDen;
        const num = this.fractionNum;
        
        // Width of SVG bar is 100% relative, we'll draw rects
        // Let's assume viewbox is 0 0 100 40
        svg.setAttribute("viewBox", "0 0 100 40");
        const cellWidth = 100 / den;

        for (let i = 0; i < den; i++) {
            const isFilled = i < num;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", i * cellWidth);
            rect.setAttribute("y", 0);
            rect.setAttribute("width", cellWidth);
            rect.setAttribute("height", 40);
            rect.setAttribute("fill", isFilled ? "var(--color-primary-light)" : "transparent");
            rect.setAttribute("stroke", "var(--border-color)");
            rect.setAttribute("stroke-width", "0.5");
            svg.appendChild(rect);
        }
    },

    // 2. RENDER DECIMAL GRID VISUALIZER
    renderDecimal(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="decimal-grid-container">
                <div class="fraction-output-card">
                    <h5>เครื่องมือตารางร้อยทศนิยม</h5>
                    <div style="font-size: 26px; font-weight: bold; margin: 8px 0; color: var(--color-secondary);">
                        <span id="decimalLabelDisp">${this.decimalVal.toFixed(2)}</span>
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted);" id="decimalFractionRelation">
                        คิดเป็น: $\\frac{25}{100}$ หรือแรเงา 25 ช่องใน 100 ช่อง
                    </div>
                </div>

                <div class="grid-hundredths" id="hundredGrid">
                    <!-- 100 Cells dynamically rendered -->
                </div>

                <div class="range-wrap">
                    <div class="range-label">
                        <span>สไลเดอร์ปรับค่าทศนิยม (0.00 - 1.00)</span>
                        <span id="decimalSliderVal">0.25</span>
                    </div>
                    <input type="range" min="0" max="100" value="25" class="fraction-slider" id="decimalSlider" style="background-color: var(--color-secondary-light);">
                </div>
            </div>
        `;

        const grid = document.getElementById("hundredGrid");
        const slider = document.getElementById("decimalSlider");
        const label = document.getElementById("decimalLabelDisp");
        const relation = document.getElementById("decimalFractionRelation");

        const updateGrid = () => {
            const valPercent = parseInt(slider.value);
            const valDecimal = valPercent / 100;
            this.decimalVal = valDecimal;

            label.innerText = valDecimal.toFixed(2);
            document.getElementById("decimalSliderVal").innerText = valDecimal.toFixed(2);
            
            // Build KaTeX relationship
            relation.innerHTML = `คิดเป็นเศษส่วน: $\\frac{${valPercent}}{100}$ หรือแรเงา ${valPercent} ช่องใน 100 ช่อง`;
            try {
                katex.render(`\\text{คิดเป็นเศษส่วน: } \\frac{${valPercent}}{100} \\text{ หรือแรเงา } ${valPercent} \\text{ ช่อง}`, relation);
            } catch(e){}

            // Redraw cells
            grid.innerHTML = "";
            for (let i = 0; i < 100; i++) {
                const cell = document.createElement("div");
                cell.className = "grid-cell" + (i < valPercent ? " active" : "");
                grid.appendChild(cell);
            }
        };

        slider.addEventListener("input", updateGrid);
        updateGrid();
    },

    // 3. RENDER PERCENTAGE DISCOUNT SIMULATOR
    renderPercentage(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="store-simulator">
                <div class="fraction-output-card">
                    <h5>เครื่องจำลองส่วนลดร้อยละ (%)</h5>
                    <div style="font-size: 26px; font-weight: bold; margin: 8px 0; color: var(--color-warning);">
                        ลดราคา <span id="discountPercentDisp">${this.discountPercent}</span>%
                    </div>
                </div>

                <div class="shop-shelves">
                    <!-- Pencil Box -->
                    <div class="shop-item-card">
                        <div class="item-avatar">✏️</div>
                        <div class="item-meta">
                            <h5>กระเป๋าดินสอ</h5>
                            <p>ราคาทุน 100 บาท</p>
                        </div>
                        <div class="item-pricing">
                            <div class="original-price">150 บาท</div>
                            <div class="discount-price" id="price-pencil">120 บาท</div>
                            <div style="font-size: 10px; color: var(--color-success);" id="profit-pencil">กำไร 20%</div>
                        </div>
                    </div>
                    <!-- Math Book -->
                    <div class="shop-item-card">
                        <div class="item-avatar">📘</div>
                        <div class="item-meta">
                            <h5>หนังสือเรียนคณิตศาสตร์ ป.5</h5>
                            <p>ราคาทุน 120 บาท</p>
                        </div>
                        <div class="item-pricing">
                            <div class="original-price">200 บาท</div>
                            <div class="discount-price" id="price-book">160 บาท</div>
                            <div style="font-size: 10px; color: var(--color-success);" id="profit-book">กำไร 33.3%</div>
                        </div>
                    </div>
                    <!-- Toy blocks -->
                    <div class="shop-item-card">
                        <div class="item-avatar">🧱</div>
                        <div class="item-meta">
                            <h5>ของเล่นไม้ตัวต่อเรขาคณิต</h5>
                            <p>ราคาทุน 220 บาท</p>
                        </div>
                        <div class="item-pricing">
                            <div class="original-price">350 บาท</div>
                            <div class="discount-price" id="price-toy">280 บาท</div>
                            <div style="font-size: 10px; color: var(--color-success);" id="profit-toy">กำไร 27.2%</div>
                        </div>
                    </div>
                </div>

                <div class="range-wrap" style="margin-top: 10px;">
                    <div class="range-label">
                        <span>เลือกเปอร์เซ็นต์การลดราคา (0% - 100%)</span>
                        <span id="discountSliderVal">20%</span>
                    </div>
                    <input type="range" min="0" max="100" step="5" value="20" class="fraction-slider" id="discountSlider" style="background-color: var(--color-warning-light);">
                </div>
            </div>
        `;

        const slider = document.getElementById("discountSlider");

        const updatePrices = () => {
            const disc = parseInt(slider.value);
            this.discountPercent = disc;

            document.getElementById("discountPercentDisp").innerText = disc;
            document.getElementById("discountSliderVal").innerText = `${disc}%`;

            // Products data
            const items = [
                { id: "pencil", original: 150, cost: 100 },
                { id: "book", original: 200, cost: 120 },
                { id: "toy", original: 350, cost: 220 }
            ];

            items.forEach(item => {
                const discountAmount = (item.original * disc) / 100;
                const sellingPrice = item.original - discountAmount;
                const profitVal = sellingPrice - item.cost;
                const profitPercent = (profitVal / item.cost) * 100;

                // Update UI elements
                document.getElementById(`price-${item.id}`).innerText = `${sellingPrice.toFixed(0)} บาท`;
                const profitSpan = document.getElementById(`profit-${item.id}`);

                if (profitVal > 0) {
                    profitSpan.innerText = `ได้กำไร ${profitVal.toFixed(0)} บาท (${profitPercent.toFixed(1)}%)`;
                    profitSpan.style.color = "var(--color-success)";
                } else if (profitVal < 0) {
                    profitSpan.innerText = `ขาดทุน ${Math.abs(profitVal).toFixed(0)} บาท (${Math.abs(profitPercent).toFixed(1)}%)`;
                    profitSpan.style.color = "var(--color-danger)";
                } else {
                    profitSpan.innerText = `เท่าทุนพอดี (0%)`;
                    profitSpan.style.color = "var(--text-muted)";
                }
            });
        };

        slider.addEventListener("input", updatePrices);
        updatePrices();
    },

    // 4. RENDER GEOMETRY AREA SANDBOX
    renderGeometry(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="geometry-board">
                <div class="fraction-output-card">
                    <h5>บอร์ดพื้นที่รูปทรงสี่เหลี่ยม</h5>
                    <div style="font-size: 24px; font-weight: bold; margin: 4px 0; color: var(--color-primary);" id="geoAreaDisp">
                        พื้นที่ = 24 ตารางเมตร
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted);" id="geoPerimeterDisp">
                        ความยาวรอบรูป = 20 เมตร
                    </div>
                </div>

                <div class="geo-svg-wrapper">
                    <svg class="geo-shape-svg" id="geoShapeSvg" viewBox="0 0 100 100"></svg>
                </div>

                <div class="fraction-controls">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="geoShapeSelect">ประเภทรูปทรงสี่เหลี่ยม:</label>
                        <select id="geoShapeSelect" class="form-select">
                            <option value="rectangle">รูปสี่เหลี่ยมผืนผ้า (กว้าง &times; ยาว)</option>
                            <option value="parallelogram">รูปสี่เหลี่ยมด้านขนาน (ฐาน &times; สูง)</option>
                        </select>
                    </div>

                    <div class="range-wrap">
                        <div class="range-label">
                            <span id="geoDim1Label">ด้านกว้าง (เมตร) / ฐาน (เมตร)</span>
                            <span id="geoDim1ValDisp">6 ม.</span>
                        </div>
                        <input type="range" min="2" max="10" value="6" class="fraction-slider" id="geoDim1Slider">
                    </div>
                    <div class="range-wrap">
                        <div class="range-label">
                            <span id="geoDim2Label">ด้านยาว (เมตร) / สูง (เมตร)</span>
                            <span id="geoDim2ValDisp">4 ม.</span>
                        </div>
                        <input type="range" min="2" max="10" value="4" class="fraction-slider" id="geoDim2Slider">
                    </div>
                </div>
            </div>
        `;

        const select = document.getElementById("geoShapeSelect");
        const slider1 = document.getElementById("geoDim1Slider");
        const slider2 = document.getElementById("geoDim2Slider");

        const updateGeometry = () => {
            const shape = select.value;
            const dim1 = parseInt(slider1.value);
            const dim2 = parseInt(slider2.value);

            this.geoShape = shape;
            this.geoWidth = dim1;
            this.geoHeight = dim2;

            // Labels setup based on shape
            if (shape === "rectangle") {
                document.getElementById("geoDim1Label").innerText = "ด้านกว้าง (เมตร)";
                document.getElementById("geoDim2Label").innerText = "ด้านยาว (เมตร)";
                document.getElementById("geoDim1ValDisp").innerText = `${dim1} เมตร`;
                document.getElementById("geoDim2ValDisp").innerText = `${dim2} เมตร`;

                const area = dim1 * dim2;
                const perimeter = 2 * (dim1 + dim2);

                document.getElementById("geoAreaDisp").innerHTML = `พื้นที่ = ${area} ตร.ม. (สูตร: กว้าง &times; ยาว)`;
                document.getElementById("geoPerimeterDisp").innerText = `ความยาวรอบรูป = ${perimeter} เมตร [สูตร: 2 x (กว้าง + ยาว)]`;
            } else {
                document.getElementById("geoDim1Label").innerText = "ความยาวฐาน (เมตร)";
                document.getElementById("geoDim2Label").innerText = "ความสูง (เมตร)";
                document.getElementById("geoDim1ValDisp").innerText = `${dim1} เมตร`;
                document.getElementById("geoDim2ValDisp").innerText = `${dim2} เมตร`;

                const area = dim1 * dim2;
                // For parallelogram, perimeter depends on diagonal side. Let's approximate diagonal side dynamically.
                const diagSide = Math.sqrt(dim2*dim2 + 2*2); // offset skew of 2 meters
                const perimeter = 2 * (dim1 + diagSide);

                document.getElementById("geoAreaDisp").innerHTML = `พื้นที่ = ${area} ตร.ม. (สูตร: ฐาน &times; สูง)`;
                document.getElementById("geoPerimeterDisp").innerText = `ความยาวรอบรูป &approx; ${perimeter.toFixed(1)} เมตร [สูตร: 2 x (ฐาน + ด้านเอียง)]`;
            }

            this.drawGeometryShape();
        };

        select.addEventListener("change", updateGeometry);
        slider1.addEventListener("input", updateGeometry);
        slider2.addEventListener("input", updateGeometry);

        updateGeometry();
    },

    drawGeometryShape() {
        const svg = document.getElementById("geoShapeSvg");
        if (!svg) return;

        svg.innerHTML = "";
        
        // SVG viewbox is 100 x 100.
        // We will scale dim1 and dim2 so they fit nicely. Maximum dimension 10 units = 70px on screen.
        const scale = 7;
        const widthPx = this.geoWidth * scale;
        const heightPx = this.geoHeight * scale;

        // Center offsets
        const startX = (100 - widthPx) / 2;
        const startY = (100 - heightPx) / 2;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

        if (this.geoShape === "rectangle") {
            // Rectangle vertices
            const x1 = startX, y1 = startY;
            const x2 = startX + widthPx, y2 = startY;
            const x3 = startX + widthPx, y3 = startY + heightPx;
            const x4 = startX, y4 = startY + heightPx;

            path.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`);
            path.setAttribute("fill", "rgba(139, 92, 246, 0.2)");
            path.setAttribute("stroke", "var(--color-primary)");
            path.setAttribute("stroke-width", "2");
            svg.appendChild(path);

            // Add Dimension texts inside SVG
            const textWidth = this.createText(startX + widthPx/2, startY - 4, `${this.geoWidth}ม.`);
            const textHeight = this.createText(startX - 8, startY + heightPx/2, `${this.geoHeight}ม.`);
            svg.appendChild(textWidth);
            svg.appendChild(textHeight);
        } else {
            // Parallelogram vertices (skew bottom left by offset of 10px)
            const skew = 12;
            const x1 = startX + skew, y1 = startY;
            const x2 = startX + widthPx + skew, y2 = startY;
            const x3 = startX + widthPx, y3 = startY + heightPx;
            const x4 = startX, y4 = startY + heightPx;

            path.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`);
            path.setAttribute("fill", "rgba(59, 130, 246, 0.2)");
            path.setAttribute("stroke", "var(--color-secondary)");
            path.setAttribute("stroke-width", "2");
            svg.appendChild(path);

            // Height dot-line indicator
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", startX + skew);
            line.setAttribute("y1", startY);
            line.setAttribute("x2", startX + skew);
            line.setAttribute("y2", startY + heightPx);
            line.setAttribute("stroke", "var(--color-danger)");
            line.setAttribute("stroke-dasharray", "3,3");
            line.setAttribute("stroke-width", "1.5");
            svg.appendChild(line);

            // Labels
            const textBase = this.createText(startX + widthPx/2, startY + heightPx + 6, `ฐาน = ${this.geoWidth}ม.`);
            const textHeight = this.createText(startX + skew + 3, startY + heightPx/2, `สูง = ${this.geoHeight}ม.`, "var(--color-danger)");
            svg.appendChild(textBase);
            svg.appendChild(textHeight);
        }
    },

    createText(x, y, textString, color = "var(--text-primary)") {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("fill", color);
        text.setAttribute("font-size", "5");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-family", "'Kanit', sans-serif");
        text.textContent = textString;
        return text;
    }
};

// Capstone Mathematics Project Controller
const project = {
    // Exact correct answers for calculations
    answers: {
        areaA: 48,    // 6 * 8 (Rectangle)
        costA: 7200,  // 48 * 150
        areaB: 16,    // 4 * 4 (Square)
        costB: 4000,  // 16 * 250
        areaC: 15,    // 5 * 3 (Parallelogram)
        costC: 6000,  // 15 * 400
        totalArea: 79, // 48 + 16 + 15
        totalCost: 17200, // 7200 + 4000 + 6000
        netCost: 15480   // 17200 - 10% = 17200 - 1720
    },

    // Initialize the project panel
    init() {
        this.loadDraft();
        this.bindEvents();
    },

    // Load stored draft answers from localStorage
    loadDraft() {
        const fields = ["projAreaA", "projCostA", "projAreaB", "projCostB", "projAreaC", "projCostC", "projTotalArea", "projTotalCost", "projNetCost"];
        fields.forEach(field => {
            const saved = localStorage.getItem(`math_project_${field}`);
            if (saved !== null) {
                document.getElementById(field).value = saved;
            }
        });
    },

    // Save inputs as drafts in localStorage
    saveDraft() {
        const fields = ["projAreaA", "projCostA", "projAreaB", "projCostB", "projAreaC", "projCostC", "projTotalArea", "projTotalCost", "projNetCost"];
        fields.forEach(field => {
            const val = document.getElementById(field).value;
            localStorage.setItem(`math_project_${field}`, val);
        });
    },

    // Bind action buttons
    bindEvents() {
        const validateBtn = document.getElementById("validateProjectMathBtn");
        const resetBtn = document.getElementById("resetProjectMathBtn");
        const consoleBox = document.getElementById("mathProjectConsole");

        // Save drafts on input changes
        const inputs = document.querySelectorAll(".project-guide-pane input");
        inputs.forEach(input => {
            input.addEventListener("input", () => {
                this.saveDraft();
            });
        });

        // Reset answers
        resetBtn.addEventListener("click", () => {
            if (confirm("คุณต้องการล้างคำตอบโครงงานทั้งหมดใช่หรือไม่?")) {
                inputs.forEach(input => input.value = "");
                const fields = ["projAreaA", "projCostA", "projAreaB", "projCostB", "projAreaC", "projCostC", "projTotalArea", "projTotalCost", "projNetCost"];
                fields.forEach(field => localStorage.removeItem(`math_project_${field}`));
                consoleBox.className = "project-console-output";
                consoleBox.innerText = "กรอกคำตอบของคุณในฟอร์มด้านซ้ายและคลิกปุ่ม 'ส่งและประเมินโครงงานสถาปนิก' เพื่อเริ่มต้นทดสอบความถูกต้อง";
            }
        });

        // Validate answers
        validateBtn.addEventListener("click", () => {
            // Read student inputs
            const sAreaA = parseFloat(document.getElementById("projAreaA").value);
            const sCostA = parseFloat(document.getElementById("projCostA").value);
            const sAreaB = parseFloat(document.getElementById("projAreaB").value);
            const sCostB = parseFloat(document.getElementById("projCostB").value);
            const sAreaC = parseFloat(document.getElementById("projAreaC").value);
            const sCostC = parseFloat(document.getElementById("projCostC").value);
            const sTotalArea = parseFloat(document.getElementById("projTotalArea").value);
            const sTotalCost = parseFloat(document.getElementById("projTotalCost").value);
            const sNetCost = parseFloat(document.getElementById("projNetCost").value);

            let feedback = "=== บันทึกรายงานประเมินโครงงานสถาปนิก ===\n\n";
            let allCorrect = true;

            // 1. Zone A checking
            if (sAreaA === this.answers.areaA && sCostA === this.answers.costA) {
                feedback += "🌳 โซนสวนหญ้า (A): ผ่านการประเมิน! (พื้นที่ 48 ตร.ม. / ค่าก่อสร้าง 7,200 บาท)\n";
            } else {
                allCorrect = false;
                feedback += "🌳 โซนสวนหญ้า (A): ยังไม่ถูกต้อง\n";
                if (sAreaA !== this.answers.areaA) {
                    feedback += "   - คำนวณพื้นที่รูปสี่เหลี่ยมผืนผ้าผิดพลาด (สูตร: กว้าง x ยาว)\n";
                } else if (sCostA !== this.answers.costA) {
                    feedback += "   - คำนวณค่าก่อสร้างหญ้าเทียมผิดพลาด (สูตร: พื้นที่ x ตารางเมตรละ 150 บาท)\n";
                }
            }

            // 2. Zone B checking
            if (sAreaB === this.answers.areaB && sCostB === this.answers.costB) {
                feedback += "🧸 โซนเครื่องเล่น (B): ผ่านการประเมิน! (พื้นที่ 16 ตร.ม. / ค่าปูพื้น 4,000 บาท)\n";
            } else {
                allCorrect = false;
                feedback += "🧸 โซนเครื่องเล่น (B): ยังไม่ถูกต้อง\n";
                if (sAreaB !== this.answers.areaB) {
                    feedback += "   - คำนวณพื้นที่รูปสี่เหลี่ยมจัตุรัสผิดพลาด (สูตร: ด้าน x ด้าน)\n";
                } else if (sCostB !== this.answers.costB) {
                    feedback += "   - คำนวณค่าทำพื้นยางผิดพลาด (สูตร: พื้นที่ x ตารางเมตรละ 250 บาท)\n";
                }
            }

            // 3. Zone C checking
            if (sAreaC === this.answers.areaC && sCostC === this.answers.costC) {
                feedback += "💦 โซนสระบัว (C): ผ่านการประเมิน! (พื้นที่ 15 ตร.ม. / ค่าจัดทำ 6,000 บาท)\n";
            } else {
                allCorrect = false;
                feedback += "💦 โซนสระบัว (C): ยังไม่ถูกต้อง\n";
                if (sAreaC !== this.answers.areaC) {
                    feedback += "   - คำนวณพื้นที่รูปสี่เหลี่ยมด้านขนานผิดพลาด (สูตร: ฐาน x สูง)\n";
                } else if (sCostC !== this.answers.costC) {
                    feedback += "   - คำนวณค่าขุดแต่งและปูฉนวนผิดพลาด (สูตร: พื้นที่ x ตารางเมตรละ 400 บาท)\n";
                }
            }

            // 4. Summaries checking
            if (sTotalArea === this.answers.totalArea && sTotalCost === this.answers.totalCost && sNetCost === this.answers.netCost) {
                feedback += "📊 สรุปรายงานส่วนรวม: ผ่านการประเมิน! (รวมพื้นที่ 79 ตร.ม. / ราคารวม 17,200 บาท / ราคาสุทธิหลังหักลด 10% คือ 15,480 บาท)\n";
            } else {
                allCorrect = false;
                feedback += "📊 สรุปรายงานส่วนรวม: ยังไม่ถูกต้อง\n";
                if (sTotalArea !== this.answers.totalArea) {
                    feedback += "   - ยอดรวมพื้นที่ทั้ง 3 โซนผิดพลาด (สูตร: พื้นที่ A + B + C)\n";
                }
                if (sTotalCost !== this.answers.totalCost) {
                    feedback += "   - ยอดราคารวมก่อนหักส่วนลดผิดพลาด (สูตร: ราคาทั้ง 3 โซนรวมกัน)\n";
                }
                if (sNetCost !== this.answers.netCost) {
                    feedback += "   - ยอดรวมราคาสุทธิหลังหักส่วนลดร้อยละ 10 ผิดพลาด (สูตร: ราคารวม - ส่วนลด 10%)\n";
                }
            }

            // Final report output
            consoleBox.className = "project-console-output " + (allCorrect ? "success" : "error");
            if (allCorrect) {
                feedback += "\n🎉 ยอดเยี่ยมมาก! คุณคำนวณพื้นที่ งบประมาณ และส่วนลดร้อยละของโครงงานได้ถูกต้องครบถ้วน 100%\n";
                feedback += "ขณะนี้ใบประกาศเกียรติบัตรกิตติมศักดิ์วิชาคณิตศาสตร์ ป.5 ได้ปลดล็อกให้คุณแล้ว! เข้าไปตรวจสอบที่แท็บเกียรติบัตรได้เลย 🎓";
                consoleBox.innerText = feedback;
                app.completeProject();
            } else {
                feedback += "\n❌ ยังไม่ผ่านการประเมิน: มีจุดที่คำนวณตัวเลขคณิตศาสตร์ผิดพลาด กรุณาทบทวนการบวก ลบ คูณ หาร และสูตรร้อยละตามหัวข้อด้านบน แล้วทดสอบอีกครั้งครับ";
                consoleBox.innerText = feedback;
            }
        });
    }
};

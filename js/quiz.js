// Bloom's Taxonomy Quiz Engine
const quiz = {
    currentUnitId: 0,
    currentQuestionIndex: 0,
    answersState: {}, // Tracks correctness of each question
    editorInstances: {}, // Stores textareas or overlays

    // Load and render quiz for a specific unit
    init(unitId) {
        this.currentUnitId = unitId;
        this.currentQuestionIndex = 0;
        this.answersState = {};
        
        this.renderQuestion();
    },

    // Render the active question in the DOM
    renderQuestion() {
        const unit = lessonsData[this.currentUnitId];
        const questions = unit.quiz;
        const qIndex = this.currentQuestionIndex;
        const q = questions[qIndex];

        const container = document.getElementById("lessonContentContainer");
        if (!container) return;

        // Progress HTML
        const progressHtml = `
            <div class="quiz-progress-wrapper" style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <span class="quiz-progress-text">ระดับความรู้: คำถามที่ ${qIndex + 1} จากทั้งหมด ${questions.length} ข้อ</span>
                <div class="progress-dots-quiz" style="display: flex; gap: 6px;">
                    ${questions.map((_, i) => `
                        <div class="dot ${i === qIndex ? 'active' : ''} ${this.answersState[i] ? 'completed' : ''}" 
                             style="width: 10px; height: 10px; border-radius: 50%; background-color: ${i === qIndex ? 'var(--color-primary)' : (this.answersState[i] ? 'var(--color-success)' : 'var(--border-color)')};"></div>
                    `).join('')}
                </div>
            </div>
        `;

        let questionBodyHtml = "";

        if (q.type === "coding") {
            // Coding Question
            questionBodyHtml = `
                <div class="quiz-container">
                    <div class="quiz-title">
                        <span class="bloom-badge bloom-${q.bloomLevel}">${q.bloomLabel}</span>
                        <span>แบบทดสอบทักษะการเขียนโปรแกรม</span>
                    </div>
                    <div class="quiz-question-text">
                        <p>${q.question}</p>
                    </div>

                    <div class="quiz-editor-wrapper">
                        <div class="quiz-editor-box">
                            <div class="console-header">ตัวเขียนโค้ด (Python Editor)</div>
                            <div style="flex: 1; position: relative; background-color: #1e1e1e;">
                                <textarea id="quizEditor" class="code-textarea" spellcheck="false">${q.defaultCode || ''}</textarea>
                                <pre class="code-highlight-overlay"><code class="language-python" id="quizEditorHighlight">${q.defaultCode || ''}</code></pre>
                            </div>
                        </div>
                        <div class="quiz-console-box">
                            <div class="console-header">คอนโซลแสดงผล (Console)</div>
                            <div class="console-output" id="quizConsoleOutput">กดปุ่ม 'รันและส่งตรวจคำตอบ' ด้านล่างเพื่อรันและทดสอบโค้ดของคุณ...</div>
                        </div>
                    </div>

                    <div class="quiz-feedback" id="quizFeedbackBox"></div>

                    <div class="quiz-action-bar">
                        <button class="btn btn-outline" id="prevQuizQuestionBtn" ${qIndex === 0 ? 'disabled' : ''}>
                            <i data-lucide="arrow-left"></i> ข้อก่อนหน้า
                        </button>
                        <button class="btn btn-success" id="submitCodingQuizBtn">
                            <i data-lucide="send"></i> รันและส่งตรวจคำตอบ
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Multiple Choice Question
            const alphabet = ["ก", "ข", "ค", "ฆ"];
            questionBodyHtml = `
                <div class="quiz-container">
                    <div class="quiz-title">
                        <span class="bloom-badge bloom-${q.bloomLevel}">${q.bloomLabel}</span>
                        <span>แบบทดสอบประเมินความเข้าใจ</span>
                    </div>
                    <div class="quiz-question-text">
                        <p>${q.question.replace(/\n/g, '<br>')}</p>
                    </div>

                    <div class="quiz-options">
                        ${q.options.map((opt, i) => `
                            <div class="quiz-option" data-option-index="${i}">
                                <div class="quiz-option-letter">${alphabet[i]}</div>
                                <div class="quiz-option-text">${opt}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="quiz-feedback" id="quizFeedbackBox"></div>

                    <div class="quiz-action-bar">
                        <button class="btn btn-outline" id="prevQuizQuestionBtn" ${qIndex === 0 ? 'disabled' : ''}>
                            <i data-lucide="arrow-left"></i> ข้อก่อนหน้า
                        </button>
                        <button class="btn btn-primary" id="submitChoiceQuizBtn" disabled>
                            ตรวจคำตอบ
                        </button>
                    </div>
                </div>
            `;
        }

        // Apply HTML
        container.innerHTML = `
            <div class="lesson-article">
                <h2>แบบประเมินความรู้ระดับย่อย: ${unit.title}</h2>
                <p>โปรดตอบคำถามให้ถูกต้องเพื่อผ่านหน่วยย่อยและเก็บความก้าวหน้าการเรียนรู้</p>
                ${progressHtml}
                ${questionBodyHtml}
            </div>
        `;

        // Load lucide icons
        lucide.createIcons();

        // Bind events
        this.bindEvents(q);
    },

    // Bind event handlers for the rendered question
    bindEvents(q) {
        const qIndex = this.currentQuestionIndex;
        const unit = lessonsData[this.currentUnitId];

        // Prev Question Button
        const prevBtn = document.getElementById("prevQuizQuestionBtn");
        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                if (this.currentQuestionIndex > 0) {
                    this.currentQuestionIndex--;
                    this.renderQuestion();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        if (q.type === "coding") {
            // Initialize code highlighter overlay
            const textarea = document.getElementById("quizEditor");
            const highlight = document.getElementById("quizEditorHighlight");
            
            const syncHighlight = () => {
                highlight.textContent = textarea.value;
                Prism.highlightElement(highlight);
            };

            textarea.addEventListener("input", syncHighlight);
            textarea.addEventListener("scroll", () => {
                highlight.scrollTop = textarea.scrollTop;
                highlight.scrollLeft = textarea.scrollLeft;
            });
            syncHighlight();

            // Submit Coding Quiz Button
            const submitBtn = document.getElementById("submitCodingQuizBtn");
            const consoleBox = document.getElementById("quizConsoleOutput");
            const feedbackBox = document.getElementById("quizFeedbackBox");

            submitBtn.addEventListener("click", async () => {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i data-lucide="loader" class="animation-spin" style="animation: pulse 1s infinite;"></i> กำลังรันตรวจสอบ...`;
                consoleBox.className = "console-output";
                consoleBox.innerText = "กำลังรันโค้ดภาษา Python ในระบบจำลอง...";
                feedbackBox.style.display = "none";

                // Ensure compiler is ready
                if (!compiler.isReady) {
                    await compiler.init();
                }

                const studentCode = textarea.value;
                const result = await compiler.run(studentCode);

                consoleBox.innerText = result.stdout || "";
                if (result.stderr) {
                    consoleBox.className = "console-output error";
                    consoleBox.innerText += "\n[Error Output]:\n" + result.stderr;
                }

                // Run validation script in Pyodide
                let isPassed = false;
                let feedbackMsg = "";

                if (result.success) {
                    try {
                        // Inject grading script
                        await compiler.pyodideInstance.runPythonAsync(q.validationScript);
                        // Run check_solution and convert result
                        const evalCall = `check_solution(${JSON.stringify(studentCode)}, ${JSON.stringify(result.stdout)})`;
                        const evalResultProxy = await compiler.pyodideInstance.runPythonAsync(evalCall);
                        const evalResult = evalResultProxy.toJs();
                        
                        isPassed = evalResult[0];
                        feedbackMsg = evalResult[1];
                    } catch (err) {
                        isPassed = false;
                        feedbackMsg = "เกิดข้อผิดพลาดในการรันสคริปต์ตรวจวิเคราะห์คำตอบ: " + err.message;
                    }
                } else {
                    isPassed = false;
                    feedbackMsg = "โค้ดของคุณยังมีข้อผิดพลาดในการแปลภาษา (Syntax/Runtime Error) กรุณาแก้ไขโค้ดและรันใหม่อีกครั้ง";
                }

                // Update UI state
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i data-lucide="send"></i> รันและส่งตรวจคำตอบ`;
                
                feedbackBox.style.display = "block";
                if (isPassed) {
                    feedbackBox.className = "quiz-feedback correct";
                    feedbackBox.innerHTML = `<h4>🎉 ถูกต้อง!</h4><p>${feedbackMsg}</p>`;
                    this.answersState[qIndex] = true;
                    
                    // Display next actions
                    this.showNextActionButtons(unit.quiz.length);
                } else {
                    feedbackBox.className = "quiz-feedback incorrect";
                    feedbackBox.innerHTML = `<h4>❌ ยังไม่ถูกต้อง</h4><p>${feedbackMsg}</p>`;
                }
                lucide.createIcons();
            });

        } else {
            // Multiple Choice Logic
            const optionCards = document.querySelectorAll(".quiz-option");
            const submitBtn = document.getElementById("submitChoiceQuizBtn");
            const feedbackBox = document.getElementById("quizFeedbackBox");
            let selectedIndex = null;

            optionCards.forEach(card => {
                card.addEventListener("click", () => {
                    // Check if already answered correctly (locked)
                    if (this.answersState[qIndex]) return;

                    // Deselect previous
                    optionCards.forEach(c => c.classList.remove("selected"));
                    card.classList.add("selected");
                    selectedIndex = parseInt(card.getAttribute("data-option-index"));
                    submitBtn.disabled = false;
                });
            });

            submitBtn.addEventListener("click", () => {
                if (selectedIndex === null) return;
                
                const isCorrect = selectedIndex === q.correctAnswer;
                feedbackBox.style.display = "block";

                // Highlight correct/incorrect options
                optionCards.forEach((card, idx) => {
                    if (idx === q.correctAnswer) {
                        card.classList.add("correct");
                    } else if (idx === selectedIndex) {
                        card.classList.add("incorrect");
                    }
                });

                if (isCorrect) {
                    feedbackBox.className = "quiz-feedback correct";
                    feedbackBox.innerHTML = `<h4>🎉 ถูกต้อง!</h4><p>${q.feedback}</p>`;
                    this.answersState[qIndex] = true;
                    
                    // Show next button
                    this.showNextActionButtons(unit.quiz.length);
                } else {
                    feedbackBox.className = "quiz-feedback incorrect";
                    feedbackBox.innerHTML = `<h4>❌ คำตอบยังไม่ถูก</h4><p>ลองพิจารณาทบทวนเนื้อหาบทเรียนแล้วเลือกคำตอบใหม่อีกครั้งนะครับ</p>`;
                }
                
                submitBtn.disabled = true;
                lucide.createIcons();
            });
        }
    },

    // Show Next Question or Complete Quiz button
    showNextActionButtons(totalQuestions) {
        const qIndex = this.currentQuestionIndex;
        const actionBar = document.querySelector(".quiz-action-bar");
        if (!actionBar) return;

        // Remove old submit/next buttons
        const submitBtnChoice = document.getElementById("submitChoiceQuizBtn");
        const submitBtnCoding = document.getElementById("submitCodingQuizBtn");
        if (submitBtnChoice) submitBtnChoice.remove();
        if (submitBtnCoding) submitBtnCoding.remove();

        // Check if last question
        if (qIndex < totalQuestions - 1) {
            const nextBtn = document.createElement("button");
            nextBtn.className = "btn btn-primary";
            nextBtn.id = "nextQuizQuestionBtn";
            nextBtn.innerHTML = `ข้อถัดไป <i data-lucide="arrow-right"></i>`;
            nextBtn.addEventListener("click", () => {
                this.currentQuestionIndex++;
                this.renderQuestion();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            actionBar.appendChild(nextBtn);
        } else {
            // Complete quiz button
            const finishBtn = document.createElement("button");
            finishBtn.className = "btn btn-success";
            finishBtn.id = "finishQuizBtn";
            finishBtn.innerHTML = `<i data-lucide="check-circle-2"></i> เรียนจบหน่วยการเรียนรู้นี้`;
            finishBtn.addEventListener("click", () => {
                this.completeUnitQuiz();
            });
            actionBar.appendChild(finishBtn);
        }
        lucide.createIcons();
    },

    // Triggered when all questions in the unit are answered correctly
    completeUnitQuiz() {
        // Mark unit as completed in general application state
        app.completeUnit(this.currentUnitId);
        
        const container = document.getElementById("lessonContentContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="lesson-article text-center" style="text-align: center; padding: 40px 0;">
                <div style="font-size: 64px; margin-bottom: 20px;">🏆</div>
                <h2 style="color: var(--color-success); margin-bottom: 12px;">ยินดีด้วย! คุณเรียนจบหน่วยเรียนรู้นี้แล้ว</h2>
                <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto 30px auto; line-height: 1.6;">
                    คุณตอบคำถามวัดความรู้ตามกรอบ Bloom's Taxonomy ครบถ้วนทั้ง 6 ระดับ (Remembering &rarr; Creating) สำหรับบทเรียนเรื่องนี้ ความก้าวหน้าของคุณได้รับการบันทึกเรียบร้อยแล้ว
                </p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button class="btn btn-outline" onclick="app.switchTab('lessons')">
                        <i data-lucide="book-open"></i> กลับหน้ารวมบทเรียน
                    </button>
                    ${this.currentUnitId < lessonsData.length - 1 ? `
                        <button class="btn btn-primary" onclick="app.loadUnit(${this.currentUnitId + 1})">
                            เรียนหน่วยถัดไป <i data-lucide="arrow-right"></i>
                        </button>
                    ` : `
                        <button class="btn btn-secondary" onclick="app.switchTab('project')">
                            ไปสร้างโครงงานปลายภาค <i data-lucide="folder-code"></i>
                        </button>
                    `}
                </div>
            </div>
        `;
        lucide.createIcons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

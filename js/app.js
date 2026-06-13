// Main SPA Controller & Orchestrator for Mathematics Portal
const app = {
    state: {
        studentName: "ผู้เรียนคณิตศาสตร์",
        completedLessons: {},  // Format: "unitId-topicIndex": true
        completedQuizzes: {},  // Format: "unitId": true
        projectCompleted: false,
        theme: "dark"
    },
    
    currentUnitId: 0,
    currentLessonIndex: 0, // Index in topics array, or 'quiz'

    // Initialize application
    async init() {
        this.loadProgress();
        this.applyTheme();
        this.bindGlobalEvents();
        this.renderLessonsMenu();
        this.updateOverallProgress();

        // Initialize Lucide Icons
        lucide.createIcons();

        // Check if name is set, else show modal
        if (!localStorage.getItem("math_student_name")) {
            this.showNameModal(true);
        } else {
            this.showNameModal(false);
        }

        // Navigate to default tab (Home)
        this.handleRouting();
        window.addEventListener("hashchange", () => this.handleRouting());
    },

    // Show or hide student name input modal
    showNameModal(show) {
        const modal = document.getElementById("nameModal");
        if (show) {
            modal.classList.add("active");
        } else {
            modal.classList.remove("active");
        }
    },

    // Save progress to LocalStorage
    saveProgress() {
        localStorage.setItem("math_student_name", this.state.studentName);
        localStorage.setItem("math_completed_lessons", JSON.stringify(this.state.completedLessons));
        localStorage.setItem("math_completed_quizzes", JSON.stringify(this.state.completedQuizzes));
        localStorage.setItem("math_project_completed", JSON.stringify(this.state.projectCompleted));
        localStorage.setItem("math_theme", this.state.theme);
        
        this.updateOverallProgress();
    },

    // Load progress from LocalStorage
    loadProgress() {
        if (localStorage.getItem("math_student_name")) {
            this.state.studentName = localStorage.getItem("math_student_name");
        }
        if (localStorage.getItem("math_completed_lessons")) {
            this.state.completedLessons = JSON.parse(localStorage.getItem("math_completed_lessons"));
        }
        if (localStorage.getItem("math_completed_quizzes")) {
            this.state.completedQuizzes = JSON.parse(localStorage.getItem("math_completed_quizzes"));
        }
        if (localStorage.getItem("math_project_completed")) {
            this.state.projectCompleted = JSON.parse(localStorage.getItem("math_project_completed"));
        }
        if (localStorage.getItem("math_theme")) {
            this.state.theme = localStorage.getItem("math_theme");
        }

        // Apply UI values
        document.getElementById("userNameDisplay").innerText = this.state.studentName;
        document.getElementById("certStudentName").innerText = this.state.studentName;
        document.getElementById("studentNameInput").value = this.state.studentName;
        document.getElementById("inputStudentName").value = this.state.studentName;
        
        // Show current completion date
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById("certCompletionDate").innerText = new Date().toLocaleDateString('th-TH', options);
    },

    // Calculate progress and update overall progress bars
    updateOverallProgress() {
        // Count total steps: 8 topics + 4 quizzes + 1 final project = 13 points
        let totalPoints = 0;
        let earnedPoints = 0;

        lessonsData.forEach(unit => {
            totalPoints += unit.topics.length + 1; // topics + quiz
            
            unit.topics.forEach((_, idx) => {
                if (this.state.completedLessons[`${unit.id}-${idx}`]) earnedPoints++;
            });

            if (this.state.completedQuizzes[unit.id]) earnedPoints++;
        });

        // Add 1 point for project
        totalPoints += 1;
        if (this.state.projectCompleted) earnedPoints++;

        const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        
        // Update elements
        document.getElementById("overallProgressPercent").innerText = `${percent}%`;
        document.getElementById("overallProgressBar").style.width = `${percent}%`;

        // Update Home Screen Course Cards Dots
        this.updateHomeGridProgress();

        // Unlock Certificate navigation if project is complete
        const certLink = document.getElementById("nav-certificate");
        if (this.state.projectCompleted) {
            certLink.classList.remove("locked");
            certLink.querySelector(".lock-icon").style.display = "none";
        } else {
            certLink.classList.add("locked");
            certLink.querySelector(".lock-icon").style.display = "block";
        }
    },

    // Update dots on home screen card components
    updateHomeGridProgress() {
        lessonsData.forEach(unit => {
            const dotsContainer = document.getElementById(`unit-${unit.id}-dots`);
            const statusText = document.getElementById(`unit-${unit.id}-status`);
            if (!dotsContainer || !statusText) return;

            // Generate dots
            let dotsHtml = "";
            let completedCount = 0;
            
            unit.topics.forEach((_, idx) => {
                const isDone = this.state.completedLessons[`${unit.id}-${idx}`];
                if (isDone) completedCount++;
                dotsHtml += `<div class="dot ${isDone ? 'completed' : ''}"></div>`;
            });

            // Quiz dot
            const quizDone = this.state.completedQuizzes[unit.id];
            if (quizDone) completedCount++;
            dotsHtml += `<div class="dot ${quizDone ? 'completed' : ''}"></div>`;

            dotsContainer.innerHTML = dotsHtml;

            // Text
            const total = unit.topics.length + 1;
            if (completedCount === total) {
                statusText.innerText = "สำเร็จแล้ว";
                statusText.style.color = "var(--color-success)";
            } else if (completedCount > 0) {
                statusText.innerText = `คืบหน้า ${completedCount}/${total}`;
                statusText.style.color = "var(--color-warning)";
            } else {
                statusText.innerText = "ยังไม่เริ่ม";
                statusText.style.color = "var(--text-muted)";
            }
        });
    },

    // Apply active theme (Dark / Light)
    applyTheme() {
        document.documentElement.setAttribute("data-theme", this.state.theme);
    },

    // Hook SPA Tab Switching via URL hashes
    handleRouting() {
        const hash = window.location.hash.replace("#", "") || "home";
        
        // Prevent accessing locked certificate screen
        if (hash === "certificate" && !this.state.projectCompleted) {
            window.location.hash = "#home";
            alert("🔒 โปรดผ่านโครงงานสถาปนิกน้อยจัดสรรพื้นที่ (ประเมินผ่าน 100%) เพื่อเข้ารับเกียรติบัตร");
            return;
        }

        this.switchTab(hash);
    },

    // Switch visible tab panel
    switchTab(tabId, subParam = null) {
        // Toggle screens visibility
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        const targetScreen = document.getElementById(`screen-${tabId}`);
        if (targetScreen) targetScreen.classList.add("active");

        // Toggle nav links active states
        document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
            if (item.getAttribute("data-tab") === tabId) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        // Set Topbar Title
        const sectionTitles = {
            "home": "หน้าแรก",
            "lessons": "บทเรียน & กิจกรรม ป.5",
            "tools": "กล่องเครื่องมือทดลองคณิตศาสตร์",
            "project": "โครงงานสถาปนิกน้อย",
            "certificate": "เกียรติบัตรความสำเร็จ"
        };
        document.getElementById("currentSectionTitle").innerText = sectionTitles[tabId] || "หน้าแรก";

        // Scroll content area back to top
        document.querySelector(".screen-container").scrollTop = 0;

        // Custom screen initializations
        if (tabId === "lessons") {
            if (subParam !== null) {
                this.loadUnit(subParam);
            } else {
                this.loadLesson(this.currentUnitId, this.currentLessonIndex);
            }
        } else if (tabId === "tools") {
            this.loadSandboxTool("fraction");
        } else if (tabId === "project") {
            project.init();
        }

        // Close sidebar on mobile
        document.getElementById("sidebar").classList.remove("active");
    },

    // Generate Dynamic Sidebar Accordions for Lessons tab
    renderLessonsMenu() {
        const accordion = document.getElementById("lessonsAccordion");
        if (!accordion) return;

        accordion.innerHTML = lessonsData.map((unit, uIdx) => {
            const isQuizCompleted = this.state.completedQuizzes[unit.id];
            
            return `
                <div class="accordion-item ${this.currentUnitId === unit.id ? 'active' : ''}" id="unit-accordion-${unit.id}">
                    <button class="accordion-header" onclick="app.toggleAccordion(${unit.id})">
                        <span>${unit.title}</span>
                        <i data-lucide="chevron-down"></i>
                    </button>
                    <div class="accordion-collapse">
                        <div class="accordion-body">
                            ${unit.topics.map((t, tIdx) => {
                                const isDone = this.state.completedLessons[`${unit.id}-${tIdx}`];
                                return `
                                    <div class="lesson-link ${this.currentUnitId === unit.id && this.currentLessonIndex === tIdx ? 'active' : ''}" 
                                         onclick="app.loadLesson(${unit.id}, ${tIdx})">
                                        <i data-lucide="${isDone ? 'check-circle-2' : 'play-circle'}" class="${isDone ? 'completed' : ''}"></i>
                                        <span>${t.title}</span>
                                    </div>
                                `;
                            }).join('')}
                            <div class="lesson-link ${this.currentUnitId === unit.id && this.currentLessonIndex === 'quiz' ? 'active' : ''}" 
                                 onclick="app.loadQuiz(${unit.id})">
                                <i data-lucide="${isQuizCompleted ? 'award' : 'help-circle'}" class="${isQuizCompleted ? 'completed' : ''}"></i>
                                <span><strong>ควิซประเมินความรู้</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    },

    // Toggle accordion item expand/collapse
    toggleAccordion(unitId) {
        const items = document.querySelectorAll(".accordion-item");
        items.forEach((item, idx) => {
            if (idx === unitId) {
                item.classList.toggle("active");
            } else {
                item.classList.remove("active");
            }
        });
    },

    // Load a complete unit starting with its first topic
    loadUnit(unitId) {
        this.currentUnitId = unitId;
        this.currentLessonIndex = 0;
        this.loadLesson(unitId, 0);
        this.renderLessonsMenu();
    },

    // Load a specific sub-topic in the viewer
    loadLesson(unitId, topicIndex) {
        this.currentUnitId = unitId;
        this.currentLessonIndex = topicIndex;
        
        if (topicIndex === 'quiz') {
            this.loadQuiz(unitId);
            return;
        }

        const unit = lessonsData[unitId];
        const topic = unit.topics[topicIndex];

        // Save progress for this topic
        this.state.completedLessons[`${unitId}-${topicIndex}`] = true;
        this.saveProgress();

        // Update Breadcrumbs
        document.getElementById("breadcrumb-unit").innerText = `หน่วยที่ ${unitId + 1}`;
        document.getElementById("breadcrumb-topic").innerText = topic.title;

        // Render content
        const container = document.getElementById("lessonContentContainer");
        container.innerHTML = `
            <article class="lesson-article">
                <h2>${topic.title}</h2>
                ${topic.contentHtml}
            </article>
        `;

        // Render KaTeX Math formula
        renderMathFormulae();

        // Update UI link active highlight
        this.renderLessonsMenu();

        // Load Lucide Icons
        lucide.createIcons();

        // Contextual Right-panel interactive visualizer matching the lesson topic
        this.renderContextualVisualizer(topic.exampleType);

        // Scroll viewer back to top
        document.querySelector(".lesson-scroll-area").scrollTop = 0;
    },

    // Render the interactive tool in the lessons sidebar depending on content
    renderContextualVisualizer(type) {
        const panel = document.getElementById("miniToolContextContainer");
        if (!panel) return;

        if (type === "fraction") {
            visualizers.renderFraction("miniToolContextContainer");
        } else if (type === "decimal") {
            visualizers.renderDecimal("miniToolContextContainer");
        } else if (type === "percentage") {
            visualizers.renderPercentage("miniToolContextContainer");
        } else if (type === "geometry") {
            visualizers.renderGeometry("miniToolContextContainer");
        } else {
            panel.innerHTML = `<div class="fs-empty">ไม่มีเครื่องมือจำลองสำหรับหัวข้อนี้</div>`;
        }
        lucide.createIcons();
    },

    // Load Bloom's Quiz module
    loadQuiz(unitId) {
        this.currentUnitId = unitId;
        this.currentLessonIndex = 'quiz';
        
        document.getElementById("breadcrumb-unit").innerText = `หน่วยที่ ${unitId + 1}`;
        document.getElementById("breadcrumb-topic").innerText = "ควิซประเมินความรู้";
        
        this.renderLessonsMenu();
        
        // Contextual tool clean
        const panel = document.getElementById("miniToolContextContainer");
        if (panel) panel.innerHTML = `<div class="fs-empty">ไม่มีเครื่องมือประกอบในหน้าทำควิซ</div>`;

        // Start Quiz Engine
        quiz.init(unitId);
    },

    // Complete unit and unlock subsequent resources
    completeUnit(unitId) {
        this.state.completedQuizzes[unitId] = true;
        this.saveProgress();
        this.updateOverallProgress();
        this.renderLessonsMenu();
    },

    // Complete capstone project
    completeProject() {
        this.state.projectCompleted = true;
        this.saveProgress();
        this.updateOverallProgress();
    },

    // Load active tool inside the sandbox tab
    loadSandboxTool(toolKey) {
        const viewportId = "sandboxViewport";
        if (toolKey === "fraction") {
            visualizers.renderFraction(viewportId);
        } else if (toolKey === "decimal") {
            visualizers.renderDecimal(viewportId);
        } else if (toolKey === "percentage") {
            visualizers.renderPercentage(viewportId);
        } else {
            visualizers.renderGeometry(viewportId);
        }
        lucide.createIcons();
    },

    // Bind event listeners to global static UI elements
    bindGlobalEvents() {
        // Sidebar Mobile Drawer togglers
        const toggleBtn = document.getElementById("mobileMenuToggleBtn");
        const closeBtn = document.getElementById("mobileCloseBtn");
        const sidebar = document.getElementById("sidebar");

        toggleBtn.addEventListener("click", () => sidebar.classList.add("active"));
        closeBtn.addEventListener("click", () => sidebar.classList.remove("active"));

        // Sidebar Navigation click router links
        document.querySelectorAll(".sidebar-nav .nav-item").forEach(link => {
            link.addEventListener("click", (e) => {
                if (link.classList.contains("locked")) {
                    e.preventDefault();
                    alert("🔒 โปรดคำนวณแบ่งพิมพ์เขียวในโครงงานสถาปนิกน้อยให้ผ่าน 100% เพื่อเข้าถึงเกียรติบัตร");
                    return;
                }
                const tab = link.getAttribute("data-tab");
                window.location.hash = `#${tab}`;
            });
        });

        // Dark/Light Theme Switcher Toggle
        document.getElementById("themeToggleBtn").addEventListener("click", () => {
            this.state.theme = this.state.theme === "dark" ? "light" : "dark";
            this.applyTheme();
            this.saveProgress();
        });

        // Edit Name Btn in Footer
        document.getElementById("userEditNameBtn").addEventListener("click", () => {
            this.showNameModal(true);
        });

        // Save Name Modal Accept Button
        document.getElementById("saveNameModalBtn").addEventListener("click", () => {
            const input = document.getElementById("inputStudentName");
            let nameVal = input.value.trim();
            if (nameVal === "") nameVal = "ผู้เรียนคณิตศาสตร์";

            this.state.studentName = nameVal;
            this.saveProgress();
            this.showNameModal(false);
        });

        // Sandbox screen tab selectors
        document.querySelectorAll(".tool-tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll(".tool-tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const tool = btn.getAttribute("data-tool");
                this.loadSandboxTool(tool);
            });
        });

        // Certificate Name Updater Form
        document.getElementById("updateCertNameBtn").addEventListener("click", () => {
            const input = document.getElementById("studentNameInput");
            const nameVal = input.value.trim() || "ผู้เรียนคณิตศาสตร์";
            
            this.state.studentName = nameVal;
            document.getElementById("certStudentName").innerText = nameVal;
            document.getElementById("userNameDisplay").innerText = nameVal;
            this.saveProgress();
            
            alert("อัปเดตชื่อในใบประกาศเกียรติบัตรเรียบร้อยแล้ว!");
        });

        // Download Certificate as PNG image using html2canvas
        document.getElementById("downloadPngBtn").addEventListener("click", () => {
            const certElement = document.getElementById("certificatePrintArea");
            
            html2canvas(certElement, {
                scale: 2, // Increase resolution
                useCORS: true
            }).then(canvas => {
                const link = document.createElement("a");
                link.download = `cert-math-${this.state.studentName.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            });
        });

        // Download Certificate as PDF using html2canvas and jsPDF (Wraps captured canvas)
        document.getElementById("downloadPdfBtn").addEventListener("click", () => {
            const certElement = document.getElementById("certificatePrintArea");
            
            html2canvas(certElement, {
                scale: 2,
                useCORS: true
            }).then(canvas => {
                const imgData = canvas.toDataURL("image/png");
                
                // Certificate size is 680x480 (aspect ratio roughly 1.41, matches standard landscape A4 paper format)
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const imgWidth = 297; // A4 landscape width in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width; // proportional height
                
                const yOffset = (210 - imgHeight) / 2; // Center vertically
                
                pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
                pdf.save(`cert-math-${this.state.studentName.replace(/\s+/g, '_')}.pdf`);
            });
        });

        // Navigate Next/Prev Topic lesson footers
        document.getElementById("prevLessonBtn").addEventListener("click", () => this.navigateLesson(-1));
        document.getElementById("nextLessonBtn").addEventListener("click", () => this.navigateLesson(1));
    },

    // Handler for next and prev lesson arrow buttons
    navigateLesson(direction) {
        if (this.currentLessonIndex === 'quiz') {
            if (direction === -1) {
                // Load last topic of current unit
                const unit = lessonsData[this.currentUnitId];
                this.loadLesson(this.currentUnitId, unit.topics.length - 1);
            }
            return;
        }

        const unit = lessonsData[this.currentUnitId];
        const nextIdx = this.currentLessonIndex + direction;

        if (nextIdx >= 0 && nextIdx < unit.topics.length) {
            this.loadLesson(this.currentUnitId, nextIdx);
        } else if (nextIdx >= unit.topics.length) {
            // Load Quiz for this unit
            this.loadQuiz(this.currentUnitId);
        } else if (nextIdx < 0) {
            // Go to prev unit quiz if current unit is not first
            if (this.currentUnitId > 0) {
                const prevUnit = lessonsData[this.currentUnitId - 1];
                this.currentUnitId--;
                this.loadQuiz(this.currentUnitId);
            }
        }
    }
};

// Launch App on DOM Load
window.addEventListener("DOMContentLoaded", () => {
    app.init();
});

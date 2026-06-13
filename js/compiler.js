// Pyodide Python Compiler Service
const compiler = {
    pyodideInstance: null,
    isLoading: false,
    isReady: false,
    stdoutBuffer: "",
    stderrBuffer: "",
    mockInputs: [],
    isGradingMode: false,

    // Initialize Pyodide compiler
    async init(onStatusChange) {
        if (this.pyodideInstance) return;
        
        this.isLoading = true;
        if (onStatusChange) onStatusChange("loading", "กำลังเตรียมระบบสภาพแวดล้อม Python...");

        try {
            // Load Pyodide from JS CDN
            this.pyodideInstance = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
            });

            // Set up standard input and output streams
            window.promptUser = (promptText) => {
                if (this.isGradingMode) {
                    if (this.mockInputs.length > 0) {
                        const val = this.mockInputs.shift();
                        this.stdoutBuffer += `${promptText}${val}\n`;
                        return val;
                    }
                    throw new Error(" grading error: no mock inputs left for prompt '" + promptText + "'");
                } else {
                    const userInput = prompt(promptText || "กรอกข้อมูลเข้าโปรแกรม Python:");
                    const val = userInput !== null ? userInput : "";
                    this.stdoutBuffer += `${promptText}${val}\n`;
                    return val;
                }
            };

            // Inject Custom Mock Input in Python Builtins
            await this.pyodideInstance.runPythonAsync(`
                import builtins
                import js

                def custom_input(prompt=""):
                    return js.promptUser(prompt)

                builtins.input = custom_input
            `);

            // Set up stdout/stderr captures
            this.pyodideInstance.setStdout({
                batched: (text) => {
                    this.stdoutBuffer += text + "\n";
                }
            });

            this.pyodideInstance.setStderr({
                batched: (text) => {
                    this.stderrBuffer += text + "\n";
                }
            });

            this.isReady = true;
            this.isLoading = false;
            if (onStatusChange) onStatusChange("ready", "ตัวแปลภาษา Python พร้อมใช้งาน!");
        } catch (error) {
            console.error("Pyodide Load Failed:", error);
            this.isLoading = false;
            if (onStatusChange) onStatusChange("error", "โหลด Pyodide ล้มเหลว โปรดรีเฟรชหน้าเว็บ");
        }
    },

    // Run python code and return outputs and filesystem state
    async run(code, mockInputs = null) {
        if (!this.isReady) {
            return {
                success: false,
                stdout: "",
                stderr: "ระบบยังไม่พร้อมแปลภาษา กรุณารอสักครู่...",
                files: []
            };
        }

        // Clear output buffers
        this.stdoutBuffer = "";
        this.stderrBuffer = "";

        if (mockInputs && Array.isArray(mockInputs)) {
            this.isGradingMode = true;
            this.mockInputs = [...mockInputs];
        } else {
            this.isGradingMode = false;
            this.mockInputs = [];
        }

        let success = true;
        try {
            // Run code in isolated namespace
            await this.pyodideInstance.runPythonAsync(code);
        } catch (err) {
            success = false;
            this.stderrBuffer += err.message;
        }

        // Retrieve current virtual files in working directory
        const virtualFiles = this.getVirtualFiles();

        return {
            success: success && this.stderrBuffer === "",
            stdout: this.stdoutBuffer,
            stderr: this.stderrBuffer,
            files: virtualFiles
        };
    },

    // Scan Emscripten FS home directory for created files
    getVirtualFiles() {
        if (!this.pyodideInstance) return [];

        const FS = this.pyodideInstance.FS;
        const workdir = '/home/pyodide';
        
        try {
            // Make sure the workdir exists
            if (!FS.analyzePath(workdir).exists) {
                return [];
            }

            const items = FS.readdir(workdir);
            const userFiles = [];

            for (const name of items) {
                // Skip default dot directories
                if (name === '.' || name === '..') continue;

                const path = `${workdir}/${name}`;
                const stat = FS.stat(path);

                // Check if it's a regular file
                if (FS.isFile(stat.mode)) {
                    let content = "";
                    try {
                        content = FS.readFile(path, { encoding: 'utf8' });
                    } catch (e) {
                        content = "[ไม่สามารถอ่านเนื้อหาไฟล์ได้]";
                    }

                    userFiles.push({
                        name: name,
                        path: path,
                        size: stat.size,
                        content: content
                    });
                }
            }
            return userFiles;
        } catch (error) {
            console.error("FS scanning error:", error);
            return [];
        }
    },

    // Helper to read a specific virtual file
    readFile(fileName) {
        if (!this.pyodideInstance) return null;
        const FS = this.pyodideInstance.FS;
        const path = `/home/pyodide/${fileName}`;
        try {
            if (FS.analyzePath(path).exists) {
                return FS.readFile(path, { encoding: 'utf8' });
            }
        } catch (e) {
            console.error("Read file error:", e);
        }
        return null;
    },

    // Helper to remove a file if needed
    deleteFile(fileName) {
        if (!this.pyodideInstance) return;
        const FS = this.pyodideInstance.FS;
        const path = `/home/pyodide/${fileName}`;
        try {
            if (FS.analyzePath(path).exists) {
                FS.unlink(path);
            }
        } catch (e) {
            console.error("Delete file error:", e);
        }
    }
};

const display = document.getElementById("display");
const expressionOutput = document.getElementById("expression");
const statusText = document.getElementById("statusText");
const historyList = document.getElementById("historyList");
let expression = "";
let memory = 0;
let justCalculated = false;

function render() {
    display.textContent = expression || "0";
    expressionOutput.textContent = expression.replaceAll("*", "×").replaceAll("/", "÷");
}

function appendValue(value) {
    if (justCalculated && /[0-9.]/.test(value)) expression = "";
    justCalculated = false;
    if (value === "." && /(?:^|[+\-*/])\d*\.\d*$/.test(expression)) return;
    if (/[+\-*/]/.test(value) && /[+\-*/]$/.test(expression)) expression = expression.slice(0, -1);
    if (value === "%" && (!expression || /[+\-*/%]$/.test(expression))) return;
    expression += value;
    statusText.textContent = "Editing";
    render();
}

function clearDisplay() { expression = ""; justCalculated = false; statusText.textContent = "Ready"; render(); }
function deleteLast() { expression = expression.slice(0, -1); statusText.textContent = "Editing"; render(); }

function evaluateExpression(value) {
    const normalized = value.replace(/(\d+(?:\.\d+)?)%/g, "($1/100");
    const percentFix = normalized.replace(/\(([^()]*)\/100/g, "($1/100)");
    if (!/^[0-9+*/().%\-\s]+$/.test(value) || /[+\-*/.]$/.test(value)) throw new Error("Invalid expression");
    const result = Function(`"use strict"; return (${percentFix})`)();
    if (!Number.isFinite(result)) throw new Error("Invalid result");
    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(10)));
}

function calculate() {
    if (!expression) return;
    const input = expression;
    try {
        const result = evaluateExpression(input);
        addHistory(input, result);
        expressionOutput.textContent = `${input.replaceAll("*", "×").replaceAll("/", "÷")} =`;
        expression = result;
        display.textContent = result;
        statusText.textContent = "Calculated";
        justCalculated = true;
    } catch { statusText.textContent = "Try again"; display.textContent = "Error"; }
}

function addHistory(input, result) {
    const empty = historyList.querySelector(".empty-history");
    if (empty) empty.remove();
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `<div class="history-expression">${input.replaceAll("*", "×").replaceAll("/", "÷")}</div><div class="history-result">${result}</div>`;
    item.addEventListener("click", () => { expression = result; justCalculated = true; render(); });
    historyList.prepend(item);
}

document.querySelector(".buttons").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.value) appendValue(button.dataset.value);
    if (button.dataset.action === "clear") clearDisplay();
    if (button.dataset.action === "delete") deleteLast();
    if (button.dataset.action === "sign") expression = expression.startsWith("-") ? expression.slice(1) : `-${expression}`; render();
    if (button.dataset.action === "calculate") calculate();
});

document.querySelector(".memory-row").addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (!action) return;
    const value = Number(expression) || 0;
    if (action === "memory-clear") memory = 0;
    if (action === "memory-recall") { expression = String(memory); render(); }
    if (action === "memory-add") memory += value;
    if (action === "memory-subtract") memory -= value;
    statusText.textContent = action === "memory-recall" ? "Memory recalled" : "Memory saved";
});

document.addEventListener("keydown", (event) => {
    if (/^[0-9.]$/.test(event.key) || "+-*/%".includes(event.key)) appendValue(event.key);
    if (event.key === "Enter" || event.key === "=") { event.preventDefault(); calculate(); }
    if (event.key === "Backspace") deleteLast();
    if (event.key === "Escape") clearDisplay();
});
document.getElementById("clearHistory").addEventListener("click", () => { historyList.innerHTML = '<p class="empty-history">Your recent calculations will appear here.</p>'; });
document.getElementById("themeToggle").addEventListener("click", () => document.body.classList.toggle("dark"));
document.getElementById("copyResult").addEventListener("click", async () => { await navigator.clipboard?.writeText(display.textContent); statusText.textContent = "Copied"; });
render();
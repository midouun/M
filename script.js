let appState = {
    method: 'newton',
    steps: [],
    currentStep: -1,
    root: null
};

// دوال مساعدة
function f(expr, x) {
    try { return math.evaluate(expr, { x: x }); } catch { return NaN; }
}
function df(expr, x) {
    const h = 1e-6; return (f(expr, x + h) - f(expr, x)) / h;
}

// تحديث الرموز الرياضية
function updateMath() {
    let eq = document.getElementById('eq').value;
    let el = document.getElementById('latex-view');
    el.innerHTML = `$$f(x) = ${eq.replace(/\*/g, '').replace(/x\^(\d+)/g, 'x^{$1}$$')}`;
    if(window.MathJax) MathJax.typesetPromise([el]);
    drawBasePlot();
}

// تبديل الأوضاع
function setMode(mode, btn) {
    appState.method = mode;
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.getElementById('params-newton').classList.toggle('hidden', mode !== 'newton');
    document.getElementById('params-bisection').classList.toggle('hidden', mode !== 'bisection');
}

// بدء الحساب
function startSimulation() {
    const eq = document.getElementById('eq').value;
    const tol = parseFloat(document.getElementById('tol').value);
    const max = parseInt(document.getElementById('max').value);
    
    appState.steps = [];
    appState.currentStep = -1;

    try {
        if (appState.method === 'newton') {
            solveNewton(eq, tol, max);
        } else {
            solveBisection(eq, tol, max);
        }
        
        // إظهار النتائج
        document.getElementById('sim-controls').classList.remove('hidden');
        document.getElementById('res-card').classList.remove('hidden');
        
        document.getElementById('final-root').innerText = appState.root.toFixed(7);
        document.getElementById('final-iter').innerText = appState.steps.length;
        document.getElementById('final-func').innerText = f(eq, appState.root).toExponential(2);
        
        buildTable();
        updateStepUI();
        step(1); // البدء بأول خطوة تلقائياً

    } catch (e) {
        alert("خطأ في المعادلة: " + e.message);
    }
}

function solveNewton(eq, tol, max) {
    let x = parseFloat(document.getElementById('x0').value);
    for (let i = 0; i < max; i++) {
        let fx = f(eq, x);
        let dfx = df(eq, x);
        if (Math.abs(dfx) < 1e-10) break;
        let x_new = x - (fx / dfx);
        
        appState.steps.push({
            iter: i+1, type: 'newton', x_curr: x, fx: fx, x_next: x_new,
            desc: `تكرار ${i+1}: المماس يقطع المحور في ${x_new.toFixed(4)}`
        });

        if (Math.abs(x_new - x) < tol) { x = x_new; break; }
        x = x_new;
    }
    appState.root = x;
}

function solveBisection(eq, tol, max) {
    let a = parseFloat(document.getElementById('a').value);
    let b = parseFloat(document.getElementById('b').value);
    
    if (f(eq, a) * f(eq, b) >= 0) { throw new Error("يجب أن يكون f(a)*f(b) < 0"); }

    for (let i = 0; i < max; i++) {
        let c = (a + b) / 2;
        let fc = f(eq, c);
        
        appState.steps.push({
            iter: i+1, type: 'bisection', a: a, b: b, c: c,
            desc: `تكرار ${i+1}: المجال [${a.toFixed(3)}, ${b.toFixed(3)}]`
        });

        if (Math.abs(fc) < 1e-15 || Math.abs(b - a) < tol) { appState.root = c; break; }
        if (f(eq, a) * fc < 0) b = c; else a = c;
    }
    if (!appState.root) appState.root = (a+b)/2;
}

// التحكم في المحاكاة
function step(dir) {
    let newIdx = appState.currentStep + dir;
    if (newIdx < 0 || newIdx >= appState.steps.length) return;
    appState.currentStep = newIdx;
    updateStepUI();
    visualizeStep(appState.steps[newIdx]);
}

function updateStepUI() {
    document.getElementById('step-counter').innerText = `${appState.currentStep + 1} / ${appState.steps.length}`;
    if (appState.currentStep >= 0) {
        document.getElementById('step-desc').innerText = appState.steps[appState.currentStep].desc;
    }
}

// الرسم البياني
function drawBasePlot() {
    const eq = document.getElementById('eq').value;
    let x0 = parseFloat(document.getElementById('x0').value) || 0;
    
    let xV = [], yV = [];
    for(let x=x0-5; x<=x0+5; x+=0.1) { xV.push(x); yV.push(f(eq, x)); }

    let trace = { x: xV, y: yV, type: 'scatter', line: {color: '#3b82f6'}, name: 'f(x)' };
    let layout = {
        paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: {color: '#94a3b8', gridcolor: '#334155'},
        yaxis: {color: '#94a3b8', gridcolor: '#334155'},
        margin: {t:20, l:40, r:20, b:40}
    };
    
    Plotly.newPlot('plot', [trace], layout, {responsive: true});
    
    document.getElementById('plot').on('plotly_click', function(data){
        let pt = data.points[0].x;
        document.getElementById('x0').value = pt.toFixed(2);
        startSimulation();
    });
}

function visualizeStep(s) {
    const eq = document.getElementById('eq').value;
    let shapes = [];
    let annotations = [];

    if (s.type === 'newton') {
        shapes.push({ type: 'line', x0: s.x_curr, y0: s.fx, x1: s.x_next, y1: 0, line: {color: '#10b981', width: 2, dash: 'dot'} });
        shapes.push({ type: 'line', x0: s.x_next, y0: 0, x1: s.x_next, y1: f(eq, s.x_next), line: {color: '#aaa', width: 1, dash: 'dash'} });
    } else {
        shapes.push({ type: 'rect', x0: s.a, x1: s.b, y0: -10, y1: 10, fillcolor: 'rgba(16, 185, 129, 0.1)', line: {width: 0} });
        shapes.push({ type: 'line', x0: s.c, x1: s.c, y0: -10, y1: 10, line: {color: 'red', width: 2} });
    }
    
    Plotly.relayout('plot', {shapes: shapes});
}

function buildTable() {
    const tbody = document.querySelector('#res-table tbody');
    const thead = document.querySelector('#res-table thead');
    tbody.innerHTML = '';
    
    if (appState.method === 'newton') {
        thead.innerHTML = `<tr><th>#</th><th>x_old</th><th>f(x)</th><th>x_new</th></tr>`;
        appState.steps.forEach(s => tbody.innerHTML += `<tr><td>${s.iter}</td><td>${s.x_curr.toFixed(5)}</td><td>${s.fx.toExponential(2)}</td><td>${s.x_next.toFixed(5)}</td></tr>`);
    } else {
        thead.innerHTML = `<tr><th>#</th><th>a</th><th>b</th><th>c</th></tr>`;
        appState.steps.forEach(s => tbody.innerHTML += `<tr><td>${s.iter}</td><td>${s.a.toFixed(4)}</td><td>${s.b.toFixed(4)}</td><td>${s.c.toFixed(4)}</td></tr>`);
    }
}

// تهيئة عند التحميل
updateMath();

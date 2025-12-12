// --- إدارة التنقل والواجهة ---
function goToApp() {
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-interface');
    
    // تأثير الخروج
    landing.classList.add('fade-out');
    
    setTimeout(() => {
        landing.classList.add('hidden');
        app.classList.remove('hidden');
        app.classList.add('fade-in');
        
        // إعادة تهيئة الرسم ليأخذ الحجم الصحيح
        if(window.Plotly) Plotly.relayout('plotArea', {autosize: true});
    }, 500);
}

function goHome() {
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-interface');
    
    app.classList.add('hidden');
    app.classList.remove('fade-in');
    
    landing.classList.remove('hidden');
    landing.classList.remove('fade-out');
}

function setMethod(method, btn) {
    document.getElementById('selectedMethod').value = method;
    
    // تحديث الأزرار
    document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // تبديل المدخلات
    if(method === 'bisection') {
        document.getElementById('bisection-inputs').classList.remove('hidden');
        document.getElementById('newton-inputs').classList.add('hidden');
    } else {
        document.getElementById('bisection-inputs').classList.add('hidden');
        document.getElementById('newton-inputs').classList.remove('hidden');
    }
}

// --- المنطق الرياضي (نفس المنطق القوي السابق) ---
function f(expr, x) {
    try { return math.evaluate(expr, { x: x }); } catch { return NaN; }
}
function df(expr, x) {
    const h = 1e-6; return (f(expr, x + h) - f(expr, x)) / h;
}

let stepsData = [];

function solve() {
    const expr = document.getElementById('equation').value;
    const method = document.getElementById('selectedMethod').value;
    const tol = parseFloat(document.getElementById('tolerance').value);
    const maxIter = parseInt(document.getElementById('maxIter').value);
    
    const tableDiv = document.getElementById('tableContainer');
    const tbody = document.querySelector('#resultsTable tbody');
    const thead = document.querySelector('#resultsTable thead');
    const resBox = document.getElementById('quick-result');
    const resVal = document.getElementById('res-val');
    
    stepsData = [];
    tbody.innerHTML = '';
    
    let root = null;
    let converged = false;
    let chartCenter = 0;

    try {
        if (method === 'bisection') {
            let a = parseFloat(document.getElementById('a').value);
            let b = parseFloat(document.getElementById('b').value);
            chartCenter = (a+b)/2;

            if (f(expr, a) * f(expr, b) >= 0) {
                alert("يجب أن تختلف إشارة الدالة بين طرفي المجال!"); return;
            }

            thead.innerHTML = `<tr><th>#</th><th>a</th><th>b</th><th>c (Root)</th><th>Error</th></tr>`;
            
            for(let i=1; i<=maxIter; i++) {
                let c = (a + b) / 2;
                let fc = f(expr, c);
                let err = Math.abs(b - a);
                stepsData.push({iter:i, v1:a, v2:b, root:c, err:err});
                
                tbody.innerHTML += `<tr><td>${i}</td><td>${a.toFixed(4)}</td><td>${b.toFixed(4)}</td><td style="color:#34d399">${c.toFixed(6)}</td><td>${err.toExponential(2)}</td></tr>`;
                
                if(Math.abs(fc) < 1e-15 || err < tol) { root = c; converged = true; break; }
                if(f(expr, a) * fc < 0) b = c; else a = c;
            }

        } else {
            let x = parseFloat(document.getElementById('x0').value);
            chartCenter = x;
            thead.innerHTML = `<tr><th>#</th><th>x_old</th><th>f(x)</th><th>x_new</th><th>Error</th></tr>`;
            
            for(let i=1; i<=maxIter; i++) {
                let fx = f(expr, x);
                let dfx = df(expr, x);
                if(Math.abs(dfx) < 1e-10) break;
                
                let x_new = x - (fx/dfx);
                let err = Math.abs(x_new - x);
                stepsData.push({iter:i, v1:x, v2:fx, root:x_new, err:err});
                
                tbody.innerHTML += `<tr><td>${i}</td><td>${x.toFixed(5)}</td><td>${fx.toExponential(2)}</td><td style="color:#34d399">${x_new.toFixed(6)}</td><td>${err.toExponential(2)}</td></tr>`;
                
                x = x_new;
                if(err < tol) { root = x; converged = true; break; }
            }
        }

        if(converged) {
            resVal.innerText = root.toFixed(7);
            resBox.classList.remove('hidden');
            tableDiv.classList.remove('hidden');
            drawChart(expr, root, chartCenter);
        } else {
            alert("لم يتقارب الحل.");
        }

    } catch(e) { alert("تأكد من المعادلة"); }
}

function drawChart(expr, root, center) {
    let xVals = [], yVals = [];
    for(let x = center-5; x <= center+5; x+=0.1) {
        xVals.push(x); yVals.push(f(expr, x));
    }
    
    let trace1 = { x: xVals, y: yVals, type: 'scatter', line: {color: '#6366f1'} };
    let trace2 = { x: [root], y: [0], mode: 'markers', marker: {color: '#34d399', size: 10} };
    
    let layout = {
        title: { text: 'الرسم البياني', font: {color: '#fff'} },
        paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: {color: '#fff', gridcolor: '#333'}, yaxis: {color: '#fff', gridcolor: '#333'},
        margin: {t:40, l:40, r:20, b:40}, showlegend: false
    };
    
    Plotly.newPlot('plotArea', [trace1, trace2], layout, {responsive: true});
}

function exportCSV() {
    let csv = "Iter,Val1,Val2,Root,Error\n" + stepsData.map(s => `${s.iter},${s.v1},${s.v2},${s.root},${s.err}`).join("\n");
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    link.download = "result.csv";
    link.click();
}

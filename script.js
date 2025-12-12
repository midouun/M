// دوال المساعدة الرياضية
function f(expr, x) {
    try { return math.evaluate(expr, { x: x }); } catch (e) { return NaN; }
}
function df(expr, x) {
    const h = 0.000001; return (f(expr, x + h) - f(expr, x)) / h;
}

// عرض المعادلة
function renderMath() {
    let expr = document.getElementById('equation').value;
    let latex = expr.replace(/\*/g, '').replace(/x\^(\d+)/g, 'x^{$1}');
    document.getElementById('mathPreview').innerHTML = `$$f(x) = ${latex}$$`;
    if(window.MathJax) MathJax.typesetPromise([document.getElementById('mathPreview')]);
}

// تبديل الجداول
function showTab(type) {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + type).classList.add('active');
    event.target.classList.add('active');
}

// --- المحرك الرئيسي ---
function solveAll() {
    const expr = document.getElementById('equation').value;
    const aInput = parseFloat(document.getElementById('a').value);
    const bInput = parseFloat(document.getElementById('b').value);
    const x0Input = parseFloat(document.getElementById('x0').value);
    const tol = parseFloat(document.getElementById('tolerance').value);
    
    // 1. حساب طريقة التنصيف
    let biData = [];
    let a = aInput, b = bInput;
    let biRoot = null;
    
    if (f(expr, a) * f(expr, b) < 0) {
        let iter = 0;
        while (iter < 50) {
            iter++;
            let c = (a + b) / 2;
            let err = Math.abs(b - a);
            biData.push({iter, err, val: c});
            if (f(expr, c) === 0 || err < tol) { biRoot = c; break; }
            if (f(expr, a) * f(expr, c) < 0) b = c; else a = c;
        }
    } else {
        alert("تنبيه: طريقة التنصيف تتطلب f(a)*f(b) < 0");
    }

    // 2. حساب طريقة نيوتن
    let newData = [];
    let x = x0Input;
    let newRoot = null;
    let nIter = 0;
    
    while (nIter < 50) {
        nIter++;
        let fx = f(expr, x);
        let dfx = df(expr, x);
        if (Math.abs(dfx) < 1e-10) break;
        
        let x_new = x - (fx / dfx);
        let err = Math.abs(x_new - x);
        newData.push({iter: nIter, err, val: x_new});
        
        x = x_new;
        if (err < tol) { newRoot = x; break; }
    }

    // 3. تحديث الواجهة
    updateUI(biData, biRoot, newData, newRoot);
}

function updateUI(biData, biRoot, newData, newRoot) {
    // البطاقات
    document.getElementById('res_bi_root').innerText = biRoot ? biRoot.toFixed(6) : "فشل";
    document.getElementById('res_bi_iter').innerText = biData.length;
    
    document.getElementById('res_new_root').innerText = newRoot ? newRoot.toFixed(6) : "فشل";
    document.getElementById('res_new_iter').innerText = newData.length;

    // الجداول
    fillTable('tableBi', biData, ['iter', 'val', 'err'], ['#', 'c (Root)', 'Error']);
    fillTable('tableNew', newData, ['iter', 'val', 'err'], ['#', 'x_new', 'Error']);

    // الرسم البياني للمقارنة
    plotComparison(biData, newData);
}

function fillTable(id, data, keys, headers) {
    const table = document.getElementById(id);
    table.querySelector('thead').innerHTML = `<tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>`;
    table.querySelector('tbody').innerHTML = data.map(row => `
        <tr>
            <td>${row.iter}</td>
            <td style="font-weight:bold">${row.val.toFixed(6)}</td>
            <td>${row.err.toExponential(2)}</td>
        </tr>
    `).join('');
}

function plotComparison(biData, newData) {
    let trace1 = {
        x: biData.map(d => d.iter),
        y: biData.map(d => d.err),
        mode: 'lines+markers', name: 'التنصيف (Bisection)',
        line: {color: '#3b82f6'}
    };
    
    let trace2 = {
        x: newData.map(d => d.iter),
        y: newData.map(d => d.err),
        mode: 'lines+markers', name: 'نيوتن (Newton)',
        line: {color: '#10b981'}
    };

    let layout = {
        title: {text: 'مقارنة سرعة تقارب الخطأ (Error Convergence)', font: {color: '#fff'}},
        xaxis: {title: 'عدد التكرارات', color: '#fff'},
        yaxis: {title: 'قيمة الخطأ (Log Scale)', type: 'log', color: '#fff'}, // مقياس لوغاريتمي مهم جداً
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        legend: {font: {color: '#fff'}}
    };

    Plotly.newPlot('convergencePlot', [trace1, trace2], layout, {responsive: true, displayModeBar: false});
}

renderMath();

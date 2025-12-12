let currentSteps = [];

// دالة لتحديث عرض المعادلة الرياضية باستخدام MathJax
function renderMath() {
    let input = document.getElementById('equation').value;
    // تحويل الصيغة البرمجية إلى صيغة LaTeX بسيطة
    let latex = input.replace(/\*/g, '')
                     .replace(/x\^(\d+)/g, 'x^{$1}')
                     .replace(/sqrt\((.+?)\)/g, '\\sqrt{$1}')
                     .replace(/pi/g, '\\pi');
    
    const preview = document.getElementById('mathPreview');
    preview.innerHTML = `$$f(x) = ${latex}$$`;
    
    // إعادة المعالجة للعرض
    if (window.MathJax) {
        MathJax.typesetPromise([preview]);
    }
}

function f(expr, x) {
    try { return math.evaluate(expr, { x: x }); } 
    catch (e) { return NaN; }
}

function df(expr, x) {
    const h = 0.000001;
    return (f(expr, x + h) - f(expr, x)) / h;
}

function toggleInputs() {
    const method = document.getElementById('methodSelect').value;
    const bisect = document.getElementById('bisectionInputs');
    const newt = document.getElementById('newtonInputs');
    
    if (method === 'bisection') {
        bisect.classList.remove('hidden');
        newt.classList.add('hidden');
    } else {
        bisect.classList.add('hidden');
        newt.classList.remove('hidden');
    }
}

function solve() {
    const expr = document.getElementById('equation').value;
    const method = document.getElementById('methodSelect').value;
    const tol = parseFloat(document.getElementById('tolerance').value);
    const maxIter = parseInt(document.getElementById('maxIter').value);
    
    const tableCard = document.getElementById('tableCard');
    const tbody = document.querySelector('#resultsTable tbody');
    const head = document.querySelector('#resultsTable thead');
    const resultBox = document.getElementById('resultBox');
    
    currentSteps = [];
    tbody.innerHTML = '';
    resultBox.classList.add('hidden');
    
    let root = null;
    let converged = false;

    try {
        if (method === 'bisection') {
            let a = parseFloat(document.getElementById('a').value);
            let b = parseFloat(document.getElementById('b').value);

            if (f(expr, a) * f(expr, b) >= 0) {
                alert("⚠️ خطأ: يجب أن تختلف إشارة الدالة بين طرفي المجال!");
                return;
            }

            head.innerHTML = `<tr><th>#</th><th>a</th><th>b</th><th>c (Root)</th><th>f(c)</th><th>Error</th></tr>`;
            
            let iter = 0;
            do {
                iter++;
                let c = (a + b) / 2;
                let fc = f(expr, c);
                let error = Math.abs(b - a);
                
                currentSteps.push({iter, v1: a, v2: b, res: c, fres: fc, err: error});
                
                let row = `<tr>
                    <td>${iter}</td>
                    <td>${a.toFixed(4)}</td>
                    <td>${b.toFixed(4)}</td>
                    <td style="color:var(--success); font-weight:bold">${c.toFixed(6)}</td>
                    <td>${fc.toExponential(2)}</td>
                    <td>${error.toExponential(2)}</td>
                </tr>`;
                tbody.innerHTML += row;

                if (fc === 0 || error < tol) { root = c; converged = true; break; }
                if (f(expr, a) * fc < 0) b = c; else a = c;
            } while (iter < maxIter);

        } else {
            let x = parseFloat(document.getElementById('x0').value);
            head.innerHTML = `<tr><th>#</th><th>x_old</th><th>f(x)</th><th>f'(x)</th><th>x_new</th><th>Error</th></tr>`;
            
            let iter = 0;
            do {
                iter++;
                let fx = f(expr, x);
                let dfx = df(expr, x);
                if (Math.abs(dfx) < 1e-10) break;

                let x_new = x - (fx / dfx);
                let error = Math.abs(x_new - x);

                currentSteps.push({iter, v1: x, v2: fx, res: x_new, fres: dfx, err: error});

                let row = `<tr>
                    <td>${iter}</td>
                    <td>${x.toFixed(5)}</td>
                    <td>${fx.toExponential(2)}</td>
                    <td>${dfx.toFixed(4)}</td>
                    <td style="color:var(--success); font-weight:bold">${x_new.toFixed(6)}</td>
                    <td>${error.toExponential(2)}</td>
                </tr>`;
                tbody.innerHTML += row;

                x = x_new;
                if (error < tol) { root = x; converged = true; break; }
            } while (iter < maxIter);
        }

        if (converged) {
            document.getElementById('rootValue').innerText = root.toFixed(7);
            resultBox.classList.remove('hidden');
            tableCard.classList.remove('hidden');
            drawChart(expr, root, method);
        } else {
            alert("لم يتم الوصول للحل ضمن عدد التكرارات المحدد.");
        }

    } catch (e) {
        console.error(e);
        alert("تأكد من صحة المعادلة.");
    }
}

function drawChart(expr, root, method) {
    let center = root || 0;
    let range = 4;
    let xVals = [], yVals = [];
    
    for (let x = center - range; x <= center + range; x += 0.1) {
        xVals.push(x);
        yVals.push(f(expr, x));
    }

    let trace1 = {
        x: xVals, y: yVals, type: 'scatter', mode: 'lines',
        line: {color: '#a855f7', width: 3}, name: 'f(x)'
    };

    let trace2 = {
        x: [root], y: [0], mode: 'markers',
        marker: {color: '#10b981', size: 12, line: {color: 'white', width: 2}},
        name: 'الجذر'
    };

    let layout = {
        title: { text: 'التمثيل البياني', font: {color: 'white'} },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { color: 'white', gridcolor: 'rgba(255,255,255,0.1)' },
        yaxis: { color: 'white', gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'white' },
        margin: { t: 40, r: 20, l: 40, b: 40 },
        showlegend: false
    };

    Plotly.newPlot('plotArea', [trace1, trace2], layout, {responsive: true, displayModeBar: false});
}

function exportCSV() {
    let csv = "Iteration,Value1,Value2,Result,F_Result,Error\n";
    currentSteps.forEach(s => {
        csv += `${s.iter},${s.v1},${s.v2},${s.res},${s.fres},${s.err}\n`;
    });
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    link.download = "results.csv";
    link.click();
}

// تهيئة أولية للمعادلة
renderMath();

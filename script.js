// بيانات الخطوات لتصديرها لاحقاً
let currentSteps = [];

function f(expr, x) {
    try { return math.evaluate(expr, { x: x }); } 
    catch (e) { return NaN; }
}

function df(expr, x) {
    const h = 0.000001;
    return (f(expr, x + h) - f(expr, x)) / h;
}

// تحديث النص التعليمي عند تغيير الطريقة
function updateMethodInfo() {
    const method = document.getElementById('methodSelect').value;
    const infoBox = document.getElementById('methodInfo');
    const bisectionDiv = document.getElementById('bisectionInputs');
    const newtonDiv = document.getElementById('newtonInputs');

    if (method === 'bisection') {
        infoBox.innerHTML = "<strong>طريقة التنصيف (Dichotomie):</strong> تعتمد على مبرهنة القيم المتوسطة. تقسم المجال [a,b] باستمرار وتحصر الجذر في مجالات أصغر.";
        bisectionDiv.style.display = 'block';
        newtonDiv.style.display = 'none';
    } else {
        infoBox.innerHTML = "<strong>طريقة نيوتن (Newton):</strong> تعتمد على المماس عند النقطة. سريعة جداً ولكن تتطلب نقطة انطلاق قريبة واشتقاق الدالة.";
        bisectionDiv.style.display = 'none';
        newtonDiv.style.display = 'block';
    }
}

function solveEquation() {
    const expr = document.getElementById('equation').value;
    const method = document.getElementById('methodSelect').value;
    const tol = parseFloat(document.getElementById('tolerance').value);
    const maxIter = parseInt(document.getElementById('maxIter').value);
    
    // إعادة تعيين الواجهة
    const resultDiv = document.getElementById('finalResult');
    const tableDiv = document.getElementById('tableContainer');
    const tbody = document.querySelector('#stepsTable tbody');
    const thead = document.querySelector('#stepsTable thead');
    
    tbody.innerHTML = '';
    resultDiv.classList.add('hidden');
    tableDiv.classList.add('hidden');
    
    currentSteps = []; // تصفير البيانات
    let root = null;
    let converged = false;

    try {
        if (method === 'bisection') {
            let a = parseFloat(document.getElementById('a').value);
            let b = parseFloat(document.getElementById('b').value);

            if (f(expr, a) * f(expr, b) >= 0) {
                alert("شرط التنصيف غير محقق: f(a) * f(b) يجب أن يكون أصغر من 0.");
                return;
            }

            thead.innerHTML = `<tr><th>n</th><th>a</th><th>b</th><th>c (المنتصف)</th><th>f(c)</th><th>الخطأ</th></tr>`;
            let iter = 0;
            
            do {
                iter++;
                let c = (a + b) / 2;
                let fc = f(expr, c);
                let error = Math.abs(b - a);

                currentSteps.push({ n: iter, val1: a, val2: b, res: c, f_res: fc, err: error });

                let row = `<tr><td>${iter}</td><td>${a.toFixed(5)}</td><td>${b.toFixed(5)}</td>
                           <td style="font-weight:bold; color:#2563eb">${c.toFixed(6)}</td>
                           <td>${fc.toExponential(2)}</td><td>${error.toExponential(2)}</td></tr>`;
                tbody.innerHTML += row;

                if (fc === 0 || error < tol) { root = c; converged = true; break; }

                if (f(expr, a) * fc < 0) b = c; else a = c;

            } while (iter < maxIter);

        } else {
            // Newton
            let x = parseFloat(document.getElementById('x0').value);
            thead.innerHTML = `<tr><th>n</th><th>x_old</th><th>f(x)</th><th>f'(x)</th><th>x_new</th><th>الخطأ</th></tr>`;
            let iter = 0;

            do {
                iter++;
                let fx = f(expr, x);
                let dfx = df(expr, x);
                if (Math.abs(dfx) < 1e-10) { alert("المشتقة تساوي صفر!"); return; }

                let x_new = x - (fx / dfx);
                let error = Math.abs(x_new - x);

                currentSteps.push({ n: iter, val1: x, val2: fx, res: x_new, f_res: dfx, err: error });

                let row = `<tr><td>${iter}</td><td>${x.toFixed(6)}</td><td>${fx.toExponential(2)}</td>
                           <td>${dfx.toFixed(4)}</td><td style="font-weight:bold; color:#2563eb">${x_new.toFixed(6)}</td>
                           <td>${error.toExponential(2)}</td></tr>`;
                tbody.innerHTML += row;

                x = x_new;
                if (error < tol) { root = x; converged = true; break; }

            } while (iter < maxIter);
        }

        if (converged) {
            resultDiv.innerHTML = `تم الوصول للجذر: x ≈ ${root.toFixed(7)}`;
            resultDiv.classList.remove('hidden');
        } else {
            resultDiv.innerHTML = `توقف: تم الوصول للحد الأقصى للتكرارات (${maxIter})`;
        }
        
        tableDiv.classList.remove('hidden');
        drawChart(expr, root, method);

    } catch (err) {
        alert("تأكد من صحة الدالة المدخلة");
    }
}

// دالة تصدير النتائج لملف Excel/CSV
function exportToCSV() {
    if (currentSteps.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM للعربية
    const method = document.getElementById('methodSelect').value;
    
    if(method === 'bisection') csvContent += "Iteration,a,b,c,f(c),Error\n";
    else csvContent += "Iteration,x_old,f(x),f'(x),x_new,Error\n";

    currentSteps.forEach(row => {
        csvContent += `${row.n},${row.val1},${row.val2},${row.res},${row.f_res},${row.err}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "numerical_results.csv");
    document.body.appendChild(link);
    link.click();
}

function drawChart(expr, root, method) {
    let center = root || 0;
    let range = 3; 
    if(method === 'bisection') {
        let a = parseFloat(document.getElementById('a').value);
        let b = parseFloat(document.getElementById('b').value);
        center = (a+b)/2;
        range = Math.abs(b-a) + 1;
    }

    let xVals = [], yVals = [];
    for (let x = center - range; x <= center + range; x += range/50) {
        xVals.push(x); yVals.push(f(expr, x));
    }

    let trace1 = { x: xVals, y: yVals, type: 'scatter', name: 'f(x)' };
    let data = [trace1];

    if (root !== null) {
        data.push({ x: [root], y: [0], mode: 'markers', marker: {color: 'red', size: 10}, name: 'الجذر' });
    }

    let layout = { 
        title: 'الرسم البياني للدالة', 
        xaxis: {title: 'x'}, yaxis: {title: 'f(x)'},
        margin: {t: 30, l: 40, r: 20, b: 40}
    };
    
    Plotly.newPlot('plotArea', data, layout, {responsive: true});
}

// تهيئة أولية
updateMethodInfo();

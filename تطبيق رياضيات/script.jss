// --- دوال مساعدة ---
function f(expr, x) {
    try { return math.evaluate(expr, { x: x }); } 
    catch (e) { return NaN; }
}

function df(expr, x) {
    const h = 0.000001;
    return (f(expr, x + h) - f(expr, x)) / h;
}

function loadExample() {
    const val = document.getElementById('examples').value;
    if(val) document.getElementById('equation').value = val;
}

function toggleInputs() {
    const method = document.getElementById('methodSelect').value;
    document.getElementById('bisectionInputs').style.display = (method === 'bisection') ? 'block' : 'none';
    document.getElementById('newtonInputs').style.display = (method === 'newton') ? 'block' : 'none';
}

// --- المحرك الرئيسي ---
function solveEquation() {
    const expr = document.getElementById('equation').value;
    const method = document.getElementById('methodSelect').value;
    const tol = parseFloat(document.getElementById('tolerance').value);
    const maxIter = parseInt(document.getElementById('maxIter').value);
    
    // تنظيف الواجهة
    const resultDiv = document.getElementById('finalResult');
    const tableDiv = document.getElementById('tableContainer');
    const tbody = document.querySelector('#stepsTable tbody');
    const thead = document.querySelector('#stepsTable thead');
    
    tbody.innerHTML = '';
    thead.innerHTML = '';
    resultDiv.classList.add('hidden');
    tableDiv.classList.add('hidden');

    let steps = [];
    let root = null;
    let converged = false;

    try {
        if (method === 'bisection') {
            let a = parseFloat(document.getElementById('a').value);
            let b = parseFloat(document.getElementById('b').value);

            if (f(expr, a) * f(expr, b) >= 0) {
                alert("خطأ: الدالة يجب أن تختلف إشارتها بين طرفي المجال f(a)*f(b) < 0");
                return;
            }

            // إعداد رأس الجدول
            thead.innerHTML = `<tr><th>#</th><th>a</th><th>b</th><th>c (المنتصف)</th><th>f(c)</th><th>الخطأ (b-a)</th></tr>`;

            let iter = 0;
            let c_old = a;
            
            do {
                iter++;
                let c = (a + b) / 2;
                let fc = f(expr, c);
                let error = Math.abs(b - a);

                steps.push({ iter, a, b, c, fc, error });

                if (fc === 0 || error < tol) {
                    root = c;
                    converged = true;
                    break;
                }

                if (f(expr, a) * fc < 0) b = c;
                else a = c;
                
                c_old = c;

            } while (iter < maxIter);

        } else {
            // Newton
            let x = parseFloat(document.getElementById('x0').value);
            
            // إعداد رأس الجدول
            thead.innerHTML = `<tr><th>#</th><th>x_old</th><th>f(x)</th><th>f'(x)</th><th>x_new</th><th>الخطأ</th></tr>`;

            let iter = 0;
            do {
                iter++;
                let fx = f(expr, x);
                let dfx = df(expr, x);
                
                if (Math.abs(dfx) < 1e-10) {
                    alert("المشتقة قريبة جداً من الصفر، الطريقة فشلت.");
                    return;
                }

                let x_new = x - (fx / dfx);
                let error = Math.abs(x_new - x);

                steps.push({ iter, x, fx, dfx, x_new, error });

                x = x_new;
                
                if (error < tol) {
                    root = x;
                    converged = true;
                    break;
                }
            } while (iter < maxIter);
        }

        // 1. عرض النتيجة النهائية
        if (converged) {
            resultDiv.innerHTML = `تم الوصول للحل: x ≈ ${root.toFixed(7)}`;
            resultDiv.classList.remove('hidden');
        } else {
            resultDiv.innerHTML = `لم يتم الوصول للدقة المطلوبة بعد ${maxIter} تكرار.`;
            resultDiv.classList.remove('hidden');
            resultDiv.style.background = "#fee2e2"; // لون أحمر للتحذير
            resultDiv.style.color = "#991b1b";
            resultDiv.style.borderColor = "#f87171";
        }

        // 2. ملء الجدول
        tableDiv.classList.remove('hidden');
        steps.forEach(s => {
            let row = document.createElement('tr');
            if (method === 'bisection') {
                row.innerHTML = `<td>${s.iter}</td><td>${s.a.toFixed(5)}</td><td>${s.b.toFixed(5)}</td>
                                 <td style="font-weight:bold">${s.c.toFixed(6)}</td><td>${s.fc.toExponential(2)}</td><td>${s.error.toExponential(2)}</td>`;
            } else {
                row.innerHTML = `<td>${s.iter}</td><td>${s.x.toFixed(6)}</td><td>${s.fx.toExponential(2)}</td>
                                 <td>${s.dfx.toFixed(4)}</td><td style="font-weight:bold">${s.x_new.toFixed(6)}</td><td>${s.error.toExponential(2)}</td>`;
            }
            tbody.appendChild(row);
        });

        // 3. رسم الدالة
        drawChart(expr, root, method);

    } catch (err) {
        console.error(err);
        alert("تأكد من كتابة الدالة بشكل صحيح.");
    }
}

// --- دالة الرسم البياني ---
function drawChart(expr, root, method) {
    // تحديد نطاق الرسم حول الجذر
    let center = root || 0;
    let range = 5; // نرسم 5 وحدات يمين ويسار
    
    // إذا كانت طريقة التنصيف نستخدم حدود المجال للرسم
    if (method === 'bisection') {
        let a = parseFloat(document.getElementById('a').value);
        let b = parseFloat(document.getElementById('b').value);
        range = Math.abs(b - a) * 1.5; // تكبير النطاق قليلاً
        center = (a + b) / 2;
    }

    let xValues = [];
    let yValues = [];
    let start = center - range;
    let end = center + range;
    let step = (end - start) / 100;

    for (let x = start; x <= end; x += step) {
        xValues.push(x);
        yValues.push(f(expr, x));
    }

    // خط الدالة
    let trace1 = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        name: 'f(x)',
        line: {color: '#2563eb'}
    };

    // نقطة الجذر (إذا وجد)
    let data = [trace1];
    if (root !== null) {
        let trace2 = {
            x: [root],
            y: [0],
            mode: 'markers',
            name: 'الجذر (Root)',
            marker: {color: 'red', size: 12}
        };
        data.push(trace2);
    }

    // خط الصفر (المحور)
    let layout = {
        title: 'التمثيل البياني للدالة',
        xaxis: {title: 'x'},
        yaxis: {title: 'f(x)'},
        shapes: [{
            type: 'line',
            x0: start, y0: 0,
            x1: end, y1: 0,
            line: {color: 'black', width: 1, dash: 'dash'}
        }]
    };

    Plotly.newPlot('plotArea', data, layout, {responsive: true});
}

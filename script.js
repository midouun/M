// فئة مسؤولة عن العمليات الحسابية فقط
class NumericalSolver {
    constructor() {
        this.h = 1e-6; // قيمة صغيرة لحساب الاشتقاق
    }

    // تقييم الدالة f(x)
    f(expr, x) {
        try {
            return math.evaluate(expr, { x: x });
        } catch (e) {
            throw new Error("خطأ في صيغة الدالة. تأكد من كتابتها بشكل صحيح.");
        }
    }

    // حساب المشتقة عددياً f'(x)
    df(expr, x) {
        return (this.f(expr, x + this.h) - this.f(expr, x)) / this.h;
    }

    // خوارزمية التنصيف
    solveBisection(expr, a, b, tol, maxIter) {
        let steps = [];
        let fa = this.f(expr, a);
        let fb = this.f(expr, b);

        if (fa * fb >= 0) {
            throw new Error("شرط التنصيف غير محقق: f(a) * f(b) يجب أن يكون أصغر من 0.");
        }

        let c, fc, error;
        for (let i = 1; i <= maxIter; i++) {
            c = (a + b) / 2;
            fc = this.f(expr, c);
            error = Math.abs(b - a);

            steps.push({ iter: i, a, b, c, fc, error });

            if (Math.abs(fc) < 1e-15 || error < tol) {
                return { root: c, steps, converged: true };
            }

            if (fa * fc < 0) { b = c; fb = fc; } 
            else { a = c; fa = fc; }
        }

        return { root: c, steps, converged: false };
    }

    // خوارزمية نيوتن
    solveNewton(expr, x0, tol, maxIter) {
        let steps = [];
        let x = x0;
        
        for (let i = 1; i <= maxIter; i++) {
            let fx = this.f(expr, x);
            let dfx = this.df(expr, x);

            if (Math.abs(dfx) < 1e-10) {
                throw new Error("المشتقة تساوي صفرًا تقريبًا. الطريقة فشلت.");
            }

            let x_new = x - (fx / dfx);
            let error = Math.abs(x_new - x);

            steps.push({ iter: i, x_old: x, fx, dfx, x_new, error });

            x = x_new;
            if (error < tol) {
                return { root: x, steps, converged: true };
            }
        }

        return { root: x, steps, converged: false };
    }
}

// كائن لإدارة واجهة المستخدم
const app = {
    solver: new NumericalSolver(),
    
    init: function() {
        // تحديث معادلة الرياضيات عند الكتابة
        document.getElementById('equation').addEventListener('input', (e) => {
            const el = document.getElementById('mathPreview');
            let latex = e.target.value.replace(/\*/g, '').replace(/x\^(\d+)/g, 'x^{$1}');
            el.innerHTML = `$$f(x) = ${latex}$$`;
            if(window.MathJax) MathJax.typesetPromise([el]);
        });
    },

    run: function() {
        // قراءة المدخلات
        const expr = document.getElementById('equation').value;
        const method = document.getElementById('selectedMethod').value;
        const tol = parseFloat(document.getElementById('tolerance').value);
        const maxIter = parseInt(document.getElementById('maxIter').value);
        const errorBox = document.getElementById('errorMessage');
        
        // تنظيف الواجهة
        errorBox.classList.add('hidden');
        document.getElementById('summaryBox').classList.add('hidden');
        document.getElementById('tableBox').classList.add('hidden');
        document.getElementById('plotDiv').innerHTML = '';

        try {
            let result;
            if (method === 'bisection') {
                const a = parseFloat(document.getElementById('val_a').value);
                const b = parseFloat(document.getElementById('val_b').value);
                result = this.solver.solveBisection(expr, a, b, tol, maxIter);
                this.renderTable(result.steps, 'bisection');
                this.renderChart(expr, result.root, a, b);
            } else {
                const x0 = parseFloat(document.getElementById('val_x0').value);
                result = this.solver.solveNewton(expr, x0, tol, maxIter);
                this.renderTable(result.steps, 'newton');
                this.renderChart(expr, result.root, x0 - 2, x0 + 2);
            }

            // عرض النتائج
            document.getElementById('res_root').innerText = result.root.toFixed(7);
            document.getElementById('res_iter').innerText = result.steps.length;
            document.getElementById('res_func').innerText = this.solver.f(expr, result.root).toExponential(2);
            
            document.getElementById('summaryBox').classList.remove('hidden');
            document.getElementById('tableBox').classList.remove('hidden');
            
            if (!result.converged) {
                errorBox.innerText = "تنبيه: لم يتم الوصول للدقة المطلوبة ضمن عدد التكرارات الأقصى.";
                errorBox.classList.remove('hidden');
            }

        } catch (error) {
            errorBox.innerText = error.message;
            errorBox.classList.remove('hidden');
        }
    },

    renderTable: function(steps, method) {
        const tbody = document.querySelector('#dataTable tbody');
        const thead = document.querySelector('#dataTable thead');
        tbody.innerHTML = '';

        if (method === 'bisection') {
            thead.innerHTML = `<tr><th>#</th><th>a</th><th>b</th><th>c (المنتصف)</th><th>f(c)</th><th>الخطأ</th></tr>`;
            steps.forEach(s => {
                tbody.innerHTML += `<tr>
                    <td>${s.iter}</td><td>${s.a.toFixed(5)}</td><td>${s.b.toFixed(5)}</td>
                    <td style="font-weight:bold; color:#2563eb">${s.c.toFixed(6)}</td>
                    <td>${s.fc.toExponential(2)}</td><td>${s.error.toExponential(2)}</td>
                </tr>`;
            });
        } else {
            thead.innerHTML = `<tr><th>#</th><th>x_old</th><th>f(x)</th><th>f'(x)</th><th>x_new</th><th>الخطأ</th></tr>`;
            steps.forEach(s => {
                tbody.innerHTML += `<tr>
                    <td>${s.iter}</td><td>${s.x_old.toFixed(6)}</td><td>${s.fx.toExponential(2)}</td>
                    <td>${s.dfx.toFixed(4)}</td>
                    <td style="font-weight:bold; color:#2563eb">${s.x_new.toFixed(6)}</td>
                    <td>${s.error.toExponential(2)}</td>
                </tr>`;
            });
        }
    },

    renderChart: function(expr, root, min, max) {
        let xVals = [], yVals = [];
        let step = (max - min) / 100;
        for (let x = min; x <= max; x += step) {
            xVals.push(x);
            yVals.push(this.solver.f(expr, x));
        }

        let trace1 = { x: xVals, y: yVals, type: 'scatter', name: 'f(x)' };
        let trace2 = { x: [root], y: [0], mode: 'markers', marker: {size: 10, color: 'red'}, name: 'الجذر' };

        let layout = {
            title: 'الرسم البياني',
            margin: {t:30, b:30, l:30, r:30},
            xaxis: { zeroline: true },
            yaxis: { zeroline: true }
        };
        
        Plotly.newPlot('plotDiv', [trace1, trace2], layout, {responsive: true});
    }
};

// دوال مساعدة لتبديل التبويبات
function setMethod(method) {
    document.getElementById('selectedMethod').value = method;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if(method === 'bisection') {
        document.getElementById('inputs-bisection').classList.remove('hidden');
        document.getElementById('inputs-newton').classList.add('hidden');
    } else {
        document.getElementById('inputs-bisection').classList.add('hidden');
        document.getElementById('inputs-newton').classList.remove('hidden');
    }
}

// تشغيل عند التحميل
app.init();

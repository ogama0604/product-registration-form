document.addEventListener("DOMContentLoaded", () => {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const historyContainer = document.getElementById('history-container');
    const calendarBody = document.getElementById('calendar-body');
    const currentMonthYear = document.getElementById('current-month-year');

    // Google Apps Script WebアプリURL
    const gasUrl = "https://script.google.com/macros/s/AKfycbz6JOHd-loW-LHiJhcnOdyRRGfX_YcQaeAT5Kq1TgneFXLQQ8ABi5p30-gknY12PDGurQ/exec";
    
    let allData = []; // 全データを格納する変数

    // --- データをGASから取得する関数 ---
    async function fetchDataFromGAS() {
        try {
            // history.jsからのリクエストであることをGASに伝える
            const params = new URLSearchParams({ type: 'history' }).toString();
            const response = await fetch(`${gasUrl}?${params}`);
            
            // レスポンスが正常か確認
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // データがオブジェクト形式でない場合は変換
            if (data.length > 0 && Array.isArray(data[0])) {
                allData = transformData(data);
            } else {
                allData = data;
            }
            
            initializePage();
        } catch (error) {
            console.error("履歴の取得に失敗:", error);
            historyContainer.textContent = "履歴の取得に失敗しました。";
        }
    }
    
    // --- データをオブジェクト形式に変換する関数 ---
    function transformData(data) {
        if (data.length === 0) return [];
        const headers = ['timestamp', 'date', 'store', 'paymentSource', 'name', 'categoryLarge', 'categorySmall', 'price', 'quantity', 'unit', 'memo'];
        const transformed = [];
        for (let i = 1; i < data.length; i++) {
            const row = {};
            headers.forEach((header, j) => {
                row[header] = data[i][j];
            });
            transformed.push(row);
        }
        return transformed;
    }
    
    // --- ページ初期化処理 ---
    function initializePage() {
        const uniqueDates = [...new Set(allData.map(d => new Date(d.date).getFullYear()))];
        const years = uniqueDates.sort((a, b) => b - a);
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i.toString().padStart(2, '0');
            option.textContent = i + '月';
            monthSelect.appendChild(option);
        }
        
        // 現在の年月をデフォルトで選択
        const today = new Date();
        yearSelect.value = today.getFullYear();
        monthSelect.value = (today.getMonth() + 1).toString().padStart(2, '0');

        yearSelect.addEventListener('change', updateDisplay);
        monthSelect.addEventListener('change', updateDisplay);
        
        updateDisplay();
    }
    
    // --- 表示を更新するメイン関数 ---
    function updateDisplay() {
        const selectedYear = yearSelect.value;
        const selectedMonth = monthSelect.value;
        
        if (!selectedYear || !selectedMonth) return;

        const filteredData = allData.filter(d => {
            const date = new Date(d.date);
            return date.getFullYear() == selectedYear && (date.getMonth() + 1).toString().padStart(2, '0') == selectedMonth;
        });

        renderCalendar(selectedYear, selectedMonth, filteredData);
        renderHistoryList(filteredData);
    }
    
    // --- カレンダー描画関数 ---
    function renderCalendar(year, month, data) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 (日) から 6 (土)

        currentMonthYear.textContent = `${year}年 ${month}月`;
        calendarBody.innerHTML = '';
        
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        dayNames.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.textContent = day;
            headerCell.classList.add('day-header');
            calendarBody.appendChild(headerCell);
        });

        // 日付の前に空白セルを追加
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarBody.appendChild(document.createElement('div'));
        }

        const dailyTotals = {};
        data.forEach(d => {
            const date = new Date(d.date);
            const day = date.getDate();
            if (!dailyTotals[day]) {
                dailyTotals[day] = 0;
            }
            dailyTotals[day] += parseFloat(d.price) || 0;
        });

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.innerHTML = `<span>${i}</span>`;
            if (dailyTotals[i]) {
                const totalSpan = document.createElement('span');
                totalSpan.classList.add('total-amount');
                totalSpan.textContent = `¥${dailyTotals[i].toLocaleString()}`;
                dayCell.appendChild(totalSpan);
            }
            calendarBody.appendChild(dayCell);
        }
    }

    // --- 履歴リスト描画関数 ---
    function renderHistoryList(data) {
        historyContainer.innerHTML = '';

        if (data.length === 0) {
            historyContainer.textContent = "この月の履歴はありません。";
            return;
        }

        const table = document.createElement("table");
        table.classList.add("history-table");
        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>日付</th>
                <th>カテゴリ</th>
                <th>品目</th>
                <th>数量</th>
                <th>単位</th>
                <th>金額</th>
                <th>店舗</th>
                <th>出金元</th>
                <th>メモ</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        // 日付で降順にソート
        data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.date || ""}</td>
                <td>${row.categoryLarge} > ${row.categorySmall}</td>
                <td>${row.name || ""}</td>
                <td>${row.quantity || ""}</td>
                <td>${row.unit || ""}</td>
                <td>${row.price || ""}</td>
                <td>${row.store || ""}</td>
                <td>${row.paymentSource || ""}</td>
                <td>${row.memo || ""}</td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        historyContainer.appendChild(table);
    }

    // ページ読み込み時にデータを取得して表示
    fetchDataFromGAS();
});
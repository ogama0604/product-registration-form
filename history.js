// --- 大カテゴリと小カテゴリの定義（input.jsと合わせる） ---
const categories = {
    "食費": ["食料品", "外食", "テイクアウト"],
    "日用雑貨": ["消耗品", "雑貨"],
    "交通": ["電車", "タクシー", "バス"]
};
// 出金元の定義
const paymentSources = ["PayPay", "現金", "Oliveクレジット"];
// 単位の定義
const units = ["個", "g", "ml"];

document.addEventListener("DOMContentLoaded", () => {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const historyContainer = document.getElementById('history-container');
    const calendarBody = document.getElementById('calendar-body');
    const currentMonthYear = document.getElementById('current-month-year');
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.querySelector('.close-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');
    
    // 編集モーダルの入力欄
    const editLargeCategorySelect = document.getElementById('edit-large-category');
    const editSmallCategorySelect = document.getElementById('edit-small-category');
    const editUnitSelect = document.getElementById('edit-unit');
    const editPaymentSourceSelect = document.getElementById('edit-paymentSource');

    // Google Apps Script WebアプリURL
    const gasUrl = "https://script.google.com/macros/s/AKfycbyIzDaM8v85M8NDiQl1YH255YORvnKFeYMl8LAOEZqTnIag24jO2w-Xu0UosPhNFLakGA/exec";
    
    let allData = [];

    // 編集モーダルを閉じる
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

    // 編集モーダルのプルダウンを初期化する
    function setupEditDropdowns() {
        // 大カテゴリ
        editLargeCategorySelect.innerHTML = `<option value="">大カテゴリ</option>`;
        Object.keys(categories).forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            editLargeCategorySelect.appendChild(option);
        });

        // 小カテゴリの連動
        editLargeCategorySelect.addEventListener("change", () => {
            const selected = editLargeCategorySelect.value;
            editSmallCategorySelect.innerHTML = `<option value="">小カテゴリ</option>`;
            if (categories[selected]) {
                categories[selected].forEach(sub => {
                    const option = document.createElement("option");
                    option.value = sub;
                    option.textContent = sub;
                    editSmallCategorySelect.appendChild(option);
                });
            }
        });

        // 単位
        editUnitSelect.innerHTML = `<option value="">単位</option>`;
        units.forEach(unit => {
            const option = document.createElement("option");
            option.value = unit;
            option.textContent = unit;
            editUnitSelect.appendChild(option);
        });
        
        // 出金元
        editPaymentSourceSelect.innerHTML = `<option value="">出金元</option>`;
        paymentSources.forEach(source => {
            const option = document.createElement("option");
            option.value = source;
            option.textContent = source;
            editPaymentSourceSelect.appendChild(option);
        });
    }
    
    // --- データをGASから取得する関数 ---
    async function fetchDataFromGAS() {
        try {
            const params = new URLSearchParams({ type: 'history' }).toString();
            const response = await fetch(`${gasUrl}?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                 historyContainer.textContent = "履歴の取得に失敗しました。";
                 return;
            }

            allData = data;
            initializePage();
        } catch (error) {
            console.error("履歴の取得に失敗:", error);
            historyContainer.textContent = "履歴の取得に失敗しました。";
        }
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
        
        const today = new Date();
        yearSelect.value = today.getFullYear();
        monthSelect.value = (today.getMonth() + 1).toString().padStart(2, '0');

        yearSelect.addEventListener('change', updateDisplay);
        monthSelect.addEventListener('change', updateDisplay);
        
        updateDisplay();
        setupEditDropdowns(); // プルダウン初期化
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
                <th>操作</th>
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
                <td>
                    <button class="edit-btn" data-row-index="${row.rowIndex}">編集</button>
                    <button class="delete-btn" data-row-index="${row.rowIndex}">削除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        historyContainer.appendChild(table);
        
        // 削除・編集ボタンのイベントリスナーを設定
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });
    }

    // --- 削除処理 ---
    async function handleDelete(event) {
        if (!confirm('本当にこの支出を削除しますか？')) {
            return;
        }
        
        const rowIndex = event.target.dataset.rowIndex;
        
        try {
            const response = await fetch(gasUrl, {
                method: "POST",
                body: JSON.stringify({ action: 'delete', rowIndex: rowIndex }),
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            if (result.success) {
                alert('削除しました。');
                // ページを再読み込みして最新の状態にする
                location.reload(); 
            } else {
                alert('削除に失敗しました: ' + result.message);
            }
        } catch (error) {
            console.error('削除失敗:', error);
            alert('削除中にエラーが発生しました。');
        }
    }

    // --- 編集処理 ---
    function handleEdit(event) {
        const rowIndex = event.target.dataset.rowIndex;
        const rowData = allData.find(d => d.rowIndex == rowIndex);
        
        if (!rowData) return;

        // モーダルの入力欄にデータをセット
        document.getElementById('edit-row-index').value = rowIndex;
        document.getElementById('edit-date').value = rowData.date;
        editLargeCategorySelect.value = rowData.categoryLarge;
        // 小カテゴリの選択肢を再生成して値をセット
        editLargeCategorySelect.dispatchEvent(new Event('change'));
        editSmallCategorySelect.value = rowData.categorySmall;
        document.getElementById('edit-name').value = rowData.name;
        document.getElementById('edit-quantity').value = rowData.quantity;
        editUnitSelect.value = rowData.unit;
        document.getElementById('edit-price').value = rowData.price;
        document.getElementById('edit-store').value = rowData.store;
        editPaymentSourceSelect.value = rowData.paymentSource;
        document.getElementById('edit-memo').value = rowData.memo;

        // モーダルを表示
        modal.style.display = 'block';
    }

    // --- 編集保存処理 ---
    saveEditBtn.addEventListener('click', async () => {
        const rowIndex = document.getElementById('edit-row-index').value;
        const editedData = {
            date: document.getElementById('edit-date').value,
            largeCategory: editLargeCategorySelect.value,
            smallCategory: editSmallCategorySelect.value,
            name: document.getElementById('edit-name').value,
            quantity: document.getElementById('edit-quantity').value,
            unit: editUnitSelect.value,
            price: document.getElementById('edit-price').value,
            store: document.getElementById('edit-store').value,
            paymentSource: editPaymentSourceSelect.value,
            memo: document.getElementById('edit-memo').value
        };

        try {
            const response = await fetch(gasUrl, {
                method: "POST",
                body: JSON.stringify({ action: 'edit', rowIndex: rowIndex, data: editedData }),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            if (result.success) {
                alert('編集を保存しました。');
                modal.style.display = 'none';
                location.reload(); // ページを再読み込み
            } else {
                alert('編集の保存に失敗しました: ' + result.message);
            }
        } catch (error) {
            console.error('編集失敗:', error);
            alert('編集中にエラーが発生しました。');
        }
    });

    // ページ読み込み時にデータを取得
    fetchDataFromGAS();
});
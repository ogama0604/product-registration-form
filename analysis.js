document.addEventListener("DOMContentLoaded", () => {
    const monthSelect = document.getElementById('month-select');
    const monthlyChartCanvas = document.getElementById('monthly-chart').getContext('2d');
    const categoryChartCanvas = document.getElementById('category-chart').getContext('2d');
    
    let allData = []; // 全データを格納する変数

    // グラフインスタンスを保持する変数
    let monthlyChart;
    let categoryChart;

    // Google Apps Script WebアプリURL
    // ★★★ input.jsと同じURLをここにも貼り付けてください ★★★
    const gasUrl = "https://script.google.com/macros/s/AKfycbwKpviqkwDbwOngg6ThDbLdZdw8swNOIFvAH4sSK39AYsZYI_pCTOnZ0jetyxILy-YmDQ/exec";

    // --- データをGASから取得する関数 ---
    async function fetchDataFromGAS() {
        try {
            // GETリクエストでデータを取得するためのURLパラメータ
            const params = new URLSearchParams({ type: 'analysis' }).toString();
            const response = await fetch(`${gasUrl}?${params}`);
            
            // GASからのレスポンスをJSONとして解析
            const data = await response.json();
            
            // ヘッダー行をスキップしてデータを取得
            allData = data.slice(1); 
            
            // グラフを更新
            createMonthSelectors(allData);
            updateAllCharts();
        } catch (error) {
            console.error('データの取得に失敗しました:', error);
            alert('データの取得に失敗しました。GASの設定を確認してください。');
        }
    }

    // --- 月選択プルダウンを生成する関数 ---
    function createMonthSelectors(data) {
        // 日付データをYYYY-MM形式に変換して一意な月を取得
        const months = [...new Set(data.map(row => new Date(row[1]).toISOString().slice(0, 7)))];
        months.sort().reverse(); // 新しい月が上に来るように降順にソート

        monthSelect.innerHTML = '<option value="">月を選択</option>';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthSelect.appendChild(option);
        });

        // プルダウンが変更されたらカテゴリ別グラフを更新
        monthSelect.addEventListener('change', updateCategoryChart);
    }
    
    // --- 全てのグラフを更新する関数 ---
    function updateAllCharts() {
        updateMonthlyChart();
        updateCategoryChart();
    }

    // --- 月別支出棒グラフを生成・更新する関数 ---
    function updateMonthlyChart() {
        const monthlySummary = {};
        allData.forEach(row => {
            const date = new Date(row[1]);
            const month = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0');
            const amount = parseFloat(row[7]); // 金額の列

            if (monthlySummary[month]) {
                monthlySummary[month] += amount;
            } else {
                monthlySummary[month] = amount;
            }
        });

        const labels = Object.keys(monthlySummary).sort();
        const data = labels.map(label => monthlySummary[label]);

        // 既存のグラフがあれば破棄
        if (monthlyChart) monthlyChart.destroy();

        monthlyChart = new Chart(monthlyChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '月別支出合計',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // --- カテゴリ別円グラフを生成・更新する関数 ---
    function updateCategoryChart() {
        const selectedMonth = monthSelect.value;
        const categorySummary = {};
        
        // 選択された月に該当するデータをフィルタリング
        const filteredData = selectedMonth 
            ? allData.filter(row => new Date(row[1]).toISOString().slice(0, 7) === selectedMonth)
            : [];

        if (filteredData.length === 0) {
            // データがなければグラフを非表示にし、既存のグラフを破棄
            document.getElementById('category-chart').style.display = 'none';
            if (categoryChart) categoryChart.destroy();
            return;
        }

        document.getElementById('category-chart').style.display = 'block';

        filteredData.forEach(row => {
            const category = row[5] || 'その他'; // 大カテゴリの列
            const amount = parseFloat(row[7]); // 金額の列
            
            if (categorySummary[category]) {
                categorySummary[category] += amount;
            } else {
                categorySummary[category] = amount;
            }
        });

        const labels = Object.keys(categorySummary);
        const data = labels.map(label => categorySummary[label]);
        
        // 既存のグラフがあれば破棄
        if (categoryChart) categoryChart.destroy();

        categoryChart = new Chart(categoryChartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'カテゴリ別支出',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });
    }
    
    // ページ読み込み時にデータを取得
    fetchDataFromGAS();
});
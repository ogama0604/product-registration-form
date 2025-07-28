document.addEventListener('DOMContentLoaded', async () => {
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwP4lp0y2psJ_-jgm8kzZdrgFrkMWQMLsBNr6k0DKq_SkzMov_1x6z0ynddnypeuzF7/exec'; // ★登録ページと同じURLを使用
    const productSelect = document.getElementById('productSelect');
    const resultTableBody = document.querySelector('#resultTable tbody');

    let allProductsData = []; // 全商品のデータを保持する配列

    // データをスプレッドシートから取得して表示する関数
    async function fetchAndDisplayProducts() {
        try {
            // GETリクエストでデータを取得
            const response = await fetch(WEB_APP_URL, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`HTTPエラー: ${response.status}`);
            }

            const result = await response.json();

            if (result.result === 'success') {
                allProductsData = result.data; // 全データを保存
                populateProductSelect(allProductsData); // 商品選択プルダウンを更新
                displayProducts(allProductsData); // 全ての商品を表示

            } else {
                alert('データの読み込みに失敗しました: ' + (result.message || '不明なエラー'));
            }
        } catch (error) {
            console.error('データの取得中にエラーが発生しました:', error);
            alert('データの取得中にエラーが発生しました。インターネット接続を確認してください。');
        }
    }

    // 商品選択プルダウンにオプションを追加する関数
    function populateProductSelect(data) {
        productSelect.innerHTML = '<option value="">-- 全ての商品を表示 --</option>'; // 初期化
        const productNames = new Set(); // 重複を避けるためにSetを使用

        data.forEach(item => {
            if (item['商品名']) { // スプレッドシートの「商品名」列
                productNames.add(item['商品名']);
            }
        });

        Array.from(productNames).sort().forEach(productName => {
            const option = document.createElement('option');
            option.value = productName;
            option.textContent = productName;
            productSelect.appendChild(option);
        });
    }

    // テーブルに商品を動的に表示する関数
    function displayProducts(productsToDisplay) {
        resultTableBody.innerHTML = ''; // テーブルの中身をクリア

        if (productsToDisplay.length === 0) {
            resultTableBody.innerHTML = '<tr><td colspan="11">登録された商品がありません。</td></tr>';
            return;
        }

        productsToDisplay.forEach(item => {
            const row = resultTableBody.insertRow();
            // スプレッドシートのヘッダー名と一致するようにアクセス
            // レスポンシブ用のdata-label属性を追加
            row.insertCell().setAttribute('data-label', 'ジャンル');
            row.cells[0].textContent = item['ジャンル'] || '';

            row.insertCell().setAttribute('data-label', '商品名');
            row.cells[1].textContent = item['商品名'] || '';

            row.insertCell().setAttribute('data-label', '日付');
            row.cells[2].textContent = item['日付'] || '';

            row.insertCell().setAttribute('data-label', '店舗');
            row.cells[3].textContent = item['店舗名'] || '';

            row.insertCell().setAttribute('data-label', '重さ/個数');
            row.cells[4].textContent = item['重さ/個数'] || '';

            row.insertCell().setAttribute('data-label', '金額（円）');
            row.cells[5].textContent = item['金額'] ? item['金額'].toLocaleString() : ''; // 金額をカンマ区切りに

            row.insertCell().setAttribute('data-label', '単価');
            row.cells[6].textContent = item['単価'] ? parseFloat(item['単価']).toFixed(2) : ''; // 単価を小数点以下2桁に

            row.insertCell().setAttribute('data-label', '単位');
            row.cells[7].textContent = item['単位'] || '';

            row.insertCell().setAttribute('data-label', '登録時刻');
            row.cells[8].textContent = item['登録日時'] || '';

            row.insertCell().setAttribute('data-label', 'メモ');
            row.cells[9].textContent = item['メモ'] || '';

            // 操作列
            const actionCell = row.insertCell();
            actionCell.setAttribute('data-label', '操作');

            const editButton = document.createElement('button');
            editButton.textContent = '編集';
            editButton.classList.add('edit-btn');
            // 編集ボタンクリック時の処理（入力ページへデータを渡す）
            editButton.addEventListener('click', () => {
                // ローカルストレージに編集対象のデータを保存して入力ページへ遷移
                // rowIndexはApps Scriptで付与されたスプレッドシートの行番号
                localStorage.setItem('editItem', JSON.stringify({ ...item, rowIndex: item.rowIndex }));
                window.location.href = 'index.html';
            });
            actionCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '削除';
            deleteButton.classList.add('delete-btn');
            // 削除ボタンクリック時の処理
            deleteButton.addEventListener('click', () => {
                if (confirm('この商品を削除してもよろしいですか？')) {
                    deleteProduct(item.rowIndex); // GASのdoPostに削除リクエストを送る
                }
            });
            actionCell.appendChild(deleteButton);
        });
    }

    // 商品選択プルダウンの変更イベントリスナー
    productSelect.addEventListener('change', () => {
        const selectedProduct = productSelect.value;
        if (selectedProduct === '') {
            displayProducts(allProductsData); // 全ての商品を表示
        } else {
            const filteredProducts = allProductsData.filter(item => item['商品名'] === selectedProduct);
            displayProducts(filteredProducts); // 選択された商品のみを表示
        }
    });

    // 商品を削除する関数
    async function deleteProduct(rowIndex) {
        try {
            const payload = new URLSearchParams({
                action: 'delete', // 削除アクションをGASに伝える
                rowIndex: rowIndex // 削除する行番号
            });

            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: payload,
            });

            if (!response.ok) {
                throw new Error(`HTTPエラー: ${response.status}`);
            }

            const result = await response.json();

            if (result.result === 'success') {
                alert(result.message);
                fetchAndDisplayProducts(); // 再度データを取得して表示を更新
            } else {
                alert('削除に失敗しました: ' + (result.message || '不明なエラー'));
            }
        } catch (error) {
            console.error('削除中にエラーが発生しました:', error);
            alert('削除中にエラーが発生しました。');
        }
    }

    // ページロード時にデータを取得して表示
    fetchAndDisplayProducts();
});
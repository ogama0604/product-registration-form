document.addEventListener('DOMContentLoaded', async () => {
    // ★登録ページと同じURLを使用 (GASウェブアプリのURL)
    // view_script.js で使っているものと同じ最新のURLを設定してください。
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz-e54w_DGxRsk1sQ2zW3K0xK1mGj-Od02yjCH66YOBPs0JXFWcgSN1r64xCdUmaQ3q/exec'; 

    const productForm = document.getElementById('productForm'); // index.html の <form id="productForm"> を想定 (HTML側でIDを'form'から'productForm'に変更済み)
    const submitButton = document.getElementById('submitButton'); // フォーム送信ボタンのIDを想定 (HTML側でIDを追加済み)

    // フォームの各入力要素の参照を取得 (index.html の input/select タグのIDに合わせてください)
    const categoryInput = document.getElementById('category'); 
    const productNameSelect = document.getElementById('productName'); // ★変更: product -> productName (select)
    const productInput = document.getElementById('productInput');   // ★追加: 自由入力テキストフィールド
    const dateInput = document.getElementById('date'); 
    const storeNameSelect = document.getElementById('storeName');   // ★変更: store-select -> storeName (select)
    const storeInput = document.getElementById('storeInput');       // ★追加: 自由入力テキストフィールド
    const weightInput = document.getElementById('weight'); 
    const priceInput = document.getElementById('price'); 
    const unitPriceInput = document.getElementById('unitPrice'); // HTML側で追加済み
    const unitInput = document.getElementById('unit');           // HTML側で追加済み
    const noteInput = document.getElementById('note'); 

    // ★重要★ 更新時に必要となる行番号を保持するための隠しフィールド
    // index.html の <form> タグ内に <input type="hidden" id="rowIndex" name="rowIndex"> を追加してください (HTML側で追加済み)
    const rowIndexInput = document.getElementById('rowIndex'); 

    // --- 編集モード判定とフォームへのデータ反映 ---
    const editItemJSON = localStorage.getItem('editItem');
    if (editItemJSON) {
        try {
            const editItem = JSON.parse(editItemJSON);
            console.log('ローカルストレージから編集データが読み込まれました:', editItem);

            // 各フォーム要素にデータを反映
            // editItem['スプレッドシートのヘッダー名'] の形式でアクセスします
            if (categoryInput) categoryInput.value = editItem['ジャンル'] || '';
            
            // ★商品名の反映ロジックの修正: セレクトボックスと自由入力の両方に対応
            if (productNameSelect) {
                // まずセレクトボックスのオプションに値があるか確認
                const options = Array.from(productNameSelect.options).map(opt => opt.value);
                if (options.includes(editItem['商品名'])) {
                    productNameSelect.value = editItem['商品名']; // セレクトボックスに値があればセット
                    productInput.value = ''; // 自由入力はクリア
                } else {
                    productNameSelect.value = ''; // セレクトボックスはデフォルトに
                    if (productInput) productInput.value = editItem['商品名'] || ''; // 自由入力にセット
                }
            }
            // productInputのみの場合のフォールバック
            else if (productInput) {
                productInput.value = editItem['商品名'] || '';
            }


            if (dateInput) dateInput.value = editItem['日付'] || ''; // 日付のフォーマットに注意が必要な場合があります
            
            // ★店舗名の反映ロジックの修正: セレクトボックスと自由入力の両方に対応
            if (storeNameSelect) {
                const options = Array.from(storeNameSelect.options).map(opt => opt.value);
                if (options.includes(editItem['店舗名'])) {
                    storeNameSelect.value = editItem['店舗名'];
                    storeInput.value = '';
                } else {
                    storeNameSelect.value = '';
                    if (storeInput) storeInput.value = editItem['店舗名'] || '';
                }
            }
            // storeInputのみの場合のフォールバック
            else if (storeInput) {
                storeInput.value = editItem['店舗名'] || '';
            }

            if (weightInput) weightInput.value = editItem['重さ/個数'] || '';
            if (priceInput) priceInput.value = editItem['金額'] || '';
            if (unitPriceInput) unitPriceInput.value = editItem['単価'] || ''; // HTML側で追加済み
            if (unitInput) unitInput.value = editItem['単位'] || '';           // HTML側で追加済み
            if (noteInput) noteInput.value = editItem['メモ'] || '';

            // スプレッドシートの行番号を隠しフィールドにセット
            if (rowIndexInput) {
                rowIndexInput.value = editItem.rowIndex;
            }

            // フォームの送信ボタンのテキストを「更新」に変更し、スタイルを適用（任意）
            if (submitButton) {
                submitButton.textContent = '更新';
                submitButton.classList.add('update-mode'); // CSSで .update-mode のスタイルを定義して見た目を変えることもできます
            }

            // データをフォームに反映したら、ローカルストレージから削除します
            localStorage.removeItem('editItem');
            console.log('ローカルストレージから編集データを削除しました。');

        } catch (error) {
            console.error('ローカルストレージからの編集データのパース中にエラーが発生しました:', error);
            alert('編集データの読み込みに失敗しました。');
            localStorage.removeItem('editItem'); // 破損したデータは削除して次回以降の誤動作を防ぐ
        }
    }

    // --- フォームの送信処理 ---
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // ページの再読み込みを防ぐ

        const formData = new FormData(); // 空のFormDataを初期化

        // 各フィールドの値を手動で取得し、formDataに追加
        // FormData(productForm) を使うと、name属性がないフィールドの値が取得されないため、手動で追加します。
        // また、セレクトボックスと自由入力の優先順位をここで決めます。

        // ジャンル
        formData.append('category', categoryInput.value);

        // ★商品名: 自由入力フィールドに値があればそれを優先、なければセレクトボックスの値
        const finalProductName = productInput.value.trim() !== '' ? productInput.value.trim() : productNameSelect.value;
        formData.append('productName', finalProductName);

        // 日付
        formData.append('date', dateInput.value);

        // ★店舗名: 自由入力フィールドに値があればそれを優先、なければセレクトボックスの値
        const finalStoreName = storeInput.value.trim() !== '' ? storeInput.value.trim() : storeNameSelect.value;
        formData.append('storeName', finalStoreName);
        
        // 重さ/個数
        formData.append('weight', weightInput.value);

        // 金額
        formData.append('price', priceInput.value);

        // 単価 (HTML側で追加済み)
        formData.append('unitPrice', unitPriceInput.value);

        // 単位 (HTML側で追加済み)
        formData.append('unit', unitInput.value);

        // メモ
        formData.append('note', noteInput.value);

        const payload = new URLSearchParams(formData); // FormDataからURLSearchParamsに変換

        // rowIndex が存在すれば更新モード、なければ新規登録モードとしてGASに伝える
        if (rowIndexInput && rowIndexInput.value) {
            payload.append('action', 'update'); // GAS側で更新処理を呼び出すためのアクション
            payload.append('rowIndex', rowIndexInput.value); // 更新対象の行番号
        } else {
            payload.append('action', 'insert'); // GAS側で新規登録処理を呼び出すためのアクション
        }

        // 送信ボタンを無効にして、重複送信を防ぎ、ユーザーに処理中であることを伝える
        submitButton.disabled = true;
        submitButton.textContent = '送信中...';

        try {
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
                // 成功したらフォームをリセットし、更新ボタンの状態も元に戻す
                productForm.reset();
                if (rowIndexInput) rowIndexInput.value = ''; // 行番号もクリア
                submitButton.textContent = '登録する'; // 元のテキストに戻す
                submitButton.classList.remove('update-mode');
            } else {
                alert('処理に失敗しました: ' + (result.message || '不明なエラー'));
            }
        } catch (error) {
            console.error('データの送信中にエラーが発生しました:', error);
            alert('データの送信中にエラーが発生しました。インターネット接続を確認してください。');
        } finally {
            // 処理が完了したらボタンを有効に戻す
            submitButton.disabled = false;
        }
    });
});
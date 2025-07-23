document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
    const categorySelect = document.getElementById('category');
    const productSelect = document.getElementById('product');
    const productInput = document.getElementById('product-input');
    const storeSelect = document.getElementById('store-select');
    const storeInput = document.getElementById('store-input');
    const unitLabel = document.getElementById('unit-label');

    // ★Apps ScriptのウェブアプリURLをここに貼り付けてください★
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyKbtrHCK9VJh85_y3c2qNysNRbZOWtXXCqNDC9xJuY5LtkSMgRZLGXWBliHvqU3SaF/exec';

    const productMap = {
        '野菜': ['トマト', 'キャベツ', 'レタス'],
        '肉・卵': ['卵', '鶏ひき肉', '牛薄切り'],
        '日用品': ['トイレットペーパー', 'ティッシュ', 'ウエットティッシュ']
    };

    const unitMap = {
        'トマト': 'g',
        'キャベツ': 'g',
        'レタス': 'g',
        '鶏ひき肉': 'g',
        '牛薄切り': 'g',
        '卵': '個',
        'トイレットペーパー': '個',
        'ティッシュ': '個',
        'ウエットティッシュ': '個'
    };

    // 商品ジャンル → 商品リスト連動
    if (categorySelect && productSelect) {
        categorySelect.addEventListener('change', () => {
            const selectedCategory = categorySelect.value;
            productSelect.innerHTML = '<option value="">-- 商品を選択 --</option>'; // 毎回初期化

            if (productMap[selectedCategory]) {
                productMap[selectedCategory].forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    productSelect.appendChild(option);
                });
                productSelect.disabled = false;
            } else {
                productSelect.disabled = true;
            }
            // ジャンル変更時に単位ラベルもリセット（またはデフォルトに）
            unitLabel.textContent = ''; // 初期値は空にするか、何らかのデフォルト値に
            // ジャンル変更時は自由入力欄を表示状態に
            productInput.style.display = 'inline-block';
            productInput.setAttribute('placeholder', '自由入力（例：アボカド）');
            productInput.value = '';
        });
    }

    // 商品名セレクト → テキスト入力を空に、単位表示
    productSelect.addEventListener('change', () => {
        if (productSelect.value) {
            productInput.value = ''; // 選択したら自由入力欄をクリア
            productInput.style.display = 'none'; // 自由入力欄を非表示
            const unit = unitMap[productSelect.value] || '';
            unitLabel.textContent = unit;
        } else {
            // "-- 商品を選択 --" が選ばれたら自由入力欄を表示
            productInput.style.display = 'inline-block';
            productInput.setAttribute('placeholder', '自由入力（例：アボカド）');
            unitLabel.textContent = ''; // 単位もリセット
        }
    });

    // 商品名手入力 → セレクトを空に、単位非表示
    productInput.addEventListener('input', () => {
        if (productInput.value.trim()) {
            productSelect.value = ''; // 手入力したらセレクトをクリア
            unitLabel.textContent = ''; // 単位を非表示
        }
    });

    // 店舗名セレクト → テキスト入力を空に
    storeSelect.addEventListener('change', () => {
        if (storeSelect.value) {
            storeInput.value = ''; // 選択したら自由入力欄をクリア
            storeInput.style.display = 'none'; // 自由入力欄を非表示
        } else {
            // "-- よく使う店舗から選択 --" が選ばれたら自由入力欄を表示
            storeInput.style.display = 'inline-block';
            storeInput.setAttribute('placeholder', '自由入力（例：○○商店）');
        }
    });

    // 店舗名テキスト入力 → セレクトを空に
    storeInput.addEventListener('input', () => {
        if (storeInput.value.trim()) {
            storeSelect.value = ''; // 手入力したらセレクトをクリア
        }
    });

    // 初期表示時の調整
    if (productSelect.value === '') {
        productInput.style.display = 'inline-block';
    } else {
        productInput.style.display = 'none';
    }
    if (storeSelect.value === '') {
        storeInput.style.display = 'inline-block';
    } else {
        storeInput.style.display = 'none';
    }
    // 初期状態で単位ラベルを空にする
    unitLabel.textContent = '';


    // 登録フォーム送信処理
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault(); // フォームの通常の送信を防ぐ

            const category = categorySelect.value;
            // 商品名は、セレクトボックスが選択されていればその値、そうでなければ自由入力の値
            const name = productSelect.value || productInput.value.trim();
            // 店舗名も同様
            const store = storeSelect.value || storeInput.value.trim();
            const date = document.getElementById('date').value;
            const weight = parseFloat(document.getElementById('weight').value);
            const price = parseFloat(document.getElementById('price').value);
            const note = document.getElementById('note')?.value || '';
            const now = new Date();
            const timestamp = now.toLocaleString(); // スプレッドシートにはこの形式で保存

            // バリデーション
            if (!category) {
                alert("ジャンルを選択してください。");
                return;
            }
            if (!name) {
                alert("商品名を入力または選択してください。");
                return;
            }
            if (!date) {
                alert("日付を入力してください。");
                return;
            }
            if (!store) {
                alert("店舗名を入力または選択してください。");
                return;
            }
            if (isNaN(weight) || weight <= 0) {
                alert("重さ / 個数を正しく入力してください。");
                return;
            }
            if (isNaN(price) || price <= 0) {
                alert("金額を正しく入力してください。");
                return;
            }


            const unit = unitMap[name] || unitLabel.textContent || 'g'; // unitMapになければ現在のラベル、それもなければ'g'
            let unitPrice = 0;
            if (unit === 'g') {
                unitPrice = (price / weight) * 100; // 100gあたりの価格
            } else if (unit === '個') {
                unitPrice = price / weight; // 1個あたりの価格
            }
            unitPrice = isNaN(unitPrice) ? 0 : parseFloat(unitPrice.toFixed(2)); // 小数点以下2桁に丸める


            // 送信するデータをオブジェクトとしてまとめる
            const sendData = {
                category: category,
                productName: name, // GAS側で 'productName' で受け取る
                date: date,
                storeName: store, // GAS側で 'storeName' で受け取る
                weight: weight,
                price: price,
                unitPrice: unitPrice,
                unit: unit,
                note: note,
                timestamp: timestamp
            };

            // URLSearchParams形式に変換 (POSTリクエストのbodyとして一般的な形式)
            const payload = new URLSearchParams(sendData);

            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    // mode: 'no-cors', // レスポンスを受け取るため、これを削除
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded', // URLSearchParamsを使う場合
                    },
                    body: payload,
                });

                // レスポンスが成功したかを確認
                if (response.ok) {
                    const result = await response.json(); // GASがJSONを返す想定
                    if (result.result === 'success') {
                        alert('商品が正常に登録されました！');
                        form.reset(); // フォームをリセット
                        // フォームリセット後の初期状態に戻す
                        productSelect.value = ''; // 商品セレクトをクリア
                        productInput.style.display = 'inline-block'; // 商品自由入力欄を表示
                        productInput.value = ''; // 自由入力欄をクリア
                        storeSelect.value = ''; // 店舗セレクトをクリア
                        storeInput.style.display = 'inline-block'; // 店舗自由入力欄を表示
                        storeInput.value = ''; // 自由入力欄をクリア
                        unitLabel.textContent = ''; // 単位ラベルをクリア
                        categorySelect.dispatchEvent(new Event('change')); // カテゴリ選択をトリガーして商品リストを初期化
                    } else {
                        alert('登録に失敗しました: ' + (result.message || '不明なエラー'));
                    }
                } else {
                    // HTTPエラーの場合
                    const errorText = await response.text(); // エラーレスポンスの内容を取得
                    console.error('HTTP Error:', response.status, errorText);
                    alert('サーバーエラーが発生しました。状態コード: ' + response.status);
                }
            } catch (error) {
                console.error('データの送信中にエラーが発生しました:', error);
                alert('データの送信中にエラーが発生しました。インターネット接続を確認してください。');
            }
        });
    }

    // 編集モード復元処理 (この部分は既存のまま)
    const editItem = JSON.parse(localStorage.getItem('editItem'));
    if (editItem) {
        categorySelect.value = editItem.category;
        // categorySelect の change イベントを発火させて、productSelect の選択肢を更新
        categorySelect.dispatchEvent(new Event('change'));

        setTimeout(() => {
            // productSelect のオプションがロードされてから値を設定
            if (productSelect.querySelector(`option[value="${editItem.name}"]`)) {
                productSelect.value = editItem.name;
                productInput.style.display = 'none'; // セレクトで選択されるので、手入力は非表示
            } else {
                productSelect.value = ''; // セレクトにない場合は空に
                productInput.value = editItem.name; // 手入力欄に設定
                productInput.style.display = 'inline-block'; // 手入力欄を表示
            }
            unitLabel.textContent = editItem.unit || '';
        }, 100); // 少し遅延させて、productSelectの更新を待つ

        document.getElementById('date').value = editItem.date;

        if (storeSelect.querySelector(`option[value="${editItem.store}"]`)) {
            storeSelect.value = editItem.store;
            storeInput.style.display = 'none'; // セレクトで選択されるので、手入力は非表示
        } else {
            storeSelect.value = ''; // セレクトにない場合は空に
            storeInput.value = editItem.store; // 手入力欄に設定
            storeInput.style.display = 'inline-block'; // 手入力欄を表示
        }

        document.getElementById('weight').value = editItem.weight;
        document.getElementById('price').value = editItem.price;
        document.getElementById('note').value = editItem.note || '';

        localStorage.removeItem('editItem');
    }


    
});


// --- script.js (入力ページ用) の一番下に追加 ---
    // 編集モード復元処理
    const editItem = JSON.parse(localStorage.getItem('editItem'));
    if (editItem) {
        categorySelect.value = editItem['ジャンル']; // スプレッドシートの列名でアクセス
        // categorySelect の change イベントを発火させて、productSelect の選択肢を更新
        categorySelect.dispatchEvent(new Event('change'));

        setTimeout(() => {
            // productSelect のオプションがロードされてから値を設定
            if (productSelect.querySelector(`option[value="${editItem['商品名']}"]`)) {
                productSelect.value = editItem['商品名'];
                productInput.style.display = 'none'; // セレクトで選択されるので、手入力は非表示
            } else {
                productSelect.value = ''; // セレクトにない場合は空に
                productInput.value = editItem['商品名']; // 手入力欄に設定
                productInput.style.display = 'inline-block'; // 手入力欄を表示
            }
            unitLabel.textContent = editItem['単位'] || '';
        }, 100); // 少し遅延させて、productSelectの更新を待つ

        document.getElementById('date').value = editItem['日付'];

        if (storeSelect.querySelector(`option[value="${editItem['店舗名']}"]`)) {
            storeSelect.value = editItem['店舗名'];
            storeInput.style.display = 'none'; // セレクトで選択されるので、手入力は非表示
        } else {
            storeSelect.value = ''; // セレクトにない場合は空に
            storeInput.value = editItem['店舗名']; // 手入力欄に設定
            storeInput.style.display = 'inline-block'; // 手入力欄を表示
        }

        document.getElementById('weight').value = editItem['重さ/個数'];
        document.getElementById('price').value = editItem['金額'];
        document.getElementById('note').value = editItem['メモ'] || '';

        // ★追加：編集対象のrowIndexを隠しフィールドとしてフォームに保持
        // これがないと、編集後の保存時にスプレッドシートのどこを更新すべきか分からないため
        // HTMLフォームに隠しフィールドを追加する必要があります
        let hiddenRowIndexInput = document.getElementById('rowIndex');
        if (!hiddenRowIndexInput) {
            hiddenRowIndexInput = document.createElement('input');
            hiddenRowIndexInput.type = 'hidden';
            hiddenRowIndexInput.id = 'rowIndex';
            hiddenRowIndexInput.name = 'rowIndex'; // FormDataで送るためにname属性が必要
            form.appendChild(hiddenRowIndexInput);
        }
        hiddenRowIndexInput.value = editItem.rowIndex;


        // 編集モードの場合、ボタンのテキストを変更したり、編集IDを保持したりするなどの処理も可能
        document.querySelector('button[type="submit"]').textContent = '更新する';
        alert('編集モードです。情報を変更して更新してください。');
        localStorage.removeItem('editItem'); // 読み込んだら消去
    }
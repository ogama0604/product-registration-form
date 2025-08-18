// input.js (完全版)

// --- 大カテゴリと小カテゴリの定義 ---
const categories = {
    "食費": ["食料品", "外食", "テイクアウト"],
    "日用雑貨": ["消耗品", "雑貨"],
    "交通": ["電車", "タクシー", "バス"]
};
// 出金元と単位の定義
const paymentSources = ["PayPay", "現金", "Oliveクレジット"];
const units = ["個", "g", "ml"];

// URLから編集データを解析
const urlParams = new URLSearchParams(window.location.search);
const editDataParam = urlParams.get('editData');
let editData = null;
if (editDataParam) {
    editData = JSON.parse(decodeURIComponent(editDataParam));
}

document.addEventListener("DOMContentLoaded", () => {
    const itemsContainer = document.getElementById("items-container");
    const addItemBtn = document.getElementById("add-item-btn");
    const currentTotalEl = document.getElementById("current-total");
    const submitBtn = document.getElementById("submit-btn");
    const paymentSourceSelect = document.getElementById("paymentSource");
    const inputDate = document.getElementById("inputDate");
    const inputStore = document.getElementById("inputStore");

    // Google Apps Script WebアプリURL
    // ★★★ ここにご自身のGASのURLを貼り付けてください ★★★
    const gasUrl = "https://script.google.com/macros/s/AKfycbxPjG8L8T_9pI-i-WyLWL1q9wg_N6Op5-cXPEKRu0xsdHGEMUEk3l6unyvyyHVxIbQQkw/exec";

    // --- 品目入力欄を追加する関数 (新規入力用) ---
    function addItemRow() {
        const div = createItemRow({}); // createItemRow関数を再利用
        itemsContainer.appendChild(div);
    }

    // --- 品目入力欄を作成する関数 (共通) ---
    function createItemRow(item = {}) {
        const div = document.createElement("div");
        div.classList.add("item-row");

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "品目名";
        nameInput.value = item.name || '';

        const largeCategorySelect = document.createElement("select");
        largeCategorySelect.innerHTML = `<option value="">大カテゴリ</option>`;
        Object.keys(categories).forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            largeCategorySelect.appendChild(option);
        });
        largeCategorySelect.value = item.categoryLarge || '';

        const smallCategorySelect = document.createElement("select");
        smallCategorySelect.innerHTML = `<option value="">小カテゴリ</option>`;
        if (categories[item.categoryLarge]) {
            categories[item.categoryLarge].forEach(sub => {
                const option = document.createElement("option");
                option.value = sub;
                option.textContent = sub;
                smallCategorySelect.appendChild(option);
            });
        }
        smallCategorySelect.value = item.categorySmall || '';

        largeCategorySelect.addEventListener("change", () => {
            const selected = largeCategorySelect.value;
            smallCategorySelect.innerHTML = `<option value="">小カテゴリ</option>`;
            if (categories[selected]) {
                categories[selected].forEach(sub => {
                    const option = document.createElement("option");
                    option.value = sub;
                    option.textContent = sub;
                    smallCategorySelect.appendChild(option);
                });
            }
        });

        const quantityInput = document.createElement("input");
        quantityInput.type = "number";
        quantityInput.placeholder = "数量";
        quantityInput.min = "1";
        quantityInput.value = item.quantity || '';

        const unitSelect = document.createElement("select");
        unitSelect.innerHTML = `<option value="">単位</option>`;
        units.forEach(unit => {
            const option = document.createElement("option");
            option.value = unit;
            option.textContent = unit;
            unitSelect.appendChild(option);
        });
        unitSelect.value = item.unit || '';

        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.placeholder = "金額";
        priceInput.min = "0";
        priceInput.value = item.price || '';
        priceInput.addEventListener("input", updateTotal);

        const memoInput = document.createElement("input");
        memoInput.type = "text";
        memoInput.placeholder = "メモ";
        memoInput.value = item.memo || '';

        div.appendChild(nameInput);
        div.appendChild(largeCategorySelect);
        div.appendChild(smallCategorySelect);
        div.appendChild(quantityInput);
        div.appendChild(unitSelect);
        div.appendChild(priceInput);
        div.appendChild(memoInput);

        return div;
    }

    // --- 現在の合計金額を更新 ---
    function updateTotal() {
        let total = 0;
        document.querySelectorAll(".item-row input[placeholder='金額']").forEach(input => {
            total += Number(input.value) || 0;
        });
        currentTotalEl.textContent = total;
    }

    // --- 全ての入力欄をクリアする関数 ---
    function clearAllInputs() {
        itemsContainer.innerHTML = '';
        addItemRow();
        
        inputDate.value = "";
        inputStore.value = "";
        paymentSourceSelect.value = "";
        currentTotalEl.textContent = "0";
    }

    // --- データ送信（新規追加・編集） ---
    async function submitData(e) {
        e.preventDefault();

        const isEditMode = !!editData;
        const items = [];
        document.querySelectorAll(".item-row").forEach(row => {
            const inputs = row.querySelectorAll("input, select");
            items.push({
                name: inputs[0].value,
                categoryLarge: inputs[1].value,
                categorySmall: inputs[2].value,
                quantity: inputs[3].value,
                unit: inputs[4].value,
                price: inputs[5].value,
                memo: inputs[6].value
            });
        });
        
        const dataToSend = {};
        
        // 編集モードと新規追加モードでデータを分ける
        if (isEditMode) {
            dataToSend.action = 'edit';
            dataToSend.rowIndex = editData.rowIndex;
            dataToSend.data = {
                date: inputDate.value,
                store: inputStore.value,
                paymentSource: paymentSourceSelect.value,
                name: items[0].name,
                largeCategory: items[0].categoryLarge,
                smallCategory: items[0].categorySmall,
                price: items[0].price,
                quantity: items[0].quantity,
                unit: items[0].unit,
                memo: items[0].memo
            };
        } else {
            dataToSend.action = 'add'; // 新規追加にはactionを追加
            dataToSend.items = items;
            dataToSend.paymentSource = paymentSourceSelect.value;
            dataToSend.date = inputDate.value;
            dataToSend.store = inputStore.value;
            dataToSend.totalAmount = currentTotalEl.textContent;
        }

        try {
            const response = await fetch(gasUrl, {
                method: "POST",
                body: JSON.stringify(dataToSend),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                alert(isEditMode ? "編集を保存しました！" : "送信完了しました！");
                if (isEditMode) {
                    window.location.href = 'history.html';
                } else {
                    clearAllInputs();
                }
            } else {
                alert(`送信に失敗しました: ${result.message}`);
            }
        } catch (err) {
            console.error("送信失敗:", err);
            alert(`送信に失敗しました: ${err.message}`);
        }
    }

    // --- 初期化処理 ---
    function initialize() {
        // 出金元のプルダウンを生成
        paymentSources.forEach(source => {
            const option = document.createElement("option");
            option.value = source;
            option.textContent = source;
            paymentSourceSelect.appendChild(option);
        });

        if (editData) {
            // 編集モード
            inputDate.value = editData.date;
            inputStore.value = editData.store;
            paymentSourceSelect.value = editData.paymentSource;
            
            itemsContainer.innerHTML = '';
            itemsContainer.appendChild(createItemRow(editData));
            
            updateTotal();
            submitBtn.textContent = '編集を保存';
            addItemBtn.style.display = 'none';
        } else {
            // 新規追加モード
            addItemRow();
        }

        addItemBtn.addEventListener("click", addItemRow);
        submitBtn.addEventListener("click", submitData);
    }

    initialize();
});
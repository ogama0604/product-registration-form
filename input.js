// --- 大カテゴリと小カテゴリの定義 ---
const categories = {
  "食費": ["食料品", "外食", "テイクアウト"],
  "日用雑貨": ["消耗品", "雑貨"],
  "交通": ["電車", "タクシー", "バス"]
};

document.addEventListener("DOMContentLoaded", () => {
  const itemsContainer = document.getElementById("items-container");
  const addItemBtn = document.getElementById("add-item-btn");
  const currentTotalEl = document.getElementById("current-total");
  const submitBtn = document.getElementById("submit-btn");

  // --- 品目入力欄を追加する関数 ---
  function addItemRow() {
    const div = document.createElement("div");
    div.classList.add("item-row");

    // 品目名
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "品目名";

    // 大カテゴリ
    const largeCategorySelect = document.createElement("select");
    largeCategorySelect.innerHTML = `<option value="">大カテゴリ</option>`;
    Object.keys(categories).forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      largeCategorySelect.appendChild(option);
    });

    // 小カテゴリ
    const smallCategorySelect = document.createElement("select");
    smallCategorySelect.innerHTML = `<option value="">小カテゴリ</option>`;

    // 大カテゴリ選択時に小カテゴリを更新
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

    // 数量
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.placeholder = "数量";
    quantityInput.min = "1";

    // 単位
    const unitSelect = document.createElement("select");
    ["個", "g", "ml"].forEach(unit => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      unitSelect.appendChild(option);
    });

    // 金額
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.placeholder = "合計金額";
    priceInput.min = "0";

    // メモ
    const memoInput = document.createElement("input");
    memoInput.type = "text";
    memoInput.placeholder = "メモ";

    // 金額入力のたびに合計を更新
    priceInput.addEventListener("input", updateTotal);

    // 要素をまとめて追加
    div.appendChild(nameInput);
    div.appendChild(largeCategorySelect);
    div.appendChild(smallCategorySelect);
    div.appendChild(quantityInput);
    div.appendChild(unitSelect);
    div.appendChild(priceInput);
    div.appendChild(memoInput);

    itemsContainer.appendChild(div);
  }

  // --- 現在の合計金額を更新 ---
  function updateTotal() {
    let total = 0;
    document.querySelectorAll(".item-row input[type='number'][placeholder='合計金額']").forEach(input => {
      total += Number(input.value) || 0;
    });
    currentTotalEl.textContent = total;
  }

  // --- データ送信 ---
  function submitData() {
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

    const paymentSource = document.getElementById("paymentSource").value;
    const date = document.getElementById("date").value;
    const store = document.getElementById("store").value;
    const totalAmount = document.getElementById("current-total").textContent;

    // Google Apps Script WebアプリURL
    const url = "https://script.google.com/macros/s/AKfycbxJL5_YeIz0m89rKmnjBQl982_bQOVjHhm1hS6RywMC64B-YTKY5eZDVp4_Zn2I_kcp_A/exec";

    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        items,
        paymentSource,
        date,
        store,
        totalAmount
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => res.text())
      .then(text => {
        alert("送信完了しました！");
        console.log(text);
      })
      .catch(err => {
        console.error("送信失敗:", err);
        alert("送信に失敗しました");
      });
  }

  // --- 初期化 ---
  addItemBtn.addEventListener("click", addItemRow);
  submitBtn.addEventListener("click", submitData);

  // 最初に1行追加
  addItemRow();
});

document.addEventListener("DOMContentLoaded", () => {
  const historyContainer = document.getElementById("history-container");

  // Google Apps Script WebアプリURL
  const url = "https://script.google.com/macros/s/AKfycbx7QUy6p85oQ8534te7dUjJ_HpnYSYLk45_scbhJPcbqs90LgOfFuBmcyKQ8Z4dX2OLZA/exec";

  // 履歴データを取得
  fetch(url)
    .then(res => res.json())
    .then(data => {
      historyContainer.innerHTML = "";

      if (data.length === 0) {
        historyContainer.textContent = "履歴がありません。";
        return;
      }

      // 表を作成
      const table = document.createElement("table");
      table.classList.add("history-table");

      // ヘッダー行
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

      // データ行
      const tbody = document.createElement("tbody");
      data.forEach(row => {
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
    })
    .catch(err => {
      console.error("履歴の取得に失敗:", err);
      historyContainer.textContent = "履歴の取得に失敗しました。";
    });
});

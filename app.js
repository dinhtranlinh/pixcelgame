submitHashBtn.addEventListener("click", async () => {
  const txHash = txHashInput.value.trim();
  if (!txHash || !userId) {
    hashMessage.textContent = "Vui lòng nhập mã HashTX hợp lệ.";
    return;
  }

  hashMessage.textContent = "Đang xác minh giao dịch...";

  try {
    const res = await fetch(`${API_BASE}/deposit_hash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: userId, tx_hash: txHash })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Lỗi khi nạp");

    hashMessage.textContent = data.message;
    balanceInfo.textContent = `Số dư coin: ${data.new_balance}`;
    txHashInput.value = "";
  } catch (e) {
    hashMessage.textContent = `Lỗi: ${e.message}`;
  }
});

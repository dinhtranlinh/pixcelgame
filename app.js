const tg = window.Telegram.WebApp;
tg.ready();

const userInfo = document.getElementById('user-info');
const balanceInfo = document.getElementById('balance-info');
const rewardBox = document.getElementById('reward');
const boxes = document.querySelectorAll('.box');
const openedBoxes = new Set();

const API_BASE = "https://pixel.clbketnoitinhyeuonline.com";
const userId = tg.initDataUnsafe?.user?.id || null;
const userName = tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name || "Người chơi";

if (!userId) {
  userInfo.textContent = "Không lấy được ID Telegram của bạn.";
  alert("Vui lòng mở Web App qua Telegram để chơi.");
} else {
  userInfo.textContent = `Chào ${userName} (ID: ${userId})`;
  loadBalance();
}

async function loadBalance() {
  balanceInfo.textContent = "Đang tải số dư coin...";
  try {
    const res = await fetch(`${API_BASE}/balance/${userId}`);
    if (!res.ok) throw new Error("Lỗi khi lấy số dư");
    const data = await res.json();

    const balance = data.balance;
    balanceInfo.textContent = `Số dư coin: ${balance}`;

    const depositSection = document.getElementById("deposit-section");
    if (balance <= 0 && depositSection) {
      depositSection.style.display = "block";
    }
  } catch (e) {
    balanceInfo.textContent = "Không thể tải số dư coin.";
    console.error(e);
  }
}

// Mở hộp
async function openBox(index, boxElement) {
  if (openedBoxes.has(index)) return;

  try {
    const res = await fetch(`${API_BASE}/open_box`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: userId, amount: 10 })
    });

    const data = await res.json();
    if (!res.ok) {
      rewardBox.textContent = `Lỗi: ${data.detail || "Không mở hộp được"}`;
      return;
    }

    openedBoxes.add(index);
    boxElement.classList.add("opened");
    rewardBox.textContent = data.message;
    balanceInfo.textContent = `Số dư coin: ${data.new_balance}`;
  } catch (e) {
    rewardBox.textContent = "Lỗi kết nối backend.";
    console.error(e);
  }
}

// Gán sự kiện mở hộp
boxes.forEach((box) => {
  const index = box.getAttribute("data-index");
  box.addEventListener("click", () => openBox(index, box));
});

// Copy ví
function copyWallet() {
  const walletInput = document.getElementById("wallet-address");
  walletInput.select();
  walletInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("Đã sao chép địa chỉ ví!");
}

// Nạp
document.getElementById("submitHashBtn").addEventListener("click", async () => {
  const txHash = document.getElementById("txHashInput").value.trim();
  const hashMessage = document.getElementById("hashMessage");

  if (!txHash) {
    hashMessage.textContent = "Vui lòng nhập mã HashTX.";
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
    if (!res.ok) throw new Error(data.detail || "Lỗi nạp");

    hashMessage.textContent = data.message;
    balanceInfo.textContent = `Số dư coin: ${data.new_balance}`;
    loadBalance();
  } catch (e) {
    hashMessage.textContent = `Lỗi: ${e.message}`;
  }
});

// Rút
document.getElementById("submitWithdrawBtn").addEventListener("click", async () => {
  const address = document.getElementById("withdrawAddress").value.trim();
  const amount = parseInt(document.getElementById("withdrawAmount").value.trim());
  const messageEl = document.getElementById("withdrawMessage");

  if (!address || isNaN(amount) || amount <= 0) {
    messageEl.textContent = "Vui lòng nhập địa chỉ và số coin hợp lệ.";
    return;
  }

  messageEl.textContent = "Đang xử lý rút tiền...";

  try {
    const res = await fetch(`${API_BASE}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: userId, amount })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Lỗi khi rút coin");

    messageEl.textContent = data.message;
    balanceInfo.textContent = `Số dư coin: ${data.new_balance}`;
    loadBalance();
  } catch (e) {
    messageEl.textContent = `Lỗi: ${e.message}`;
  }
});

// Toggle form
function toggleDepositForm() {
  const section = document.getElementById("deposit-section");
  section.style.display = section.style.display === "none" ? "block" : "none";
}

function toggleWithdrawForm() {
  const section = document.getElementById("withdraw-section");
  section.style.display = section.style.display === "none" ? "block" : "none";
}

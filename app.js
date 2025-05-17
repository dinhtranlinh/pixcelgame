const tg = window.Telegram.WebApp;
tg.ready();

const userInfo = document.getElementById('user-info');
const balanceInfo = document.getElementById('balance-info');
const rewardBox = document.getElementById('reward');
const boxes = document.querySelectorAll('.box');
const openedBoxes = new Set();

const API_BASE = "http://103.207.37.231:8888/"; // Thay bằng địa chỉ backend của bạn

// Lấy user info từ Telegram Web App
const userId = tg.initDataUnsafe?.user?.id || null;
const userName = tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name || "Người chơi";

if (!userId) {
  userInfo.textContent = "Không lấy được ID Telegram của bạn.";
  alert("Vui lòng mở Web App qua Telegram để chơi.");
  // Có thể disable game
} else {
  userInfo.textContent = `Chào ${userName} (ID: ${userId})`;
  loadBalance();
}

// Hàm lấy số dư coin từ backend
async function loadBalance() {
  balanceInfo.textContent = "Đang tải số dư coin...";
  try {
    const res = await fetch(`${API_BASE}/balance/${userId}`);
    if (!res.ok) throw new Error("Lỗi khi lấy số dư");
    const data = await res.json();
    balanceInfo.textContent = `Số dư coin: ${data.balance}`;
  } catch (e) {
    balanceInfo.textContent = "Không thể tải số dư coin.";
    console.error(e);
  }
}

// Hàm mở hộp, gọi API backend
async function openBox(index, boxElement) {
  if (openedBoxes.has(index)) return;

  try {
    const res = await fetch(`${API_BASE}/open_box`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: userId, amount: 10 }) // amount 10 coin mở hộp
    });

    const data = await res.json();

    if (!res.ok) {
      rewardBox.textContent = `Lỗi: ${data.detail || "Không mở hộp được"}`;
      return;
    }

    openedBoxes.add(index);
    boxElement.classList.add("opened");
    rewardBox.textContent = data.message;

    // Cập nhật số dư coin mới
    balanceInfo.textContent = `Số dư coin: ${data.new_balance}`;
  } catch (e) {
    rewardBox.textContent = "Lỗi kết nối backend.";
    console.error(e);
  }
}

// Gắn sự kiện click cho từng ô
boxes.forEach((box) => {
  const index = box.getAttribute("data-index");
  box.addEventListener("click", () => openBox(index, box));
});

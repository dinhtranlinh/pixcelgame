
let timeLeft = 300;
let timerEl = document.getElementById("timer-display");
let totalBetEl = document.getElementById("total-bet");
let multiplierSelect = document.getElementById("bet-multiplier");
let totalPixel = 0;
let pixelPlaced = {}; // key: box index, value: number of dots

const boxes = document.querySelectorAll(".box");
const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id || 0;
const API_BASE = "https://pixel.clbketnoitinhyeuonline.com";

function updateTimer() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (timeLeft <= 30) {
    timerEl.classList.add("big");
  } else {
    timerEl.classList.remove("big");
  }

  timeLeft--;
  if (timeLeft < 0) {
  clearInterval(countdownInterval);
  timerEl.textContent = "⏳ Đang xử lý...";
  setTimeout(() => {
    fetchWinnersAndShow();
    // Reset giao diện cho phiên mới
    boxes.forEach(box => box.querySelector(".dots").innerHTML = "");
    totalPixel = 0;
    totalBetEl.textContent = "0";
    pixelPlaced = {};
    if (typeof updateBalance === "function") updateBalance();
    // Reset lại timer cho phiên tiếp theo:
    timeLeft = 300;
    countdownInterval = setInterval(updateTimer, 1000);
  }, 2500);
}

}
const countdownInterval = setInterval(updateTimer, 1000);

function placePixel(index) {
  if (timeLeft <= 30) return; // Ngừng đặt khi countdown cuối

  const multiplier = parseInt(multiplierSelect.value);
  const cost = multiplier; // mỗi pixel = hệ số coin
  totalPixel += multiplier;
  totalBetEl.textContent = totalPixel;

  if (!pixelPlaced[index]) pixelPlaced[index] = 0;
  pixelPlaced[index] += multiplier;

  const dotContainer = boxes[index].querySelector(".dots");
  for (let i = 0; i < multiplier; i++) {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    dotContainer.appendChild(dot);
  }

  fetch(`${API_BASE}/bet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegram_id: userId,
      box_index: index,
      pixel: multiplier
    }),
  }).then(res => res.json()).then(data => {
    if (data.new_balance !== undefined) {
      document.getElementById("user-balance").textContent = `$${data.new_balance.toFixed(2)}`;
    }
  }).catch(err => {
    console.error("Lỗi gửi cược:", err);
  });
}

boxes.forEach((box, idx) => {
  box.addEventListener("click", () => placePixel(idx));
});
function showWinner(winnerData) {
  // winnerData = { username, reward, pixel, box }
  document.getElementById("winner-info").innerHTML = `
    <b>${winnerData.username || 'Người chơi'}</b> thắng <b>${winnerData.reward}</b> PIXEL<br>
    với <b>${winnerData.pixel}</b> pixel ở ô <b>${winnerData.box + 1}</b>!
  `;
  document.getElementById("winner-modal").style.display = "flex";
}
function showWinnersModal(winners) {
  // winners: mảng [{username, reward, pixel, box}]
  const winnerModal = document.getElementById("winner-modal");
  const winnerList = document.getElementById("winner-list");

  if (!winners || winners.length === 0) {
    winnerList.innerHTML = "<div style='padding:16px 0;color:#444;'>Không ai thắng ở phiên này.</div>";
    winnerModal.style.display = "flex";
    return;
  }

  // Xác định người thắng lớn nhất
  let maxReward = Math.max(...winners.map(w => w.reward));
  let html = "";
  winners.forEach(w => {
    let highlight = w.reward === maxReward ? " winner-big" : "";
    html += `
      <div class="winner-item${highlight}">
        <b>${w.username || "Người chơi"}</b> thắng <b>${w.reward}</b> PIXEL
        (${w.pixel} pixel ở ô <b>${(w.box + 1)}</b>)
      </div>`;
  });

  winnerList.innerHTML = html;
  winnerModal.style.display = "flex";
}

function fetchWinnersAndShow() {
  fetch(API_BASE + "/session/last_result")
    .then(res => res.json())
    .then(data => {
      showWinnersModal(data.winners || []);
    });
}

// Trong hàm updateTimer:
if (timeLeft < 0) {
  clearInterval(countdownInterval);
  timerEl.textContent = "⏳ Đang xử lý...";
  setTimeout(fetchWinnersAndShow, 2500); // Chờ backend trả thưởng xong rồi lấy kết quả
}

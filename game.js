
let timerEl = document.getElementById("timer-display");
let totalBetEl = document.getElementById("total-bet");
let multiplierSelect = document.getElementById("bet-multiplier");
let totalPixel = 0;
let pixelPlaced = {}; // key: box index, value: number of dots

const boxes = document.querySelectorAll(".box");
const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id || 0;

window.timeLeft = 300; // Sẽ được cập nhật sau khi lấy từ backend
// Lấy timer phiên hiện tại từ backend
fetch(API_BASE + "/session/current")
  .then(res => res.json())
  .then(data => {
    if (data && data.start_time) {
      let serverStart = new Date(data.start_time); // ISO
      let now = new Date();
      let secondsPassed = Math.floor((now - serverStart) / 1000);
      let timeLeft = 300 - secondsPassed;
      if (timeLeft < 0) timeLeft = 0;
      window.timeLeft = timeLeft;

      // Nếu đã có interval cũ thì clear
      if (window.countdownInterval) clearInterval(window.countdownInterval);
      window.countdownInterval = setInterval(updateTimer, 1000);
    } else {
      // Không lấy được dữ liệu phiên thì fallback về 300
      window.timeLeft = 300;
      window.countdownInterval = setInterval(updateTimer, 1000);
    }
  })
  .catch(() => {
    // Khi lỗi API, fallback về 300
    window.timeLeft = 300;
    window.countdownInterval = setInterval(updateTimer, 1000);
  });


function updateTimer() {
  let minutes = Math.floor(window.timeLeft / 60);
  let seconds = window.timeLeft % 60;
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Hiệu ứng màu và rung cho timer
  timerEl.classList.remove("big", "warning", "shake");
  if (window.timeLeft <= 30 && window.timeLeft > 10) {
    timerEl.classList.add("warning");
  } else if (window.timeLeft <= 10 && window.timeLeft > 0) {
    timerEl.classList.add("warning", "shake");
  }

  window.timeLeft--;
  if (window.timeLeft < 0) {
    clearInterval(window.countdownInterval);
    timerEl.textContent = "⏳ Đang xử lý...";
    timerEl.classList.remove("warning", "shake", "big");
    setTimeout(() => {
      fetchWinnersAndShow();
      // Reset giao diện cho phiên mới
      boxes.forEach(box => box.querySelector(".dots").innerHTML = "");
      totalPixel = 0;
      totalBetEl.textContent = "0";
      pixelPlaced = {};
      if (typeof updateBalance === "function") updateBalance();
      // Lấy phiên mới từ backend!
      fetch(API_BASE + "/session/current")
        .then(res => res.json())
        .then(data => {
          if (data && data.start_time) {
            let serverStart = new Date(data.start_time);
            let now = new Date();
            let secondsPassed = Math.floor((now - serverStart) / 1000);
            let timeLeft = 300 - secondsPassed;
            if (timeLeft < 0) timeLeft = 0;
            window.timeLeft = timeLeft;
            window.countdownInterval = setInterval(updateTimer, 1000);
          }
        });
    }, 2500);
  }
}


function placePixel(index) {
  if (window.timeLeft <= 30) return; // Ngừng đặt khi countdown cuối

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


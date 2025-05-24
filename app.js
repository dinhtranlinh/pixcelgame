const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe?.user;
const userInfo = document.getElementById("user-greeting");
const userIdInfo = document.getElementById("user-id");
const avatar = document.getElementById("user-avatar");
const balanceDisplay = document.getElementById("user-balance");
const rewardBox = document.getElementById("reward");
const openedBoxes = new Set();

const API_BASE = "https://pixel.clbketnoitinhyeuonline.com";

if (user) {
  userInfo.textContent = `Chào ${user.username || user.first_name}`;
  userIdInfo.textContent = `(ID: ${user.id})`;
  if (user.photo_url) avatar.src = user.photo_url;
}

async function updateBalance() {
  balanceDisplay.textContent = "...";
  try {
    const res = await fetch(`${API_BASE}/balance/${user.id}`);
    const data = await res.json();
    balanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
  } catch (e) {
    balanceDisplay.textContent = "Lỗi tải số dư";
  }
}
updateBalance();




document.getElementById("btn-deposit").onclick = () => openModal("deposit-modal");
document.getElementById("btn-send").onclick = () => openModal("send-modal");

function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
function copyAddress() {
  const address = document.getElementById("wallet-address").textContent;
  navigator.clipboard.writeText(address).then(() => alert("Address copied!"));
}
function sendCoin() {
  const to = document.getElementById("send-address").value;
  const amount = document.getElementById("send-amount").value;
  alert(`Sending ${amount} PIXEL to ${to} (fake demo)`); // Replace this with real logic
}

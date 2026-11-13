/* =========================================
   GOLDEN NEST - JAVASCRIPT
========================================= */

let balance = Number(localStorage.getItem("atelier")) || 0;

let history = JSON.parse(
  localStorage.getItem("atelier_history") || "[]"
);

let chosenMode = "";
let toastTimer;


/* SAVE DATA */

function saveData() {
  localStorage.setItem("atelier", balance);
  localStorage.setItem("atelier_history", JSON.stringify(history));
}


/* FORMAT MONEY */

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
/* ==============================
   MOBILE MENU
============================== */

function toggleMenu() {
  const menu = document.getElementById("mainMenu");
  const toggle = document.getElementById("menuToggle");

  if (!menu || !toggle) return;

  const isOpen = menu.classList.toggle("open");

  toggle.setAttribute("aria-expanded", isOpen);
  toggle.textContent = isOpen ? "✕ Close" : "☰ Menu";
}


/* ==============================
   PAGE NAVIGATION
============================== */

function showPage(id) {
  const target = document.getElementById(id);

  if (!target) {
    console.warn("Page not found:", id);
    return;
  }

  // Hide all pages
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  // Display selected page
  target.classList.add("active");

  // Show chart and footer only on homepage
  document.body.classList.toggle(
    "home-page",
    id === "dashboard"
  );

  // Close mobile menu
  const menu = document.getElementById("mainMenu");
  const toggle = document.getElementById("menuToggle");

  if (menu) {
    menu.classList.remove("open");
  }

  if (toggle) {
    toggle.textContent = "☰ Menu";
    toggle.setAttribute("aria-expanded", "false");
  }

  // Update active navigation button
  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.remove("active");
  });

  const navButton = Array.from(
    document.querySelectorAll(".nav-link")
  ).find(button => {
    const action = button.getAttribute("onclick") || "";
    return action.includes("'" + id + "'");
  });

  if (navButton) {
    navButton.classList.add("active");
  }

  // Restart fade-in animations
  target.querySelectorAll(".fade, .box-fade").forEach(element => {
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
  });

  // Refresh dashboard information
  if (typeof updateBalance === "function") {
    updateBalance();
  }

  if (typeof updateDashboardStats === "function") {
    updateDashboardStats();
  }

  // Refresh transaction history
  if (id === "history" && typeof drawList === "function") {
    drawList("fullList");
  }

  if (id === "dashboard" && typeof drawList === "function") {
    drawList("dashList", 4);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ==============================
   INITIAL PAGE LOAD
============================== */

document.addEventListener("DOMContentLoaded", () => {

  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  if (typeof updateBalance === "function") {
    updateBalance();
  }

  if (typeof drawList === "function") {
    drawList("dashList", 4);
    drawList("fullList");
  }

  showPage("dashboard");

});


/* BALANCE */

function updateBalance() {
  document.querySelectorAll(".bal").forEach(element => {
    // Dollar sign is added only here
    element.textContent = "$" + formatMoney(balance);
  });

  updateDashboardStats();
}


/* DASHBOARD STATISTICS */

function updateDashboardStats() {
  const completed = history.filter(item =>
    String(item.status).toLowerCase() === "completed"
  );

  const invested = completed
    .filter(item => item.type === "Purchase")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const portfolio = balance + invested;

  const totalProfit = completed
    .filter(item => item.type === "Profit")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalBonus = completed
    .filter(item => item.type === "Bonus")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalDeposit = completed
    .filter(item => item.type === "Deposit")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const values = {
    portfolioValue: portfolio,
    profitValue: totalProfit,
    bonusValue: totalBonus,
    dashboardDeposit: totalDeposit
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) {
      // Dollar sign is added once, here
      element.textContent = "$" + formatMoney(value);
    }
  });
}


/* TRANSACTION HISTORY */

function drawList(elementId, limit = null) {
  const container = document.getElementById(elementId);

  if (!container) return;

  container.innerHTML = "";

  const list = limit
    ? history.slice(-limit).reverse()
    : history.slice().reverse();

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "small";
    empty.style.padding = "15px 0";
    empty.textContent = "No transactions yet.";

    container.appendChild(empty);
    return;
  }

  list.forEach(item => {
    const row = document.createElement("div");
    row.className = "item";

    const left = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = item.type || "Transaction";

    const details = document.createElement("div");
    details.className = "small";
    details.textContent =
      (item.date || "") +
      (item.mode ? " • " + item.mode : "");

    left.appendChild(title);
    left.appendChild(details);

    const right = document.createElement("div");

    const amount = document.createElement("div");
    amount.textContent = "$" + formatMoney(item.amount);

    const status = document.createElement("div");
    status.className = "small";
    status.textContent = item.status || "Pending";

    right.appendChild(amount);
    right.appendChild(status);

    row.appendChild(left);
    row.appendChild(right);

    container.appendChild(row);

    // Demo confirmation control
    if (
      item.type === "Deposit" &&
      item.status === "Pending" &&
      elementId === "fullList"
    ) {
      const confirmButton = document.createElement("button");

      confirmButton.textContent = "Confirm Deposit";
      confirmButton.className = "gold";
      confirmButton.style.margin = "10px 0 15px";

      confirmButton.onclick = () => confirmDeposit(item.id);

      container.appendChild(confirmButton);
    }
  });
}


/* PAYMENT METHOD SELECTION */

function chooseMode(button, mode) {
  chosenMode = mode;

  const activePage = document.querySelector(".page.active");

  if (!activePage) return;

  activePage.querySelectorAll(".mode").forEach(element => {
    element.classList.remove("selected");
  });

  if (button) {
    button.classList.add("selected");
  }
}


/* PROCEED TO PAYMENT */

function proceedPayment() {
  const amountInput = document.getElementById("depAmount");

  if (!amountInput) return;

  const amount = Number(amountInput.value);

  if (!amount || amount <= 0) {
    showMessage("Please enter a valid deposit amount.");
    return;
  }

  if (!chosenMode) {
    showMessage("Please select a payment method.");
    return;
  }

  const payMethod = document.getElementById("payMethod");
  const payAmount = document.getElementById("payAmount");
  const addressBox = document.getElementById("addressBox");
  const networkBox = document.getElementById("payNetwork");

  if (payMethod) {
    payMethod.textContent = chosenMode;
  }

  if (payAmount) {
    payAmount.textContent = "$" + formatMoney(amount);
  }

  const addresses = {
    Bitcoin: "bc1q75kl43x0fhtngf3pah9rt2cmf3l8pajfvdq3h8",
    TRON: "TSHu7uhBUS6MLwGJmoDsU5vGf8xZ27gxRD",
    USDT: "0x2A9c14b37622424a99a07F0B0a76aa27A4D770A6",
    Ethereum: "0x2A9c14b37622424a99a07F0B0a76aa27A4D770A6",
    Litecoin: "ltc1qlh3p6h8jceg3j2tgmhw824ca04pgr5l0wan98c",
    "Bank Transfer": "YOUR BANK / YOUR NAME / 0000000000"
  };

  if (addressBox) {
    addressBox.textContent =
      addresses[chosenMode] || "Payment details unavailable.";
  }

  if (networkBox) {
    networkBox.style.display =
      ["Bitcoin", "USDT", "Ethereum", "Litecoin"].includes(chosenMode)
        ? "block"
        : "none";
  }

  showPage("pay");
}


/* COPY ADDRESS */

function copyAddress() {
  const addressBox = document.getElementById("addressBox");

  if (!addressBox) return;

  const address = addressBox.textContent.trim();

  if (!address) {
    showMessage("No payment address available.");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(address)
      .then(() => showMessage("Address copied successfully."))
      .catch(() => showMessage("Unable to copy. Please copy manually."));
  } else {
    showMessage("Please copy the address manually.");
  }
}


/* RECEIPT FILE NAME */

function showFileName() {
  const fileInput = document.getElementById("receiptFile");
  const fileName = document.getElementById("fileName");

  if (!fileInput || !fileName) return;

  fileName.textContent = fileInput.files.length
    ? fileInput.files[0].name
    : "No file selected";
}


/* SUBMIT DEPOSIT RECEIPT */

function submitReceipt() {
  const fileInput = document.getElementById("receiptFile");

  const amount = Number(
    document.getElementById("payAmount")?.textContent
      .replace(/[$,]/g, "") || 0
  );

  if (!amount || amount <= 0) {
    showMessage("Invalid deposit amount.");
    return;
  }

  if (!chosenMode) {
    showMessage("Please select a payment method.");
    return;
  }

  if (!fileInput || !fileInput.files.length) {
    showMessage("Please upload your payment receipt.");
    return;
  }

  const file = fileInput.files[0];

  if (file.size > 5 * 1024 * 1024) {
    showMessage("Receipt must be smaller than 5MB.");
    return;
  }

  history.push({
    id: Date.now(),
    type: "Deposit",
    amount: amount,
    mode: chosenMode,
    status: "Pending",
    date: new Date().toLocaleString()
  });

  saveData();

  fileInput.value = "";

  const fileName = document.getElementById("fileName");

  if (fileName) {
    fileName.textContent = "No file selected";
  }

  const depAmount = document.getElementById("depAmount");

  if (depAmount) {
    depAmount.value = "";
  }

  chosenMode = "";

  document.querySelectorAll(".mode").forEach(button => {
    button.classList.remove("selected");
  });

  drawList("dashList", 4);
  drawList("fullList");
  updateDashboardStats();

  showMessage("Receipt submitted. Awaiting verification.");
  showPage("history");
}


/* CONFIRM DEPOSIT - DEMO ONLY */

function confirmDeposit(id) {
  const transaction = history.find(item =>
    item.id === id &&
    item.type === "Deposit" &&
    item.status === "Pending"
  );

  if (!transaction) {
    showMessage("Transaction not found.");
    return;
  }

  transaction.status = "Completed";

  balance += Number(transaction.amount || 0);

  saveData();
  updateBalance();

  drawList("dashList", 4);
  drawList("fullList");

  showMessage("Demo deposit marked as completed.");
}


/* WITHDRAW */

function doWithdraw() {
  const amountInput = document.getElementById("wAmount");
  const addressInput = document.getElementById("wAddress");
  const networkInput = document.getElementById("wNetwork");

  if (!amountInput || !addressInput) return;

  const amount = Number(amountInput.value);
  const address = addressInput.value.trim();

  if (!amount || amount <= 0) {
    showMessage("Enter a valid withdrawal amount.");
    return;
  }

  if (amount > balance) {
    showMessage("Insufficient balance.");
    return;
  }

  if (!address) {
    showMessage("Enter your withdrawal wallet address.");
    return;
  }

  balance -= amount;

  history.push({
    id: Date.now(),
    type: "Withdrawal",
    amount: amount,
    mode: networkInput ? networkInput.value : "",
    address: address,
    status: "Pending",
    date: new Date().toLocaleString()
  });

  saveData();
  updateBalance();

  drawList("dashList", 4);
  drawList("fullList");

  amountInput.value = "";
  addressInput.value = "";

  showMessage("Withdrawal request submitted.");
  showPage("history");
}


/* BUY PLAN */

function buyItem(name, amount) {
  amount = Number(amount);

  if (!amount || amount <= 0) {
    showMessage("Invalid investment amount.");
    return;
  }

  if (balance < amount) {
    showMessage("Insufficient balance. Please deposit first.");
    showPage("deposit");
    return;
  }

  const confirmed = confirm(
    "Do you want to purchase " + name +
    " for $" + formatMoney(amount) + "?"
  );

  if (!confirmed) return;

  balance -= amount;

  history.push({
    id: Date.now(),
    type: "Purchase",
    amount: amount,
    mode: name,
    status: "Completed",
    date: new Date().toLocaleString()
  });

  saveData();
  updateBalance();

  drawList("dashList", 4);
  drawList("fullList");

  showMessage(name + " purchase recorded.");
  showPage("history");
}


/* TOAST MESSAGE */

function showMessage(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


/* INITIALIZE WEBSITE */

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  updateBalance();
  drawList("dashList", 4);
  drawList("fullList");

  showPage("dashboard");
});
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const monthlyCost = document.getElementById('monthly-cost');
const yearlyCost = document.getElementById('yearly-cost');
const yearlySummary = document.getElementById('yearly-summary');
const apostrophe = String.fromCharCode(8217);

function formatPounds(value) {
  return `${String.fromCharCode(163)}${value}`;
}

function updateCosts() {
  const monthlyTotal = Array.from(checkboxes).reduce((total, checkbox) => {
    return checkbox.checked ? total + Number(checkbox.dataset.price) : total;
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  monthlyCost.textContent = formatPounds(monthlyTotal);
  yearlyCost.textContent = formatPounds(yearlyTotal);
  yearlySummary.textContent = `That${apostrophe}s ${formatPounds(yearlyTotal)} per year to stay in the room.`;
}

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', updateCosts);
});

updateCosts();

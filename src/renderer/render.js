const { ipcRenderer } = require('electron');

document.getElementById('family-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const member = {
    full_name: document.getElementById('full_name').value,
    birth_date: document.getElementById('birth_date').value,
    position: document.getElementById('position').value,
    workplace: document.getElementById('workplace').value,
    monthly_income: parseInt(document.getElementById('monthly_income').value, 10)
  };

  try {
    const response = await ipcRenderer.invoke('addFamilyMember', member);
    alert(response);
    document.getElementById('family-form').reset();
    loadFamilyMembers();
  } catch (error) {
    alert('Ошибка: ' + error);
  }
});

async function loadFamilyMembers() {
  const listElement = document.getElementById('family-list');
  listElement.innerHTML = '';

  try {
    const members = await ipcRenderer.invoke('getFamilyMembers');
    members.forEach(member => {
      const listItem = document.createElement('div');
      listItem.className = 'family-item';
      listItem.innerHTML = `
        <p><strong>ФИО:</strong> ${member.full_name}</p>
        <p><strong>Дата рождения:</strong> ${member.birth_date}</p>
        <p><strong>Должность:</strong> ${member.position || 'Не указано'}</p>
        <p><strong>Место работы:</strong> ${member.workplace || 'Не указано'}</p>
        <p><strong>Месячный доход:</strong> ${member.monthly_income}</p>
        <button onclick="deleteMember(${member.id})">Удалить</button>
      `;
      listElement.appendChild(listItem);
    });
  } catch (error) {
    console.error('Ошибка загрузки списка членов семьи:', error);
  }
}

async function deleteMember(id) {
  try {
    const response = await ipcRenderer.invoke('deleteFamilyMember', id);
    alert(response);
    loadFamilyMembers();
  } catch (error) {
    alert('Ошибка удаления: ' + error);
  }
}

document.getElementById('refresh-summary').addEventListener('click', async () => {
  try {
    const summary = await ipcRenderer.invoke('getBudgetSummary');
    document.getElementById('total-income').textContent = summary.totalIncome;
    document.getElementById('total-expenses').textContent = summary.totalExpenses;
    document.getElementById('balance').textContent = summary.balance;
    document.getElementById('status').textContent = summary.status;
  } catch (error) {
    console.error('Ошибка обновления анализа бюджета:', error);
  }
});

document.addEventListener('DOMContentLoaded', loadFamilyMembers);
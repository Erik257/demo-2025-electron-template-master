import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import Database from 'better-sqlite3';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

let db;

function initializeDatabase() {
  try {
    const dbPath = join(__dirname, '../../family_budget.db');
    db = new Database(dbPath);
    console.log('База данных успешно подключена');

    db.prepare(`
      CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        position TEXT,
        workplace TEXT,
        monthly_income INTEGER NOT NULL
      )
    `).run();
    console.log('Таблица family_members готова');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
  }
}

ipcMain.handle('addFamilyMember', async (event, member) => {
  const { full_name, birth_date, position, workplace, monthly_income } = member;
  try {
    db.prepare(`
      INSERT INTO family_members (full_name, birth_date, position, workplace, monthly_income)
      VALUES (?, ?, ?, ?, ?)
    `).run(full_name, birth_date, position, workplace, monthly_income);
    return 'Член семьи успешно добавлен';
  } catch (error) {
    console.error('Ошибка при добавлении члена семьи:', error);
    throw 'Ошибка при добавлении данных';
  }
});

ipcMain.handle('getFamilyMembers', async () => {
  try {
    const members = db.prepare('SELECT * FROM family_members').all();
    return members;
  } catch (error) {
    console.error('Ошибка при получении списка членов семьи:', error);
    throw 'Ошибка получения данных';
  }
});

ipcMain.handle('deleteFamilyMember', async (event, id) => {
  try {
    db.prepare('DELETE FROM family_members WHERE id = ?').run(id);
    return 'Член семьи успешно удалён';
  } catch (error) {
    console.error('Ошибка при удалении члена семьи:', error);
    throw 'Ошибка удаления';
  }
});

ipcMain.handle('getBudgetSummary', async () => {
  try {
    const totalIncomeRow = db.prepare('SELECT SUM(monthly_income) AS total_income FROM family_members').get();
    const totalIncome = totalIncomeRow?.total_income || 0;
    const totalExpenses = Math.floor(totalIncome * 0.75); // Предполагаем, что расходы — 75% от дохода
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
      status: balance >= 0 ? 'Профицит бюджета' : 'Дефицит бюджета'
    };
  } catch (error) {
    console.error('Ошибка при расчёте бюджета:', error);
    throw 'Ошибка получения анализа бюджета';
  }
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');
  initializeDatabase();

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

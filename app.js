/**
 * Kaasu - Premium Expense Tracker
 * Main Application Logic
 */

const app = {
    // Database and State
    db: null,
    expenses: [],
    budgets: {},
    expenseCategories: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'],
    incomeCategories: ['Salary', 'Freelance', 'Business', 'Investments', 'Other'],
    currentEditId: null,
    charts: {},

    // UI Elements map
    els: {},

    // Initialize App
    async init() {
        this.cacheDOM();
        this.bindEvents();
        await this.initDB();
        await this.loadData();
        this.updateUI();
        this.initCharts();
    },

    // Cache DOM Elements
    cacheDOM() {
        this.els = {
            navLinks: document.querySelectorAll('.nav-links li'),
            pages: document.querySelectorAll('.page'),
            pageTitle: document.getElementById('page-title'),
            pageSubtitle: document.getElementById('page-subtitle'),

            // Buttons
            btnAddExp: document.getElementById('btn-add-expense'),
            btnSetBudget: document.getElementById('btn-set-budget'),
            btnDownloadPdf: document.getElementById('btn-download-pdf'),

            // Modals
            modalExp: document.getElementById('modal-expense'),
            modalBudget: document.getElementById('modal-budget'),
            expForm: document.getElementById('form-expense'),
            budgetForm: document.getElementById('form-budget'),
            closeBtns: document.querySelectorAll('.btn-close, .btn-cancel'),

            // Transaction Form
            typeInputs: document.querySelectorAll('input[name="trans-type"]'),
            expAmount: document.getElementById('exp-amount'),
            expDesc: document.getElementById('exp-desc'),
            expCategory: document.getElementById('exp-category'),
            expDate: document.getElementById('exp-date'),
            expRecurring: document.getElementById('exp-recurring'),
            budgetRolloverToggle: document.getElementById('budget-rollover-toggle'),

            // Dashboard
            dashTotalIncome: document.getElementById('dash-total-income'),
            dashTotalSpent: document.getElementById('dash-total-spent'),
            dashBalance: document.getElementById('dash-balance'),
            dashSavings: document.getElementById('dash-savings'),
            dashSavingsInsight: document.getElementById('dash-savings-insight'),
            dashTableBody: document.querySelector('#dash-recent-table tbody'),

            // Transactions Page
            expTableBody: document.querySelector('#expenses-table tbody'),
            filterType: document.getElementById('filter-type'),
            filterCategory: document.getElementById('filter-category'),
            btnClearFilters: document.getElementById('btn-clear-filters'),
            transSearch: document.getElementById('trans-search'),
            btnExportData: document.getElementById('btn-export-data'),
            btnImportData: document.getElementById('btn-import-data'),
            fileImport: document.getElementById('file-import'),
            transPagination: document.getElementById('trans-pagination'),
            btnClearTrans: document.getElementById('btn-clear-transactions'),

            // Reports Filter
            reportDateFilter: document.getElementById('report-date-filter'),

            // Reports KPIs
            repSavingsRate: document.getElementById('rep-savings-rate'),
            repTopExpense: document.getElementById('rep-top-expense'),
            repDailySpend: document.getElementById('rep-daily-spend'),

            // Layout & Themes
            themeSelector: document.getElementById('theme-selector'),
            themeModeToggle: document.getElementById('theme-mode-toggle'),

            dashDateFilter: document.getElementById('dash-date-filter'),
            dashCustomDates: document.getElementById('dash-custom-dates'),
            dashStartDate: document.getElementById('dash-start-date'),
            dashEndDate: document.getElementById('dash-end-date'),

            transDateFilter: document.getElementById('trans-date-filter'),
            transCustomDates: document.getElementById('trans-custom-dates'),
            transStartDate: document.getElementById('trans-start-date'),
            transEndDate: document.getElementById('trans-end-date'),

            reportDateFilter: document.getElementById('report-date-filter'),
            reportCustomDates: document.getElementById('report-custom-dates'),
            reportStartDate: document.getElementById('report-start-date'),
            reportEndDate: document.getElementById('report-end-date'),

            // Budget Page
            budgetContainer: document.getElementById('budget-progress-container'),
            budgetInputsContainer: document.getElementById('budget-inputs-container'),
        };
    },

    // Bind Event Listeners
    bindEvents() {
        // Navigation
        this.els.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.els.navLinks.forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.navigate(e.currentTarget.dataset.page);
            });
        });

        // Modals
        this.els.btnAddExp.addEventListener('click', () => this.openTransactionModal());
        this.els.btnSetBudget.addEventListener('click', () => this.openBudgetModal());
        this.els.btnDownloadPdf.addEventListener('click', () => this.downloadPDF());
        this.els.btnExportData?.addEventListener('click', () => this.exportCSV());
        this.els.fileImport?.addEventListener('change', (e) => this.importData(e));

        const btnSuggest = document.getElementById('btn-suggest-upgrades');
        if (btnSuggest) {
            btnSuggest.addEventListener('click', () => this.sendFeedback());
        }

        this.els.closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.els.modalExp.classList.remove('show');
                this.els.modalBudget.classList.remove('show');
            });
        });

        if (this.els.btnClearTrans) {
            this.els.btnClearTrans.addEventListener('click', () => this.clearAllTransactions());
        }

        // Form Type Toggle
        this.els.typeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.populateFormCategories(e.target.value));
        });

        // Smart Category Auto-Suggest
        this.els.expDesc.addEventListener('blur', (e) => this.autoSuggestCategory(e.target.value));

        // Forms Submit
        this.els.expForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        this.els.budgetForm.addEventListener('submit', (e) => {
            this.handleBudgetSubmit(e);
        });

        // Global Keyboard Shortcut (Quick Add)
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in an input or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            const isAKey = e.key === 'a' || e.key === 'A';
            const hasModifier = e.ctrlKey || e.metaKey; // Ctrl+A or Cmd+A (Mac)

            if (isAKey || (hasModifier && isAKey)) {
                e.preventDefault();
                this.openTransactionModal();
            }
        });

        // Filters
        this.els.filterType.addEventListener('change', (e) => {
            this.populateFilterCategories(e.target.value);
            this.renderTransactionsTable();
        });
        this.els.filterCategory.addEventListener('change', () => this.renderTransactionsTable());
        this.els.transSearch?.addEventListener('input', () => this.renderTransactionsTable());
        this.els.transPagination?.addEventListener('change', () => this.renderTransactionsTable());

        if (this.els.btnClearFilters) {
            this.els.btnClearFilters.addEventListener('click', () => {
                this.els.filterType.value = 'All';
                this.els.filterCategory.value = 'All';
                this.els.transDateFilter.value = 'all';
                this.els.transCustomDates.style.display = 'none';
                this.els.transStartDate.value = '';
                this.els.transEndDate.value = '';
                if (this.els.transSearch) this.els.transSearch.value = '';
                this.populateFilterCategories('All');
                this.renderTransactionsTable();
            });
        }

        if (this.els.themeSelector) {
            this.els.themeSelector.addEventListener('change', (e) => {
                document.documentElement.setAttribute('data-theme', e.target.value);
                localStorage.setItem('kaasu_theme', e.target.value);
                this.updateCharts(); // Refresh chart colors
            });
            // Initial load
            const savedTheme = localStorage.getItem('kaasu_theme') || 'panther';
            this.els.themeSelector.value = savedTheme;
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // Dark/Light Mode Load
        const savedMode = localStorage.getItem('kaasu_theme_mode') || 'dark';
        if (savedMode === 'light') document.documentElement.setAttribute('data-theme-mode', 'light');

        if (this.els.themeModeToggle) {
            this.els.themeModeToggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme-mode');
                const nextMode = current === 'light' ? 'dark' : 'light';
                if (nextMode === 'light') {
                    document.documentElement.setAttribute('data-theme-mode', 'light');
                } else {
                    document.documentElement.removeAttribute('data-theme-mode');
                }
                localStorage.setItem('kaasu_theme_mode', nextMode);
                this.updateCharts();
            });
        }

        const setupCustomDateToggle = (selectEl, customContainer, startInput, endInput, updateFn) => {
            if (!selectEl) return;
            selectEl.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customContainer.style.display = 'flex';
                } else {
                    customContainer.style.display = 'none';
                    updateFn();
                }
            });
            startInput.addEventListener('change', () => { if (startInput.value && endInput.value) updateFn(); });
            endInput.addEventListener('change', () => { if (startInput.value && endInput.value) updateFn(); });
        };

        setupCustomDateToggle(this.els.dashDateFilter, this.els.dashCustomDates, this.els.dashStartDate, this.els.dashEndDate, () => {
            this.renderDashboardSummary();
            this.renderDashboardTable();
            this.updateCharts();
        });
        setupCustomDateToggle(this.els.transDateFilter, this.els.transCustomDates, this.els.transStartDate, this.els.transEndDate, () => {
            this.renderTransactionsTable();
        });
        setupCustomDateToggle(this.els.reportDateFilter, this.els.reportCustomDates, this.els.reportStartDate, this.els.reportEndDate, () => {
            this.updateCharts();
        });

        this.checkRecurringTransactions();
        this.checkDailyReminder();
    },

    checkDailyReminder() {
        if ('Notification' in window) {
            Notification.requestPermission();

            const lastNotified = localStorage.getItem('kaasu_last_notified');
            const todayStr = new Date().toDateString();

            if (lastNotified !== todayStr) {
                const now = new Date();
                // If it's past 8 PM
                if (now.getHours() >= 20) {
                    // Check if a transaction exists today
                    const todayLocalStr = now.toISOString().split('T')[0];
                    const hasLoggedToday = this.expenses.some(e => e.date === todayLocalStr);

                    if (!hasLoggedToday) {
                        try {
                            if (Notification.permission === 'granted') {
                                new Notification('Kaasu Expense Tracker', {
                                    body: "Don't forget to log your expenses today! Keep your budget up to date.",
                                    icon: 'favicon.ico'
                                });
                                localStorage.setItem('kaasu_last_notified', todayStr);
                            }
                        } catch (err) {
                            console.warn("Notifications not supported or blocked.");
                        }
                    }
                }
            }
        }
    },

    // Navigation Logic
    navigate(pageId) {
        this.els.pages.forEach(p => p.classList.remove('active-page'));
        document.getElementById(`page-${pageId}`).classList.add('active-page');

        const titles = {
            dashboard: { title: 'Dashboard', sub: "Welcome back, here's your financial overview." },
            transactions: { title: 'Transactions', sub: 'Manage and track all your money flows.' },
            budget: { title: 'Budgets', sub: 'Set expense limits and monitor your goals.' },
            reports: { title: 'Reports', sub: 'Visualize your cashflow and trends.' }
        };

        this.els.pageTitle.textContent = titles[pageId].title;
        this.els.pageSubtitle.textContent = titles[pageId].sub;

        // Toggle PDF/Export Buttons
        this.els.btnDownloadPdf.style.display = (pageId === 'transactions') ? 'inline-flex' : 'none';
        if (this.els.btnExportData) this.els.btnExportData.style.display = (pageId === 'transactions') ? 'inline-flex' : 'none';
        if (this.els.btnImportData) this.els.btnImportData.style.display = (pageId === 'transactions') ? 'inline-flex' : 'none';
        if (this.els.btnClearTrans) this.els.btnClearTrans.style.display = (pageId === 'transactions') ? 'inline-flex' : 'none';

        if (pageId === 'dashboard') {
            this.els.dashDateFilter.style.display = 'block';
        } else {
            this.els.dashDateFilter.style.display = 'none';
        }

        // Refresh charts if needed
        if (pageId === 'reports' || pageId === 'dashboard') {
            // Slight delay to allow display:block to render widths and CSS transitions to finish
            setTimeout(() => {
                this.updateCharts();
                if (this.charts.dashCat) this.charts.dashCat.resize();
                if (this.charts.trend) this.charts.trend.resize();
                if (pageId === 'dashboard') this.renderDashboardSummary();
            }, 100);
        }
    },

    // Database Initialization (IndexedDB)
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('KaasuDB', 2); // bumped to version 2 for new schema possibility

            request.onerror = (e) => reject('Error opening DB');

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('expenses')) {
                    db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('budgets')) {
                    db.createObjectStore('budgets', { keyPath: 'category' });
                }
            };
        });
    },

    // Load Data
    loadData() {
        return Promise.all([
            new Promise(resolve => {
                const tx = this.db.transaction('expenses', 'readonly');
                const store = tx.objectStore('expenses');
                const req = store.getAll();
                req.onsuccess = () => {
                    // Normalize backward compatibility (old entries didn't have type)
                    this.expenses = req.result.map(e => {
                        if (!e.type) {
                            e.type = this.incomeCategories.includes(e.category) ? 'income' : 'expense';
                        }
                        return e;
                    }).sort((a, b) => new Date(b.date) - new Date(a.date));
                    resolve();
                };
            }),
            new Promise(resolve => {
                const tx = this.db.transaction('budgets', 'readonly');
                const store = tx.objectStore('budgets');
                const req = store.getAll();
                req.onsuccess = () => {
                    this.budgets = req.result.reduce((acc, curr) => {
                        acc[curr.category] = curr.amount;
                        return acc;
                    }, {});

                    if (Object.keys(this.budgets).length === 0) {
                        this.expenseCategories.forEach(cat => this.budgets[cat] = 0);
                    }
                    resolve();
                };
            })
        ]);
    },

    // Update UI Wrapper
    updateUI() {
        this.renderDashboardSummary();
        this.renderDashboardTable();
        this.populateFilterCategories('All');
        this.renderTransactionsTable();
        this.renderBudgetProgress();
        setTimeout(() => this.updateCharts(), 100);
    },

    animateValue(id, start, end, duration, formatFn) {
        const obj = document.getElementById(id);
        if (!obj) return;
        if (start === end) {
            obj.innerHTML = formatFn(end);
            return;
        }
        const range = end - start;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.round(start + range * progress); // Using round to drop fractional width jitter
            obj.innerHTML = formatFn(current);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = formatFn(end);
            }
        };
        window.requestAnimationFrame(step);
    },

    getFilteredDataByDate(dataset, filterValue, startInput, endInput) {
        if (!filterValue || filterValue === 'all') return dataset;
        if (filterValue === 'custom') {
            if (!startInput || !endInput || !startInput.value || !endInput.value) return dataset;
            const start = new Date(startInput.value);
            const end = new Date(endInput.value);
            end.setHours(23, 59, 59, 999);
            return dataset.filter(e => {
                const d = new Date(e.date);
                return d >= start && d <= end;
            });
        }
        if (filterValue === 'current_month') {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            return dataset.filter(e => {
                const d = new Date(e.date);
                return d >= start && d <= end;
            });
        }

        const days = parseInt(filterValue);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return dataset.filter(e => new Date(e.date) >= cutoffDate);
    },

    getFilteredDashboardExpenses() {
        return this.getFilteredDataByDate(this.expenses, this.els.dashDateFilter?.value, this.els.dashStartDate, this.els.dashEndDate);
    },

    // Calculate totals
    calculateTotals(dataset = this.expenses) {
        let totalIncome = 0;
        let totalExpense = 0;

        dataset.forEach(t => {
            if (t.type === 'income') totalIncome += Number(t.amount);
            else totalExpense += Number(t.amount);
        });

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        };
    },

    formatMoney(amount) {
        return '₹' + Number(Math.abs(amount)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    },

    formatPDFMoney(amount) {
        let str = Number(Math.abs(amount)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        // Strip any U+202F, standard spaces, or non-breaking spaces injected by OS localization into Kerning
        str = str.replace(/[\u202F\u00A0\s]/g, '');
        return 'Rs. ' + str;
    },

    formatDate(dateString) {
        const d = new Date(dateString);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    },

    // --- Rendering Functions ---

    renderDashboardSummary() {
        const dashData = this.getFilteredDashboardExpenses();
        const { totalIncome, totalExpense, balance } = this.calculateTotals(dashData);
        const totalSavings = totalIncome - totalExpense;

        this.animateValue('dash-total-income', 0, totalIncome, 1000, this.formatMoney);
        this.animateValue('dash-total-spent', 0, totalExpense, 1000, this.formatMoney);

        this.animateValue('dash-balance', 0, Math.abs(balance), 1000, (val) => {
            const str = this.formatMoney(val);
            return (balance < 0) ? '-' + str : str;
        });

        if (this.els.dashSavings) {
            this.animateValue('dash-savings', 0, Math.abs(totalSavings), 1000, (val) => {
                const str = this.formatMoney(val);
                return (totalSavings < 0) ? '-' + str : str;
            });

            // Calculate previous month savings
            const now = new Date();
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            let prevInc = 0, prevExp = 0;
            const prevExpenses = this.expenses.filter(e => {
                const d = new Date(e.date);
                return d >= prevMonth && d <= prevMonthEnd;
            });
            prevExpenses.forEach(e => {
                if (e.type === 'income') prevInc += e.amount;
                else prevExp += e.amount;
            });
            const prevSavings = prevInc - prevExp;

            if (this.els.dashSavingsInsight) {
                if (prevSavings === 0 && prevExpenses.length === 0) {
                    this.els.dashSavingsInsight.textContent = "Pona masathuku data illappa";
                } else {
                    const diff = totalSavings - prevSavings;
                    if (diff > 0) {
                        this.els.dashSavingsInsight.textContent = `Pona masam vida ${this.formatMoney(diff)} adhigam! Semma!`;
                        this.els.dashSavingsInsight.style.color = '#86efac';
                    } else if (diff < 0) {
                        this.els.dashSavingsInsight.textContent = `Pona masam vida ${this.formatMoney(Math.abs(diff))} kammi! Kavanama irunga!`;
                        this.els.dashSavingsInsight.style.color = '#fbcfe8';
                    } else {
                        this.els.dashSavingsInsight.textContent = "Pona masam alavuke thaan.";
                        this.els.dashSavingsInsight.style.color = '#f8fafc';
                    }
                }
            }
        }
    },

    renderDashboardTable() {
        this.els.dashTableBody.innerHTML = '';
        const dashData = this.getFilteredDashboardExpenses();
        // Show max 5 recent based on filter
        const recent = [...dashData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        if (recent.length === 0) {
            this.els.dashTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">No transactions yet.</td></tr>';
            return;
        }

        recent.forEach((trans, index) => {
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${index * 0.1}s`;
            const isInc = trans.type === 'income';

            tr.innerHTML = `
                <td><strong>${trans.desc}</strong></td>
                <td><span class="type-badge ${isInc ? 'type-inc' : 'type-exp'}">${isInc ? 'Income' : 'Expense'}</span></td>
                <td><span class="cat-badge">${trans.category}</span></td>
                <td>${this.formatDate(trans.date)}</td>
                <td class="${isInc ? 'text-green' : 'text-red'}"><strong>${isInc ? '+' : '-'}${this.formatMoney(trans.amount)}</strong></td>
            `;
            this.els.dashTableBody.appendChild(tr);
        });
    },

    renderTransactionsTable() {
        this.els.expTableBody.innerHTML = '';
        const filterType = this.els.filterType.value;
        const filterCat = this.els.filterCategory.value;

        let filtered = this.getFilteredDataByDate(this.expenses, this.els.transDateFilter?.value, this.els.transStartDate, this.els.transEndDate);
        if (filterType !== 'All') filtered = filtered.filter(e => e.type === filterType);
        if (filterCat !== 'All') filtered = filtered.filter(e => e.category === filterCat);
        if (this.els.transSearch?.value) {
            const term = this.els.transSearch.value.toLowerCase();
            filtered = filtered.filter(e => e.desc.toLowerCase().includes(term));
        }

        const qty = this.els.transPagination?.value || 'all';
        if (qty !== 'all') {
            filtered = filtered.slice(0, Number(qty));
        }

        if (filtered.length === 0) {
            this.els.expTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">No transactions found.</td></tr>';
            return;
        }

        filtered.forEach((trans, index) => {
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${index * 0.05}s`;
            const isInc = trans.type === 'income';

            tr.innerHTML = `
                <td><strong>${trans.desc}</strong></td>
                <td><span class="type-badge ${isInc ? 'type-inc' : 'type-exp'}">${isInc ? 'Income' : 'Expense'}</span></td>
                <td><span class="cat-badge">${trans.category}</span></td>
                <td>${this.formatDate(trans.date)}</td>
                <td class="${isInc ? 'text-green' : 'text-red'}"><strong>${isInc ? '+' : '-'}${this.formatMoney(trans.amount)}</strong></td>
                <td>
                    <button class="btn btn-icon text-info" onclick="app.editTransaction(${trans.id})"><i class='bx bx-edit-alt'></i></button>
                    <button class="btn btn-icon text-danger" onclick="app.deleteTransaction(${trans.id})"><i class='bx bx-trash'></i></button>
                </td>
            `;
            this.els.expTableBody.appendChild(tr);
        });
    },

    populateFormCategories(type) {
        this.els.expCategory.innerHTML = '';
        const cats = type === 'income' ? this.incomeCategories : this.expenseCategories;
        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            this.els.expCategory.appendChild(opt);
        });
    },

    populateFilterCategories(type) {
        this.els.filterCategory.innerHTML = '<option value="All">All Categories</option>';
        let cats = [];
        if (type === 'income') cats = this.incomeCategories;
        else if (type === 'expense') cats = this.expenseCategories;
        else cats = [...this.incomeCategories, ...this.expenseCategories];

        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            this.els.filterCategory.appendChild(opt);
        });
    },

    renderBudgetProgress() {
        this.els.budgetContainer.innerHTML = '';

        const catTotals = {};
        this.expenseCategories.forEach(c => catTotals[c] = 0);

        // Envelope Budget Rollover Math
        const isRolloverEnabled = document.getElementById('budget-rollover-toggle')?.checked;
        let firstExpenseDates = {};

        this.expenses.filter(e => e.type === 'expense').forEach(exp => {
            // For rollover we need ALL time expenses, otherwise just current month if not enabled.
            // Wait, we can't easily filter 'current month' without doubling up loops.
            // Let's rely on getFilteredDataByDate for current month for the baseline.
        });

        // Current Month Expenses
        const currentMonthData = this.getFilteredDataByDate(this.expenses, 'current_month');
        currentMonthData.filter(e => e.type === 'expense').forEach(exp => {
            if (catTotals[exp.category] !== undefined) catTotals[exp.category] += Number(exp.amount);
        });

        this.expenseCategories.forEach((cat, index) => {
            const limit = this.budgets[cat] || 0;
            const spent = catTotals[cat];

            let rolloverLeftover = 0;

            if (isRolloverEnabled && limit > 0) {
                let allTimeCatExp = 0;
                let firstDate = new Date();

                // Find all time spending for this category
                this.expenses.forEach(e => {
                    if (e.type === 'expense' && e.category === cat) {
                        allTimeCatExp += Number(e.amount);
                        const d = new Date(e.date);
                        if (d < firstDate) firstDate = d;
                    }
                });

                // Calculate how many months have passed since the first expense in this category
                const now = new Date();
                let monthsPassed = (now.getFullYear() - firstDate.getFullYear()) * 12;
                monthsPassed -= firstDate.getMonth();
                monthsPassed += now.getMonth();
                monthsPassed = Math.max(1, monthsPassed + 1); // At least 1 (current month)

                const allTimeLimit = limit * monthsPassed;
                rolloverLeftover = Math.max(0, allTimeLimit - allTimeCatExp - limit); // Leftover up to last month
            }

            const adjustedLimit = limit + rolloverLeftover;
            const remaining = adjustedLimit - spent;
            const percentage = adjustedLimit > 0 ? (spent / adjustedLimit) * 100 : (spent > 0 ? 100 : 0);

            let progressClass = 'progress-good';
            if (percentage >= 100) progressClass = 'progress-danger';
            else if (percentage >= 80) progressClass = 'progress-warn';

            const item = document.createElement('div');
            item.className = `card budget-card animate-up stagger-${(index % 5) + 1}`;
            item.style.animationDelay = `${index * 0.1}s`;

            const today = new Date();
            const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;

            let msg = '';
            if (adjustedLimit > 0 && remaining > 0) {
                const dailySafe = Math.floor(remaining / daysLeft);
                msg += ` (Safe ₹${dailySafe}/day)`;
            } else if (adjustedLimit > 0 && remaining <= 0) {
                msg += ` (No limit left!)`;
            }

            if (rolloverLeftover > 0) {
                msg += ` | +₹${this.formatMoney(rolloverLeftover)} Rollover`;
            }

            item.innerHTML = `
                <div class="budget-info">
                    <span class="budget-cat">${cat}</span>
                    <span class="budget-amt">${this.formatMoney(spent)} / ${this.formatMoney(adjustedLimit)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: right;">
                    ${Math.round(percentage)}% Used - ${msg}
                </div>
            `;
            this.els.budgetContainer.appendChild(item);
        });
    },

    // --- Forms & Actions ---

    openTransactionModal(id = null) {
        this.currentEditId = id;
        document.getElementById('expense-modal-title').textContent = id ? 'Edit Transaction' : 'Add Transaction';

        if (id) {
            const trans = this.expenses.find(e => e.id === id);
            document.getElementById('exp-id').value = trans.id;

            const typeInput = document.querySelector(`input[name="trans-type"][value="${trans.type}"]`);
            if (typeInput) typeInput.checked = true;
            this.populateFormCategories(trans.type);

            this.els.expAmount.value = trans.amount;
            this.els.expDesc.value = trans.desc;
            this.els.expCategory.value = trans.category;
            this.els.expDate.value = trans.date;
        } else {
            this.els.expForm.reset();
            document.querySelector(`input[name="trans-type"][value="expense"]`).checked = true;
            this.populateFormCategories('expense');
            this.els.expCategory.value = '';
            this.els.expDate.value = new Date().toISOString().split('T')[0];
            if (this.els.expRecurring) this.els.expRecurring.value = 'none';
            document.getElementById('exp-id').value = '';
        }

        this.els.modalExp.classList.add('show');
    },

    autoSuggestCategory(descText) {
        if (!descText || descText.trim() === '') return;
        const search = descText.toLowerCase().trim();

        // Find most recent transaction with this exact description
        // Reverse array or search backwards (assuming timeline sorted)
        const match = [...this.expenses].reverse().find(e => e.desc.toLowerCase().trim() === search);

        if (match && this.els.expCategory) {
            // Only update if the type matches the current form type
            const currentType = document.querySelector('input[name="trans-type"]:checked').value;
            if (match.type === currentType) {
                this.els.expCategory.value = match.category;
            }
        }
    },

    openBudgetModal() {
        this.els.budgetInputsContainer.innerHTML = '';
        this.expenseCategories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'form-group animate-up';
            div.innerHTML = `
                <label>${cat} Limit (₹)</label>
                <input type="number" class="input-field budget-input" data-cat="${cat}" value="${this.budgets[cat] || 0}" min="0">
            `;
            this.els.budgetInputsContainer.appendChild(div);
        });

        this.els.modalBudget.classList.add('show');
    },

    async handleTransactionSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('exp-id').value;
        const type = document.querySelector('input[name="trans-type"]:checked').value;
        const amount = this.els.expAmount.value;
        const desc = this.els.expDesc.value.trim() || 'N/A';
        const category = this.els.expCategory.value;
        const date = this.els.expDate.value;

        if (!amount || !category || !date) {
            alert('Please fill Amount, Category, and Date');
            return;
        }

        const trans = {
            type,
            amount: Number(amount),
            desc,
            category,
            date,
            recurring: this.els.expRecurring ? this.els.expRecurring.value : 'none',
            lastRecurringDate: date
        };

        const tx = this.db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');

        if (id) {
            trans.id = Number(id);
            await new Promise(resolve => {
                const req = store.put(trans);
                req.onsuccess = resolve;
            });
        } else {
            await new Promise(resolve => {
                const req = store.add(trans);
                req.onsuccess = resolve;
            });
        }

        this.els.modalExp.classList.remove('show');
        await this.loadData();
        this.updateUI();
    },

    async handleBudgetSubmit(e) {
        e.preventDefault();
        const inputs = document.querySelectorAll('.budget-input');

        const tx = this.db.transaction('budgets', 'readwrite');
        const store = tx.objectStore('budgets');
        const promises = [];

        inputs.forEach(input => {
            const cat = input.dataset.cat;
            const amount = Number(input.value);
            this.budgets[cat] = amount;

            const req = store.put({ category: cat, amount });
            promises.push(new Promise(res => req.onsuccess = res));
        });

        await Promise.all(promises);
        this.els.modalBudget.classList.remove('show');
        this.updateUI();
    },

    async deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        const tx = this.db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        await new Promise(resolve => {
            const req = store.delete(id);
            req.onsuccess = resolve;
        });

        await this.loadData();
        this.updateUI();
    },

    async clearAllTransactions() {
        if (!confirm('WARNING: Are you sure you want to completely delete ALL transactions? This action cannot be undone!')) return;

        const tx = this.db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        await new Promise(resolve => {
            const req = store.clear();
            req.onsuccess = resolve;
        });

        this.expenses = [];
        await this.loadData();
        this.updateUI();
    },

    async checkRecurringTransactions() {
        if (!this.expenses || this.expenses.length === 0) return;

        let modifications = false;
        const tx = this.db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const e of this.expenses) {
            if (!e.recurring || e.recurring === 'none') continue;

            let lastDate = new Date(e.lastRecurringDate || e.date);
            lastDate.setHours(0, 0, 0, 0);

            // Generate all missing intervals up to today
            while (true) {
                let nextDate = new Date(lastDate);
                if (e.recurring === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                else if (e.recurring === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                else if (e.recurring === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

                if (nextDate > today) break;

                // Create duplicate
                const clone = { ...e };
                delete clone.id; // Let IndexedDB assign a new ID
                clone.date = nextDate.toISOString().split('T')[0];
                clone.lastRecurringDate = clone.date;

                store.add(clone);

                // Update original anchor item
                e.lastRecurringDate = clone.date;
                store.put(e);

                lastDate = new Date(nextDate);
                modifications = true;
            }
        }

        if (modifications) {
            await new Promise((res, rej) => {
                tx.oncomplete = res;
                tx.onerror = rej;
            });
            await this.loadData();
            this.updateUI();
        }
    },

    editTransaction(id) {
        this.openTransactionModal(id);
    },

    async downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const { totalIncome, totalExpense, balance } = this.calculateTotals();

        try {
            const res = await fetch('logo.png');
            const blob = await res.blob();
            const base64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            doc.addImage(base64, 'PNG', 14, 14, 15, 15);

            // KAASU Logo Text
            doc.setTextColor(30, 30, 36);
            doc.setFontSize(26);
            doc.setFont("helvetica", "bold");
            doc.text("KAASU", 33, 24);

            // by AK
            doc.setTextColor(147, 51, 234); // Accent purple
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("by AK", 33, 30);
        } catch (e) {
            // Fallback if logo fetch fails
            doc.setTextColor(30, 30, 36);
            doc.setFontSize(26);
            doc.setFont("helvetica", "bold");
            doc.text("KAASU", 14, 25);

            doc.setTextColor(147, 51, 234);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("by AK", 14, 32);
        }

        // Report Info
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(11);
        doc.text("Expense Report", 14, 45);
        doc.setFontSize(9);
        doc.text(`Generated on: ${this.formatDate(new Date())}`, 14, 51);

        doc.text(`Period: All Time`, 14, 60);

        // Summary Box
        doc.setFillColor(245, 246, 250);
        doc.roundedRect(100, 15, 95, 45, 2, 2, 'F'); // Shifted left and made wider!

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Total Income:", 105, 28);
        doc.setTextColor(16, 185, 129); // Green
        doc.text(this.formatPDFMoney(totalIncome), 190, 28, { align: 'right' });

        doc.setTextColor(100, 100, 100);
        doc.text("Total Expense:", 105, 38);
        doc.setTextColor(239, 68, 68); // Red
        doc.text(this.formatPDFMoney(totalExpense), 190, 38, { align: 'right' });

        doc.setTextColor(100, 100, 100);
        doc.text("Balance:", 105, 48);
        doc.setTextColor(30, 30, 36);
        doc.setFont("helvetica", "bold");
        doc.text(this.formatPDFMoney(balance), 190, 48, { align: 'right' });

        const tableColumn = ["Date", "Description", "Category", "Type", "Amount"];
        const tableRows = [];

        // Apply visual filters logic
        const filterType = this.els.filterType.value;
        const filterCat = this.els.filterCategory.value;
        let filtered = this.expenses;
        if (filterType !== 'All') filtered = filtered.filter(e => e.type === filterType);
        if (filterCat !== 'All') filtered = filtered.filter(e => e.category === filterCat);

        filtered.forEach(trans => {
            const transData = [
                this.formatDate(trans.date),
                trans.desc,
                trans.category,
                trans.type === 'income' ? 'INCOME' : 'EXPENSE',
                (trans.type === 'income' ? '+' : '-') + this.formatPDFMoney(trans.amount)
            ];
            tableRows.push(transData);
        });

        // Analytics Banner
        doc.setFillColor(245, 246, 250);
        doc.roundedRect(14, 65, 181, 20, 2, 2, 'F'); // Analytics banner

        const expOnly = filtered.filter(e => e.type === 'expense');
        let biggest = null;
        if (expOnly.length > 0) {
            biggest = expOnly.reduce((max, current) => (max.amount > current.amount) ? max : current);
        }

        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.text("Analytics Insight:", 18, 73);

        doc.setTextColor(30, 30, 36);
        doc.setFont("helvetica", "bold");
        if (biggest) {
            doc.text(`Highest single expense: ${biggest.desc} (${this.formatPDFMoney(biggest.amount)}) in ${biggest.category}`, 18, 80);
        } else {
            doc.text("No expenses recorded for this period.", 18, 80);
        }

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 95,
            theme: 'striped',
            headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [250, 250, 252] },
            didParseCell: function (data) {
                if (data.column.index === 4 && data.cell.section === 'body') {
                    if (data.row.raw[3] === 'INCOME') {
                        data.cell.styles.textColor = [16, 185, 129];
                    } else if (data.row.raw[3] === 'EXPENSE') {
                        data.cell.styles.textColor = [239, 68, 68];
                    }
                }
            }
        });

        doc.save('Kaasu-Transactions.pdf');
    },

    exportCSV() {
        const headers = ["ID", "Type", "Amount", "Description", "Category", "Date"];
        const rows = this.expenses.map(e => [
            e.id,
            e.type,
            e.amount,
            `"${e.desc.replace(/"/g, '""')}"`,
            `"${e.category}"`,
            e.date
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", "kaasu_backup_" + Date.now() + ".csv");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
    },

    async importData(e) {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON array of arrays
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rows.length < 2) throw new Error("Empty or invalid file");

                const tx = this.db.transaction(['expenses'], 'readwrite');
                const storeE = tx.objectStore('expenses');
                await new Promise(res => { storeE.clear().onsuccess = res; });

                // Start from 1 to skip headers
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue; // Skip empty rows

                    // Expected Headers format: ["ID", "Type", "Amount", "Description", "Category", "Date"]
                    // Mapping row indices based on export format
                    const id = Number(row[0]) || Date.now() + i;
                    const type = String(row[1]).toLowerCase().trim();
                    const amount = Number(row[2]);
                    const desc = String(row[3] || 'N/A').trim();
                    const category = String(row[4] || 'Other').trim();
                    const date = row[5] ? String(row[5]).trim() : new Date().toISOString().split('T')[0];

                    if (!isNaN(amount) && (type === 'income' || type === 'expense')) {
                        storeE.add({
                            id: id,
                            type: type,
                            amount: amount,
                            desc: desc,
                            category: category,
                            date: date
                        });
                    }
                }

                alert("Data Successfully Imported!");
                this.els.fileImport.value = '';
                await this.loadData();
                this.updateUI();

            } catch (err) {
                console.error(err);
                alert("Failed to import. Ensure file is a valid Kaasu Backup CSV or XLSX.");
                this.els.fileImport.value = '';
            }
        };

        reader.readAsArrayBuffer(file);
    },

    // --- Charts (ECharts) ---

    initCharts() {
        this.charts.dashCat = echarts.init(document.getElementById('dashCategoryChart'), 'dark');
        this.charts.trend = echarts.init(document.getElementById('trendChart'), 'dark');

        // Handle Click filtering via chart
        this.charts.dashCat.on('click', (params) => {
            this.navigate('transactions');
            this.els.filterType.value = 'expense';
            this.populateFilterCategories('expense');
            this.els.filterCategory.value = params.name;
            this.renderTransactionsTable();
        });

        // Removed cashflow click handler

        // Handle Resizing
        window.addEventListener('resize', () => {
            if (this.charts.dashCat) this.charts.dashCat.resize();
            if (this.charts.trend) this.charts.trend.resize();
        });
    },

    updateCharts() {
        if (!this.charts.dashCat) return;

        // Fetch dynamic theme colors
        const rootStyles = getComputedStyle(document.documentElement);
        const themeMain = rootStyles.getPropertyValue('--accent-main').trim() || '#9333ea';

        // Distinct Professional Colors for Expense Pie
        const professionalColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];

        // Filter operations Dashboard
        const dashData = this.getFilteredDashboardExpenses();

        // --- Dashboard Category Chart (Horizontal Percent Bar) ---
        const catTotals = {};
        let totalDashExp = 0;
        dashData.filter(e => e.type === 'expense').forEach(e => {
            const val = Number(e.amount) || 0;
            catTotals[e.category] = (catTotals[e.category] || 0) + val;
            totalDashExp += val;
        });

        // Ensure we don't divide by zero for rendering percentages 
        const dashTotalDivisor = totalDashExp > 0 ? totalDashExp : 1;

        const dashBarData = Object.keys(catTotals).map((key, index) => ({
            name: key,
            value: ((catTotals[key] / dashTotalDivisor) * 100),
            rawValue: catTotals[key],
            itemStyle: { color: professionalColors[index % professionalColors.length], borderRadius: [0, 6, 6, 0] }
        })).sort((a, b) => b.value - a.value);

        const textColor = rootStyles.getPropertyValue('--text-primary').trim() || '#fafafa';
        const isLight = document.documentElement.getAttribute('data-theme-mode') === 'light';
        const tooltipBg = isLight ? '#ffffff' : '#1f1f22';
        const tooltipBorder = isLight ? '#e4e4e7' : '#3f3f46';

        this.charts.dashCat.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis', confine: true, axisPointer: { type: 'shadow' },
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                textStyle: { color: textColor },
                formatter: (params) => {
                    const d = params[0].data;
                    return `${d.name}: ₹${d.rawValue} (${d.value.toFixed(1)}%)`;
                }
            },
            grid: { left: '2%', right: 80, bottom: '5%', top: '5%', containLabel: true },
            xAxis: { type: 'value', max: 100, splitLine: { show: false }, axisLabel: { show: false } },
            yAxis: { type: 'category', data: dashBarData.map(d => d.name).reverse(), axisLabel: { color: textColor }, axisLine: { show: false }, axisTick: { show: false } },
            series: [{
                name: 'Spent %',
                type: 'bar',
                data: dashBarData.reverse(),
                label: { show: true, position: 'right', color: textColor, formatter: (p) => `${p.data.value.toFixed(1)}%` },
                showBackground: true,
                backgroundStyle: { color: 'rgba(255, 255, 255, 0.05)', borderRadius: [0, 6, 6, 0] }
            }]
        }, true);

        // Filter operations Reports
        const reportData = this.getFilteredDataByDate(this.expenses, this.els.reportDateFilter?.value, this.els.reportStartDate, this.els.reportEndDate);

        // --- Sankey Cashflow Chart ---
        const incTotals = {};
        const expTotals = {};
        let tInc = 0;
        let tExp = 0;

        reportData.forEach(t => {
            const amt = Number(t.amount);
            if (t.type === 'income') {
                incTotals[t.category] = (incTotals[t.category] || 0) + amt;
                tInc += amt;
            } else {
                expTotals[t.category] = (expTotals[t.category] || 0) + amt;
                tExp += amt;
            }
        });

        // Fill Report KPIs
        if (this.els.repSavingsRate) {
            const saveRate = tInc > 0 ? Math.max((tInc - tExp) / tInc * 100, 0) : 0;
            this.animateValue('rep-savings-rate', 0, saveRate, 1000, val => Math.round(val) + '%');

            let topCat = '-';
            let maxAmt = 0;
            for (let cat in expTotals) {
                if (expTotals[cat] > maxAmt) { maxAmt = expTotals[cat]; topCat = cat; }
            }
            this.els.repTopExpense.textContent = topCat !== '-' ? topCat : 'N/A';

            let daysCount = 30;
            if (this.els.reportDateFilter) {
                const fVal = this.els.reportDateFilter.value;
                if (fVal === 'custom' && this.els.reportStartDate.value && this.els.reportEndDate.value) {
                    const d1 = new Date(this.els.reportStartDate.value);
                    const d2 = new Date(this.els.reportEndDate.value);
                    daysCount = Math.max(1, Math.ceil((d2 - d1) / (1000 * 3600 * 24)));
                } else if (fVal === 'all') {
                    daysCount = 365;
                } else {
                    daysCount = parseInt(fVal) || 30;
                }
            }
            const avgDaily = tExp / daysCount;
            this.animateValue('rep-daily-spend', 0, avgDaily, 1000, this.formatMoney);
        }

        // --- Treemap Cashflow Chart Removed ---

        // --- Trend Chart (Dynamic Custom Length) ---
        let trendLabels = [];
        let dailyInc = {};
        let dailyExp = {};

        let tStart = new Date();
        let tEnd = new Date();
        tStart.setDate(tEnd.getDate() - 29);

        if (this.els.reportDateFilter) {
            const rVal = this.els.reportDateFilter.value;
            if (rVal === 'custom' && this.els.reportStartDate.value && this.els.reportEndDate.value) {
                tStart = new Date(this.els.reportStartDate.value);
                tEnd = new Date(this.els.reportEndDate.value);
            } else if (rVal === 'current_month') {
                const now = new Date();
                tStart = new Date(now.getFullYear(), now.getMonth(), 1);
                tEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (rVal === 'all') {
                if (reportData.length) {
                    tStart = new Date(reportData[reportData.length - 1].date);
                } else {
                    tStart.setDate(tEnd.getDate() - 365);
                }
            } else {
                let dForTrend = parseInt(rVal) || 30;
                tStart = new Date();
                tStart.setDate(tEnd.getDate() - dForTrend + 1); // +1 because today is inclusive
            }
        }

        let diffDays = Math.ceil((tEnd - tStart) / (1000 * 3600 * 24)) + 1;
        if (diffDays > 90 && this.els.reportDateFilter?.value !== 'custom' && this.els.reportDateFilter?.value !== 'current_month') {
            diffDays = 90;
            tStart = new Date();
            tStart.setDate(tEnd.getDate() - 89);
        }
        if (diffDays <= 0) diffDays = 1;

        for (let i = 0; i < diffDays; i++) {
            const d = new Date(tStart);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            trendLabels.push(dateStr);
            dailyInc[dateStr] = 0;
            dailyExp[dateStr] = 0;
        }

        reportData.forEach(t => {
            const dateStr = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            if (dailyInc[dateStr] !== undefined) {
                if (t.type === 'income') dailyInc[dateStr] += Number(t.amount);
                else dailyExp[dateStr] += Number(t.amount);
            }
        });

        this.charts.trend.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                confine: true,
                axisPointer: { type: 'line' },
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                textStyle: { color: textColor }
            },
            legend: { textStyle: { color: textColor }, bottom: '2%' },
            grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
            xAxis: { type: 'category', data: trendLabels, axisLabel: { color: textColor } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: document.documentElement.getAttribute('data-theme-mode') === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' } }, axisLabel: { color: textColor } },
            dataZoom: [{ type: 'inside', start: 0, end: 100 }],
            series: [
                { name: 'Income', type: 'line', smooth: true, areaStyle: { opacity: 0.2 }, itemStyle: { color: '#10b981' }, data: Object.values(dailyInc) },
                { name: 'Expense', type: 'line', smooth: true, areaStyle: { opacity: 0.2 }, itemStyle: { color: '#ef4444' }, data: Object.values(dailyExp) }
            ]
        }, true);
    },

    sendFeedback() {
        const to = 'ajaykoffcl@gmail.com';
        const subject = encodeURIComponent('Kaasu App Feedback & Upgrades');
        const bodyText = `Hi Ajay,\n\nHere is my feedback and upgrade suggestions for Kaasu:\n\n1. \n\n`;
        const body = encodeURIComponent(bodyText);

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

        // Use _top to break out of any GitHub Pages iframes that maliciously block _blank popups
        window.open(gmailUrl, '_top');

        // Show thank you note when they return to the Kaasu tab
        const handleFocus = () => {
            alert('Romba nandri Kaasu use pandrathuku! (Thank you very much!)');
            window.removeEventListener('focus', handleFocus);
        };
        setTimeout(() => {
            window.addEventListener('focus', handleFocus);
        }, 1000); // Small delay so it doesn't trigger instantly before they leave
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

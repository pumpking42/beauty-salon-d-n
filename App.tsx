import React, { useState, useEffect } from 'react';
import { POSView } from './components/POSView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PayrollView } from './components/PayrollView';
import { Header } from './components/Header';
import type { Service, Stylist, Transaction, Report, PayrollRecord, Expense } from './types';
import { View } from './types';
import { INITIAL_SERVICES, INITIAL_STYLISTS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.POS);

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('salonServices');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [stylists, setStylists] = useState<Stylist[]>(() => {
    const saved = localStorage.getItem('salonStylists');
    return saved ? JSON.parse(saved) : INITIAL_STYLISTS;
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('salonReports');
    const parsed = saved ? JSON.parse(saved) : [];
    // Data migration for older reports without expenses array
    return parsed.map((r: Report) => ({ ...r, expenses: r.expenses || [] }));
  });

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('salonPayrollRecords');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('salonServices', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('salonStylists', JSON.stringify(stylists));
  }, [stylists]);
  
  useEffect(() => {
    localStorage.setItem('salonReports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('salonPayrollRecords', JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  const addTransaction = (transaction: Transaction) => {
    const today = new Date().toISOString().split('T')[0];
    const reportIndex = reports.findIndex(r => r.date === today);

    if (reportIndex > -1) {
      const updatedReports = [...reports];
      updatedReports[reportIndex].transactions.push(transaction);
      setReports(updatedReports);
    } else {
      const newReport: Report = {
        date: today,
        transactions: [transaction],
        expenses: []
      };
      setReports(prevReports => [...prevReports, newReport].sort((a, b) => b.date.localeCompare(a.date)));
    }
  };

  const addExpense = (expenseData: { description: string; amount: number }) => {
    const today = new Date().toISOString().split('T')[0];
    const reportIndex = reports.findIndex(r => r.date === today);
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    if (reportIndex > -1) {
      const updatedReports = [...reports];
      updatedReports[reportIndex].expenses.push(newExpense);
      setReports(updatedReports);
    } else {
      const newReport: Report = {
        date: today,
        transactions: [],
        expenses: [newExpense],
      };
      setReports(prevReports => [...prevReports, newReport].sort((a, b) => b.date.localeCompare(a.date)));
    }
  };

  const deleteExpense = (expenseId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const reportIndex = reports.findIndex(r => r.date === today);

    if (reportIndex > -1) {
      const updatedReports = [...reports];
      const report = updatedReports[reportIndex];
      report.expenses = report.expenses.filter(e => e.id !== expenseId);
      setReports(updatedReports);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.POS:
        return (
          <POSView 
            services={services} 
            stylists={stylists} 
            addTransaction={addTransaction}
            reports={reports}
            addExpense={addExpense}
            deleteExpense={deleteExpense}
          />
        );
      case View.Reports:
        return <ReportsView reports={reports} stylists={stylists} />;
      case View.Settings:
        return (
          <SettingsView
            services={services}
            setServices={setServices}
            stylists={stylists}
            setStylists={setStylists}
          />
        );
      case View.Payroll:
        return (
          <PayrollView
            reports={reports}
            stylists={stylists}
            payrollRecords={payrollRecords}
            setPayrollRecords={setPayrollRecords}
          />
        );
      default:
        return <POSView services={services} stylists={stylists} addTransaction={addTransaction} reports={reports} addExpense={addExpense} deleteExpense={deleteExpense} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
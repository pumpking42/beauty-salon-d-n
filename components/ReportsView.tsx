import React, { useState, useMemo, useEffect } from 'react';
import type { Report, Transaction, Stylist, Expense } from '../types';
import { PaymentMethod, ReportViewMode } from '../types';
import { CashIcon } from './icons/CashIcon';
import { QrIcon } from './icons/QrIcon';
import { UserIcon } from './icons/UserIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';


declare global {
  interface Window {
    jspdf: any;
  }
}

interface ReportsViewProps {
  reports: Report[];
  stylists: Stylist[];
}

const formatPeriod = (period: string, viewMode: ReportViewMode): string => {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };
  if (viewMode === ReportViewMode.Day) {
    options.year = 'numeric';
    options.month = 'long';
    options.day = 'numeric';
    return new Date(period).toLocaleDateString('es-ES', options);
  }
  if (viewMode === ReportViewMode.Month) {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    options.year = 'numeric';
    options.month = 'long';
    return date.toLocaleDateString('es-ES', options);
  }
  return period;
};

const generatePdf = (title: string, summary: any, transactions: Transaction[], expenses: Expense[], stylistName: string, period: string, viewMode: ReportViewMode) => {
    const { jsPDF: JSPDF } = window.jspdf;
    const doc = new JSPDF();
    const generatedDate = new Date().toLocaleDateString('es-ES');
    let startY = 78;

    doc.setFontSize(20);
    doc.setTextColor('#1e293b');
    doc.text(title, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor('#64748b');
    doc.text(`Filtro Estilista: ${stylistName}`, 14, 30);
    doc.text(`Generado: ${generatedDate}`, 150, 30);
    
    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 38, 182, 32, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor('#1e293b');
    doc.setFont(undefined, 'bold');
    doc.text(`Ingresos: Bs ${summary.totalSales.toFixed(2)}`, 20, 48);
    doc.text(`Egresos: Bs ${summary.totalExpenses.toFixed(2)}`, 80, 48);
    doc.text(`Neto: Bs ${summary.netTotal.toFixed(2)}`, 140, 48);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor('#334155');
    doc.text(`Efectivo: Bs ${summary.cashTotal.toFixed(2)}`, 20, 58);
    doc.text(`QR: Bs ${summary.qrTotal.toFixed(2)}`, 80, 58);
    doc.text(`Transacciones: ${transactions.length}`, 140, 58);

    // Transactions Table
    doc.setFontSize(14);
    doc.setTextColor('#1e293b');
    doc.text("Ingresos / Transacciones", 14, startY - 5);
    const txTableColumns = stylistName === 'Todos'
        ? ["Hora", "Servicios / Estilistas", "Pago", "Total"]
        : ["Hora", "Servicios", "Pago", "Total"];
    const txTableRows = transactions.map(tx => [
        new Date(tx.timestamp).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: viewMode === ReportViewMode.Day ? undefined : '2-digit', month: viewMode === ReportViewMode.Day ? undefined : '2-digit' }),
        tx.items.map(item => stylistName === 'Todos' ? `${item.service.name} (${item.stylist.name})` : item.service.name).join('\n'),
        tx.paymentMethod,
        `Bs ${tx.total.toFixed(2)}`
    ]);
    (doc as any).autoTable({
        head: [txTableColumns], body: txTableRows, startY, theme: 'grid',
        headStyles: { fillColor: '#0d9488', textColor: '#ffffff' },
        styles: { halign: 'center', cellPadding: 2, fontSize: 9, valign: 'middle' },
        columnStyles: { 1: { halign: 'left' } }
    });
    startY = (doc as any).lastAutoTable.finalY + 15;

    // Expenses Table
    if (expenses.length > 0 && stylistName === 'Todos') { // Only show expenses on 'all stylists' report
        doc.setFontSize(14);
        doc.setTextColor('#1e293b');
        doc.text("Egresos", 14, startY - 5);
        const expTableColumns = ["Fecha", "Descripción", "Monto"];
        const expTableRows = expenses.map(exp => [
            new Date(exp.timestamp).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            exp.description,
            `Bs ${exp.amount.toFixed(2)}`
        ]);
        (doc as any).autoTable({
            head: [expTableColumns], body: expTableRows, startY, theme: 'grid',
            headStyles: { fillColor: '#d97706', textColor: '#ffffff' },
            styles: { halign: 'center', cellPadding: 2, fontSize: 9, valign: 'middle' },
            columnStyles: { 1: { halign: 'left' } }
        });
    }

    doc.save(`Reporte-${viewMode}-${stylistName.replace(' ','_')}-${period}.pdf`);
};

export const ReportsView: React.FC<ReportsViewProps> = ({ reports, stylists }) => {
  const [viewMode, setViewMode] = useState<ReportViewMode>(ReportViewMode.Day);
  const [selectedStylistId, setSelectedStylistId] = useState<number | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const selectedStylistName = useMemo(() => {
    if (selectedStylistId === 'all') return 'Todos';
    return stylists.find(s => s.id === selectedStylistId)?.name || 'Desconocido';
  }, [selectedStylistId, stylists]);

  const selectorData = useMemo(() => {
    const allTransactions = reports.flatMap(r => r.transactions);
    const relevantTxs = selectedStylistId === 'all'
      ? allTransactions
      : allTransactions.filter(tx => tx.items.some(item => item.stylist.id === selectedStylistId));

    const groupedData = relevantTxs.reduce((acc, tx) => {
      const periodKey = viewMode === ReportViewMode.Day ? tx.timestamp.split('T')[0] : (viewMode === ReportViewMode.Month ? tx.timestamp.substring(0, 7) : tx.timestamp.substring(0, 4));
      const value = selectedStylistId === 'all'
        ? tx.total
        : tx.items.filter(i => i.stylist.id === selectedStylistId).reduce((sum, i) => sum + i.price, 0);
      acc[periodKey] = (acc[periodKey] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedData).map(([period, total]) => ({ period, total })).sort((a,b) => b.period.localeCompare(a.period));
  }, [reports, selectedStylistId, viewMode]);

  useEffect(() => {
    setSelectedPeriod(selectorData.length > 0 ? selectorData[0].period : null);
  }, [selectorData]);

  const reportDetails = useMemo(() => {
    if (!selectedPeriod) return null;
    let periodTransactions = reports.flatMap(r => r.transactions).filter(tx => tx.timestamp.startsWith(selectedPeriod));
    
    let periodExpenses = selectedStylistId === 'all' ? reports.flatMap(r => r.expenses || []).filter(exp => exp.timestamp.startsWith(selectedPeriod)) : [];

    if (selectedStylistId !== 'all') {
      periodTransactions = periodTransactions.map(tx => {
        const items = tx.items.filter(item => item.stylist.id === selectedStylistId);
        if (items.length === 0) return null;
        return { ...tx, items, total: items.reduce((sum, i) => sum + i.price, 0) };
      }).filter((tx): tx is Transaction => tx !== null);
    }
    
    const totalSales = periodTransactions.reduce((sum, t) => sum + t.total, 0);
    const cashTotal = periodTransactions.filter(t => t.paymentMethod === PaymentMethod.Cash).reduce((sum, t) => sum + t.total, 0);
    const qrTotal = periodTransactions.filter(t => t.paymentMethod === PaymentMethod.QR).reduce((sum, t) => sum + t.total, 0);
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netTotal = totalSales - totalExpenses;

    return { 
        transactions: periodTransactions.sort((a, b) => b.timestamp.localeCompare(a.timestamp)), 
        expenses: periodExpenses.sort((a,b) => b.timestamp.localeCompare(a.timestamp)),
        summary: { totalSales, cashTotal, qrTotal, totalExpenses, netTotal } 
    };
  }, [reports, selectedPeriod, selectedStylistId]);

  const handleDownloadPdf = () => {
    if (!reportDetails || !selectedPeriod) return;
    const title = `Reporte de ${viewMode}`;
    generatePdf(title, reportDetails.summary, reportDetails.transactions, reportDetails.expenses, selectedStylistName, selectedPeriod, viewMode);
  };
  
  const renderViewModeButton = (mode: ReportViewMode) => (
    <button 
      onClick={() => setViewMode(mode)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${viewMode === mode ? 'bg-teal-500 text-white shadow' : 'bg-white text-slate-600 hover:bg-teal-100'}`}
    >
      {mode}
    </button>
  );

  return (
    <div>
        <div className="bg-white p-4 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-3 text-slate-700">Filtros de Reporte</h2>
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 gap-4">
                <div>
                    <label htmlFor="stylist-filter" className="block text-sm font-medium text-slate-600 mb-1">Estilista</label>
                    <select
                        id="stylist-filter"
                        value={selectedStylistId}
                        onChange={(e) => setSelectedStylistId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="w-full sm:w-48 pl-3 pr-8 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="all">Todos los estilistas</option>
                        {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Agrupar por</label>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        {renderViewModeButton(ReportViewMode.Day)}
                        {renderViewModeButton(ReportViewMode.Month)}
                        {renderViewModeButton(ReportViewMode.Year)}
                    </div>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit">
                <h2 className="text-2xl font-bold mb-4 text-slate-700">Periodos</h2>
                {selectorData.length === 0 ? (
                    <p className="text-slate-500">No hay reportes para la selección actual.</p>
                ) : (
                    <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                        {selectorData.map(({ period, total }) => (
                            <li key={period}>
                                <button
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${selectedPeriod === period ? 'bg-teal-500 text-white shadow' : 'bg-slate-100 hover:bg-teal-100'}`}
                                >
                                    <span className="font-semibold">{formatPeriod(period, viewMode)}</span>
                                    <span className="block text-sm opacity-90">Ingresos: Bs {total.toFixed(2)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="md:col-span-2">
                {reportDetails ? (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-800">{formatPeriod(selectedPeriod!, viewMode)}</h3>
                                <p className="text-slate-500">Mostrando datos para <span className="font-semibold text-teal-700">{selectedStylistName}</span></p>
                            </div>
                            <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-colors">
                                <DownloadIcon className="h-5 w-5" />
                                <span>Descargar PDF</span>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                            <div className="text-center col-span-1 md:col-auto"><p className="text-sm text-slate-500">Total Ingresos</p><p className="text-2xl font-bold text-teal-600">Bs {reportDetails.summary.totalSales.toFixed(2)}</p></div>
                            <div className="text-center col-span-1 md:col-auto"><p className="text-sm text-slate-500">Total Egresos</p><p className="text-2xl font-bold text-red-600">Bs {reportDetails.summary.totalExpenses.toFixed(2)}</p></div>
                            <div className="text-center col-span-2 md:col-auto"><p className="text-sm text-slate-500">Total Neto</p><p className="text-2xl font-bold text-blue-600">Bs {reportDetails.summary.netTotal.toFixed(2)}</p></div>
                            <div className="text-center border-t pt-4 mt-4 col-span-2 md:col-span-3 grid grid-cols-2 gap-4">
                                <div><p className="text-sm text-slate-500">Efectivo</p><p className="text-xl font-semibold text-green-600">Bs {reportDetails.summary.cashTotal.toFixed(2)}</p></div>
                                <div><p className="text-sm text-slate-500">QR</p><p className="text-xl font-semibold text-sky-600">Bs {reportDetails.summary.qrTotal.toFixed(2)}</p></div>
                            </div>
                        </div>

                        <h4 className="font-bold text-xl text-slate-700 mb-3 mt-6">Detalle de Ingresos</h4>
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {reportDetails.transactions.length > 0 ? reportDetails.transactions.map((tx) => (
                                <div key={tx.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <div className="flex justify-between items-start mb-3"><span className="font-bold text-lg text-slate-800">Bs {tx.total.toFixed(2)}</span><div className="flex items-center gap-1.5"><span className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>{tx.paymentMethod === 'Efectivo' ? <span className="flex items-center gap-1.5 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"><CashIcon className="h-4 w-4" />{tx.paymentMethod}</span> : <span className="flex items-center gap-1.5 bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs font-medium"><QrIcon className="h-4 w-4" />{tx.paymentMethod}</span>}</div></div>
                                    <ul className="space-y-2 text-sm">{tx.items.map((item, index) => (<li key={index} className="flex justify-between items-center text-slate-700 bg-white p-2 rounded-md"><div className="flex-1"><span className="flex items-center gap-2 font-medium"><ScissorsIcon className="h-3.5 w-3.5 text-teal-500" />{item.service.name}</span>{selectedStylistId === 'all' && <span className="flex items-center gap-2 text-xs text-slate-500 pl-6"><UserIcon className="h-3 w-3" />{item.stylist.name}</span>}</div><span className="font-semibold">Bs {item.price.toFixed(2)}</span></li>))}</ul>
                                </div>
                            )) : <p className="text-slate-500 text-center py-4">No hay ingresos para este periodo.</p>}
                        </div>

                        {selectedStylistId === 'all' && reportDetails.expenses.length > 0 && (
                            <>
                                <h4 className="font-bold text-xl text-slate-700 mb-3 mt-6">Detalle de Egresos</h4>
                                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                    {reportDetails.expenses.map((exp) => (
                                        <div key={exp.id} className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                                            <div className="flex items-center gap-3">
                                                <ReceiptIcon className="h-5 w-5 text-amber-600" />
                                                <div>
                                                   <p className="text-slate-800 font-medium">{exp.description}</p>
                                                   <p className="text-xs text-slate-500">{new Date(exp.timestamp).toLocaleString('es-ES')}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-red-600">Bs {exp.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                    </div>
                ) : (<div className="bg-white p-10 rounded-xl shadow-lg text-center"><h3 className="text-xl font-semibold text-slate-600">Seleccione un periodo</h3><p className="text-slate-500 mt-2">Elija un periodo de la lista para ver los detalles de las transacciones.</p></div>)}
            </div>
        </div>
    </div>
  );
};
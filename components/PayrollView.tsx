import React, { useState, useMemo } from 'react';
import type { Report, Stylist, PayrollRecord } from '../types';
import { UserIcon } from './icons/UserIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';

interface PayrollViewProps {
  reports: Report[];
  stylists: Stylist[];
  payrollRecords: PayrollRecord[];
  setPayrollRecords: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
}

interface PayrollReport {
  totalGross: number;
  totalCommission: number;
  salonProfit: number;
  breakdown: {
    '0.3': { total: number; commission: number };
    '0.4': { total: number; commission: number };
  };
  transactions: {
    serviceName: string;
    price: number;
    commission: number;
    timestamp: string;
  }[];
}

export const PayrollView: React.FC<PayrollViewProps> = ({ reports, stylists, payrollRecords, setPayrollRecords }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedStylistId, setSelectedStylistId] = useState<number | null>(stylists[0]?.id || null);
  const [generatedReport, setGeneratedReport] = useState<PayrollReport | null>(null);

  const handleGenerateReport = () => {
    if (!selectedStylistId) {
        alert('Por favor, seleccione un estilista.');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include all of the end date

    const relevantTransactions = reports
        .flatMap(r => r.transactions)
        .filter(tx => {
            const txDate = new Date(tx.timestamp);
            return txDate >= start && txDate <= end;
        });

    const stylistTransactions: PayrollReport['transactions'] = [];
    const breakdown: PayrollReport['breakdown'] = {
      '0.3': { total: 0, commission: 0 },
      '0.4': { total: 0, commission: 0 },
    };
    
    relevantTransactions.forEach(tx => {
        tx.items.forEach(item => {
            if (item.stylist.id === selectedStylistId) {
                const commission = item.price * item.service.commissionRate;
                const rateKey = item.service.commissionRate.toString() as '0.3' | '0.4';
                
                breakdown[rateKey].total += item.price;
                breakdown[rateKey].commission += commission;

                stylistTransactions.push({
                    serviceName: item.service.name,
                    price: item.price,
                    commission: commission,
                    timestamp: tx.timestamp
                });
            }
        });
    });
    
    stylistTransactions.sort((a,b) => b.timestamp.localeCompare(a.timestamp));

    const totalGross = breakdown['0.3'].total + breakdown['0.4'].total;
    const totalCommission = breakdown['0.3'].commission + breakdown['0.4'].commission;
    const salonProfit = totalGross - totalCommission;

    setGeneratedReport({
        totalGross,
        totalCommission,
        salonProfit,
        breakdown,
        transactions: stylistTransactions
    });
  };
  
  const isPaid = useMemo(() => {
    if (!selectedStylistId || !generatedReport) return false;
    return payrollRecords.some(r => 
        r.stylistId === selectedStylistId &&
        r.startDate === startDate &&
        r.endDate === endDate
    );
  }, [payrollRecords, selectedStylistId, startDate, endDate, generatedReport]);

  const togglePaidStatus = () => {
    if (!selectedStylistId) return;
    const record: PayrollRecord = { stylistId: selectedStylistId, startDate, endDate };
    if(isPaid) {
        setPayrollRecords(prev => prev.filter(r => !(r.stylistId === record.stylistId && r.startDate === record.startDate && r.endDate === record.endDate)));
    } else {
        setPayrollRecords(prev => [...prev, record]);
    }
  };

  return (
    <div>
        <div className="bg-white p-4 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-3 text-slate-700">Calcular Salario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label htmlFor="stylist-payroll" className="block text-sm font-medium text-slate-600 mb-1">Estilista</label>
                    <select id="stylist-payroll" value={selectedStylistId || ''} onChange={e => setSelectedStylistId(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500">
                        {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-slate-600 mb-1">Desde</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-slate-600 mb-1">Hasta</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <button onClick={handleGenerateReport} className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-teal-600 transition-colors">Generar Reporte</button>
            </div>
        </div>

        {generatedReport ? (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800">Reporte de Pago</h3>
                        <p className="text-slate-500">Estilista: <span className="font-semibold text-teal-700">{stylists.find(s=> s.id === selectedStylistId)?.name}</span></p>
                        <p className="text-slate-500">Periodo: <span className="font-semibold">{startDate}</span> al <span className="font-semibold">{endDate}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                        {isPaid && <span className="text-sm font-bold bg-green-100 text-green-800 px-3 py-1.5 rounded-full">PAGADO</span>}
                        <button onClick={togglePaidStatus} className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-colors ${isPaid ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                           {isPaid ? 'Marcar como No Pagado' : 'Marcar como Pagado'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                    <div className="text-center"><p className="text-sm text-slate-500">Total Bruto</p><p className="text-2xl font-bold text-slate-800">Bs {generatedReport.totalGross.toFixed(2)}</p></div>
                    <div className="text-center"><p className="text-sm text-slate-500">Total a Pagar</p><p className="text-2xl font-bold text-green-600">Bs {generatedReport.totalCommission.toFixed(2)}</p></div>
                    <div className="text-center"><p className="text-sm text-slate-500">Ganancia Salón</p><p className="text-2xl font-bold text-teal-600">Bs {generatedReport.salonProfit.toFixed(2)}</p></div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-lg text-slate-700 mb-2">Comisión 30%</h4>
                        <p>Total Servicios: <span className="font-semibold">Bs {generatedReport.breakdown['0.3'].total.toFixed(2)}</span></p>
                        <p>Total Comisión: <span className="font-semibold text-green-700">Bs {generatedReport.breakdown['0.3'].commission.toFixed(2)}</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-lg text-slate-700 mb-2">Comisión 40%</h4>
                        <p>Total Servicios: <span className="font-semibold">Bs {generatedReport.breakdown['0.4'].total.toFixed(2)}</span></p>
                        <p>Total Comisión: <span className="font-semibold text-green-700">Bs {generatedReport.breakdown['0.4'].commission.toFixed(2)}</span></p>
                    </div>
                </div>

                <h4 className="font-bold text-xl text-slate-700 mb-3">Transacciones</h4>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {generatedReport.transactions.length > 0 ? generatedReport.transactions.map((tx, index) => (
                         <div key={index} className="flex justify-between items-center text-slate-700 bg-slate-100 p-3 rounded-md">
                            <div>
                                <span className="flex items-center gap-2 font-medium"><ScissorsIcon className="h-4 w-4 text-teal-500" />{tx.serviceName}</span>
                                <span className="text-xs text-slate-500 ml-6">{new Date(tx.timestamp).toLocaleString('es-ES')}</span>
                            </div>
                            <div className="text-right">
                                <span className="font-semibold">Bs {tx.price.toFixed(2)}</span>
                                <p className="text-xs text-green-600 font-medium">Comisión: Bs {tx.commission.toFixed(2)}</p>
                             </div>
                         </div>
                    )) : <p className="text-slate-500 text-center py-4">No hay transacciones para este periodo.</p>}
                </div>
            </div>
        ) : (
            <div className="bg-white p-10 rounded-xl shadow-lg text-center">
                <h3 className="text-xl font-semibold text-slate-600">Genere un reporte de pago</h3>
                <p className="text-slate-500 mt-2">Seleccione un estilista y un rango de fechas para calcular el salario.</p>
            </div>
        )}
    </div>
  );
};

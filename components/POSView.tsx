import React, { useState, useMemo } from 'react';
import type { Service, Stylist, Transaction, Report, Expense } from '../types';
import { PaymentMethod } from '../types';
import { CashIcon } from './icons/CashIcon';
import { QrIcon } from './icons/QrIcon';
import { UserIcon } from './icons/UserIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { PlusIcon } from './icons/PlusIcon';

interface POSViewProps {
  services: Service[];
  stylists: Stylist[];
  addTransaction: (transaction: Transaction) => void;
  reports: Report[];
  addExpense: (expense: { description: string; amount: number }) => void;
  deleteExpense: (id: string) => void;
}

interface TicketItem {
  id: string; // Unique ID for this ticket line item
  service: Service;
  price: number;
  stylist: Stylist | null;
}

export const POSView: React.FC<POSViewProps> = ({ services, stylists, addTransaction, reports, addExpense, deleteExpense }) => {
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(stylists[0] || null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const total = useMemo(() => ticket.reduce((sum, item) => sum + item.price, 0), [ticket]);

  const todaysReport = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reports.find(r => r.date === today);
  }, [reports]);

  const todaysExpenses = useMemo(() => todaysReport?.expenses || [], [todaysReport]);

  const addToTicket = (service: Service) => {
    const newItem: TicketItem = {
      id: crypto.randomUUID(),
      service,
      price: service.price,
      stylist: selectedStylist,
    };
    setTicket(prev => [...prev, newItem]);
    setEditingItemId(newItem.id);
    setTempPrice(newItem.price.toString());
  };

  const removeFromTicket = (id: string) => {
    setTicket(prev => prev.filter((item) => item.id !== id));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempPrice(e.target.value);
  };

  const savePriceChange = (id: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setTicket(prev => prev.map(item =>
        item.id === id ? { ...item, price: newPrice } : item
      ));
    }
    setEditingItemId(null);
    setTempPrice('');
  };
  
  const handleItemStylistChange = (itemId: string, newStylistId: number) => {
    const newStylist = stylists.find(s => s.id === newStylistId);
    if (newStylist) {
      setTicket(prevTicket => prevTicket.map(item => 
        item.id === itemId ? { ...item, stylist: newStylist } : item
      ));
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      savePriceChange(id);
    } else if (e.key === 'Escape') {
      setEditingItemId(null);
      setTempPrice('');
    }
  };

  const startEditingPrice = (item: TicketItem) => {
    setEditingItemId(item.id);
    setTempPrice(item.price.toString());
  };

  const handlePayment = (paymentMethod: PaymentMethod) => {
    const isAnyStylistMissing = ticket.some(item => !item.stylist);
    if (ticket.length === 0 || isAnyStylistMissing) {
      alert('Por favor, agregue servicios y asigne un estilista a cada uno.');
      return;
    }
    const newTransaction: Transaction = {
      id: new Date().toISOString(),
      items: ticket.map(t => ({
        service: t.service,
        price: t.price,
        stylist: t.stylist!,
      })),
      paymentMethod,
      total,
      timestamp: new Date().toISOString()
    };
    addTransaction(newTransaction);
    setTicket([]);
    setSelectedStylist(stylists[0] || null);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (expenseDescription && !isNaN(amount) && amount > 0) {
      addExpense({ description: expenseDescription, amount });
      setExpenseDescription('');
      setExpenseAmount('');
    } else {
      alert('Por favor, ingrese una descripción y un monto válido.');
    }
  };
  
  const isPaymentDisabled = ticket.length === 0 || ticket.some(item => !item.stylist);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Services Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-slate-700">Servicios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map(service => (
            <button key={service.id} onClick={() => addToTicket(service)} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-teal-50 transition-all duration-200 text-center flex flex-col justify-center items-center aspect-square">
              <span className="font-semibold text-slate-800 break-words">{service.name}</span>
              <span className="text-teal-600 font-bold mt-2">Bs {service.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Ticket and Expenses */}
      <div className="space-y-8">
        {/* Ticket / Bill */}
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-fit">
          <h2 className="text-2xl font-bold mb-4 border-b pb-3 text-slate-700">Cuenta</h2>
          
          <div className="mb-4">
              <label htmlFor="stylist-select" className="block text-sm font-medium text-slate-600 mb-1">Estilista (para nuevos servicios)</label>
              <div className="relative">
                  <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select 
                      id="stylist-select"
                      value={selectedStylist?.id || ''} 
                      onChange={e => setSelectedStylist(stylists.find(s => s.id === parseInt(e.target.value)) || null)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 appearance-none"
                  >
                      {stylists.map(stylist => (
                          <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                      ))}
                  </select>
              </div>
          </div>

          <div className="flex-grow space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
              {ticket.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No hay servicios en la cuenta.</p>
              ) : (
                  ticket.map((item) => (
                      <div key={item.id} className="flex justify-between items-start bg-slate-50 p-3 rounded-md gap-2">
                          <div className="flex-1">
                            <span className="text-sm text-slate-700 font-medium break-words pr-2">{item.service.name}</span>
                            <div className="relative mt-1">
                                <UserIcon className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select 
                                    value={item.stylist?.id || ''} 
                                    onChange={(e) => handleItemStylistChange(item.id, parseInt(e.target.value))}
                                    className={`w-full pl-7 pr-2 py-1 border rounded-md text-xs appearance-none ${!item.stylist ? 'border-red-400' : 'border-slate-300'}`}
                                >
                                    <option value="" disabled>Asignar...</option>
                                    {stylists.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                              {editingItemId === item.id ? (
                                  <input
                                      type="number"
                                      value={tempPrice}
                                      onChange={handlePriceChange}
                                      onBlur={() => savePriceChange(item.id)}
                                      onKeyDown={(e) => handlePriceKeyDown(e, item.id)}
                                      className="w-24 text-right px-1 py-0.5 border rounded-md"
                                      autoFocus
                                      onFocus={(e) => e.target.select()}
                                  />
                              ) : (
                                  <span className="font-semibold text-slate-800 cursor-pointer w-24 text-right" onClick={() => startEditingPrice(item)}>Bs {item.price.toFixed(2)}</span>
                              )}
                              <button onClick={() => removeFromTicket(item.id)} className="text-red-500 hover:text-red-700">
                                  <TrashIcon className="h-4 w-4" />
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>

          <div className="border-t-2 border-dashed pt-4 mt-auto">
              <div className="flex justify-between items-center text-2xl font-bold text-slate-800">
                  <span>Total:</span>
                  <span>Bs {total.toFixed(2)}</span>
              </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => handlePayment(PaymentMethod.Cash)} disabled={isPaymentDisabled} className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
              <CashIcon className="h-6 w-6" />
              <span>Efectivo</span>
            </button>
            <button onClick={() => handlePayment(PaymentMethod.QR)} disabled={isPaymentDisabled} className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white font-bold rounded-lg shadow-md hover:bg-sky-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
              <QrIcon className="h-6 w-6" />
              <span>QR</span>
            </button>
          </div>
        </div>
        
        {/* Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-fit">
            <h2 className="text-2xl font-bold mb-4 border-b pb-3 text-slate-700">Egresos del Día</h2>
            <form onSubmit={handleAddExpense} className="flex items-start gap-2 mb-4">
              <div className="flex-1">
                <label htmlFor="expense-desc" className="sr-only">Descripción</label>
                <input id="expense-desc" type="text" placeholder="Descripción del gasto" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div className="w-28">
                <label htmlFor="expense-amount" className="sr-only">Monto</label>
                <input id="expense-amount" type="number" placeholder="Monto" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <button type="submit" className="p-2 bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 transition-colors self-stretch flex items-center"><PlusIcon className="h-6 w-6" /></button>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {todaysExpenses.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No hay gastos registrados hoy.</p>
              ) : (
                todaysExpenses.map(expense => (
                  <div key={expense.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                        <ReceiptIcon className="h-5 w-5 text-amber-600" />
                        <span className="text-slate-700">{expense.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-red-600">Bs {expense.amount.toFixed(2)}</span>
                        <button onClick={() => deleteExpense(expense.id)} className="text-red-500 hover:text-red-70t00 p-1"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import type { Service, Stylist } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';

interface SettingsViewProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  stylists: Stylist[];
  setStylists: React.Dispatch<React.SetStateAction<Stylist[]>>;
}

type ModalState = 
  | { type: 'service'; mode: 'add' }
  | { type: 'service'; mode: 'edit'; data: Service }
  | { type: 'stylist'; mode: 'add' }
  | { type: 'stylist'; mode: 'edit'; data: Stylist }
  | null;

export const SettingsView: React.FC<SettingsViewProps> = ({ services, setServices, stylists, setStylists }) => {
  const [modalState, setModalState] = useState<ModalState>(null);

  const handleDeleteService = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este servicio?')) {
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleDeleteStylist = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este estilista?')) {
      setStylists(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSave = (data: Partial<Service & Stylist> & { commissionRate?: string }) => {
    if (!modalState) return;

    if (modalState.type === 'service') {
      if (modalState.mode === 'add') {
        const newService: Service = {
          id: Date.now(),
          name: data.name || 'Nuevo Servicio',
          price: Number(data.price) || 0,
          commissionRate: data.commissionRate === '0.4' ? 0.4 : 0.3,
        };
        setServices(prev => [...prev, newService]);
      } else if (modalState.mode === 'edit') {
        setServices(prev => prev.map(s => s.id === modalState.data.id ? { 
            ...s,
            name: data.name!, 
            price: Number(data.price),
            commissionRate: data.commissionRate === '0.4' ? 0.4 : 0.3,
        } : s));
      }
    } else if (modalState.type === 'stylist') {
      if (modalState.mode === 'add') {
        const newStylist: Stylist = {
          id: Date.now(),
          name: data.name || 'Nuevo Estilista',
        };
        setStylists(prev => [...prev, newStylist]);
      } else if (modalState.mode === 'edit') {
        setStylists(prev => prev.map(s => s.id === modalState.data.id ? { ...s, name: data.name! } : s));
      }
    }

    setModalState(null);
  };

  const renderModal = () => {
    if (!modalState) return null;

    const isService = modalState.type === 'service';
    const isEditing = modalState.mode === 'edit';
    const title = `${isEditing ? 'Editar' : 'Añadir'} ${isService ? 'Servicio' : 'Estilista'}`;
    const initialData = isEditing ? modalState.data : {};

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setModalState(null)}>
        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h3 className="text-2xl font-bold mb-6 text-slate-700">{title}</h3>
          <Form onSave={handleSave} initialData={initialData} type={modalState.type} onCancel={() => setModalState(null)} />
        </div>
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {renderModal()}
      {/* Manage Services */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Gestionar Servicios</h2>
          <button onClick={() => setModalState({ type: 'service', mode: 'add' })} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition-colors">
            <PlusIcon className="h-5 w-5" />
            <span>Añadir</span>
          </button>
        </div>
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {services.map(service => (
            <li key={service.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
              <div>
                <p className="font-semibold text-slate-800">{service.name}</p>
                <p className="text-sm text-slate-500">
                  Bs {service.price.toFixed(2)} - <span className="font-medium text-teal-600">{service.commissionRate * 100}% Comisión</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setModalState({ type: 'service', mode: 'edit', data: service })} className="p-2 text-slate-500 hover:text-blue-600 transition-colors"><EditIcon className="h-5 w-5" /></button>
                <button onClick={() => handleDeleteService(service.id)} className="p-2 text-slate-500 hover:text-red-600 transition-colors"><TrashIcon className="h-5 w-5" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Manage Stylists */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Gestionar Estilistas</h2>
          <button onClick={() => setModalState({ type: 'stylist', mode: 'add' })} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition-colors">
            <PlusIcon className="h-5 w-5" />
            <span>Añadir</span>
          </button>
        </div>
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {stylists.map(stylist => (
            <li key={stylist.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
              <p className="font-semibold text-slate-800">{stylist.name}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setModalState({ type: 'stylist', mode: 'edit', data: stylist })} className="p-2 text-slate-500 hover:text-blue-600 transition-colors"><EditIcon className="h-5 w-5" /></button>
                <button onClick={() => handleDeleteStylist(stylist.id)} className="p-2 text-slate-500 hover:text-red-600 transition-colors"><TrashIcon className="h-5 w-5" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Form component for the modal
interface FormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData: Partial<Service & Stylist>;
  type: 'service' | 'stylist';
}

const Form: React.FC<FormProps> = ({ onSave, onCancel, initialData, type }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    price: initialData.price || '',
    commissionRate: (initialData as Service).commissionRate?.toString() || '0.3',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          autoFocus
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
        />
      </div>
      {type === 'service' && (
        <>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">Precio (Bs)</label>
          <input
            type="number"
            name="price"
            id="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
            <label htmlFor="commissionRate" className="block text-sm font-medium text-slate-600 mb-1">Tasa de Comisión</label>
            <select
                name="commissionRate"
                id="commissionRate"
                value={formData.commissionRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
            >
                <option value="0.3">30%</option>
                <option value="0.4">40%</option>
            </select>
        </div>
        </>
      )}
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition-colors">
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
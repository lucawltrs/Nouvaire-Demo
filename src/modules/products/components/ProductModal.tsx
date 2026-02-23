import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { producersApi, categoriesApi } from '../../shared/services/shared.api';
import type { Producer, Category } from '../../shared/types';
import type { Product, CreateProductInput } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: CreateProductInput) => Promise<void>;
  product?: Product | null;
}

export function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    category_id: 1,
    description: '',
    price: '',
    unit: 'kg',
    producer_id: 1,
    available: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Producers und Categories beim Öffnen laden
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    setIsLoadingData(true);
    try {
      const [producersData, categoriesData] = await Promise.all([
        producersApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setProducers(producersData);
      setCategories(categoriesData);
      
      // Standard-Werte setzen wenn Listen geladen wurden
      if (!product && producersData.length > 0 && categoriesData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          producer_id: producersData[0].id,
          category_id: categoriesData[0].id,
        }));
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category_id: product.category_id,
        description: product.description,
        price: product.price,
        unit: product.unit,
        producer_id: product.producer_id,
        available: product.available,
      });
    } else {
      setFormData({
        name: '',
        category_id: 1,
        description: '',
        price: '',
        unit: 'kg',
        producer_id: 1,
        available: true,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateProductInput, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Produkt bearbeiten' : 'Neues Produkt'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />

        <Textarea
          label="Beschreibung"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Preis"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            required
          />

          <Input
            label="Einheit"
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            placeholder="z.B. kg, Stück, L"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Kategorie"
            value={formData.category_id.toString()}
            onChange={(e) => handleChange('category_id', parseInt(e.target.value))}
            options={categories.map((cat) => ({
              value: cat.id.toString(),
              label: cat.name,
            }))}
            disabled={isLoadingData || categories.length === 0}
            required
          />

          <Select
            label="Produzent"
            value={formData.producer_id.toString()}
            onChange={(e) => handleChange('producer_id', parseInt(e.target.value))}
            options={producers.map((prod) => ({
              value: prod.id.toString(),
              label: prod.name,
            }))}
            disabled={isLoadingData || producers.length === 0}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="available"
            checked={formData.available}
            onChange={(e) => handleChange('available', e.target.checked)}
            className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
          />
          <label htmlFor="available" className="text-sm text-gray-300">
            Verfügbar
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {product ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

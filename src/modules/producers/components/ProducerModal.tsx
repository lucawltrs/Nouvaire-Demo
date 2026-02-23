import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import type { Producer, CreateProducerInput } from '../types';

interface ProducerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (producer: CreateProducerInput) => Promise<void>;
  producer?: Producer | null;
}

export function ProducerModal({ isOpen, onClose, onSave, producer }: ProducerModalProps) {
  const [formData, setFormData] = useState<CreateProducerInput>({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    image_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (producer) {
      setFormData({
        name: producer.name,
        description: producer.description,
        address: producer.address,
        latitude: producer.latitude,
        longitude: producer.longitude,
        phone: producer.phone,
        email: producer.email,
        website: producer.website,
        image_url: producer.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        website: '',
        image_url: '',
      });
    }
  }, [producer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving producer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateProducerInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={producer ? 'Produzent bearbeiten' : 'Neuer Produzent'}
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

        <Input
          label="Adresse"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Breitengrad (Latitude)"
            value={formData.latitude}
            onChange={(e) => handleChange('latitude', e.target.value)}
            placeholder="z.B. 53.866865"
            required
          />

          <Input
            label="Längengrad (Longitude)"
            value={formData.longitude}
            onChange={(e) => handleChange('longitude', e.target.value)}
            placeholder="z.B. 8.707326"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefon"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+49 123 456789"
            required
          />

          <Input
            label="E-Mail"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="info@beispiel.de"
            required
          />
        </div>

        <Input
          label="Website"
          type="url"
          value={formData.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://www.beispiel.de"
          required
        />

        <Input
          label="Bild URL (optional)"
          type="url"
          value={formData.image_url}
          onChange={(e) => handleChange('image_url', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {producer ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

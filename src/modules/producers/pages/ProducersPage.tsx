import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducersStore } from '../store/useProducersStore';
import { ProducerModal } from '../components/ProducerModal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import type { Producer, CreateProducerInput } from '../types';

export function ProducersPage() {
  const {
    producers,
    isLoading,
    error,
    fetchProducers,
    createProducer,
    updateProducer,
    deleteProducer,
  } = useProducersStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [producerToDelete, setProducerToDelete] = useState<Producer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducers();
  }, [fetchProducers]);

  const handleCreateNew = () => {
    setEditingProducer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (producer: Producer) => {
    setEditingProducer(producer);
    setIsModalOpen(true);
  };

  const handleSave = async (producerData: CreateProducerInput) => {
    if (editingProducer) {
      await updateProducer(editingProducer.id, producerData);
    } else {
      await createProducer(producerData);
    }
  };

  const handleDeleteClick = (producer: Producer) => {
    setProducerToDelete(producer);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (producerToDelete) {
      setIsDeleting(true);
      try {
        await deleteProducer(producerToDelete.id);
        setIsDeleteModalOpen(false);
        setProducerToDelete(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Producers</h1>
          <p className="mt-2 text-gray-400">Manage your producers and suppliers</p>
        </div>
        <Button onClick={handleCreateNew}>
          + Neuer Produzent
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Lade Produzenten...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {producers.map((producer) => (
            <Card key={producer.id} hover>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-100">{producer.name}</h3>
                </div>

                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {producer.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="text-gray-500 mr-2">📍</span>
                    <span className="line-clamp-1">{producer.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="text-gray-500 mr-2">📧</span>
                    <span className="line-clamp-1">{producer.email}</span>
                  </div>
                  {producer.categories && producer.categories.length > 0 && (
                    <div className="flex items-center text-sm text-gray-300">
                      <span className="text-gray-500 mr-2">🏷️</span>
                      <span className="line-clamp-1">
                        {producer.categories.map(c => c.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link to={`/producers/${producer.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Details
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(producer)}
                    className="flex-1"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteClick(producer)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {producers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">Keine Produzenten gefunden</p>
            </div>
          )}
        </div>
      )}

      <ProducerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        producer={editingProducer}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProducerToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Produzent löschen"
        message="Möchten Sie diesen Produzenten wirklich löschen?"
        itemName={producerToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
}

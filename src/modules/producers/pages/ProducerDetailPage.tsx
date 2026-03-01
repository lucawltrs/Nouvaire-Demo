import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducersStore } from '../store/useProducersStore';
import { ProducerModal } from '../components/ProducerModal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { CreateProducerInput } from '../types';

export function ProducerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedProducer,
    isLoading,
    error,
    fetchProducerById,
    updateProducer,
    deleteProducer,
  } = useProducersStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProducerById(parseInt(id));
    }
  }, [id, fetchProducerById]);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSave = async (producerData: CreateProducerInput) => {
    if (selectedProducer) {
      await updateProducer(selectedProducer.id, producerData);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProducer) {
      setIsDeleting(true);
      try {
        await deleteProducer(selectedProducer.id);
        navigate('/producers');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lade Produzent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link to="/producers">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  if (!selectedProducer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Produzent nicht gefunden</p>
        <Link to="/producers" className="inline-block mt-4">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/producers">
            <Button variant="ghost" size="sm">
              ← Zurück zur Liste
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleEdit}>
            Bearbeiten
          </Button>
          <Button variant="danger" onClick={handleDeleteClick}>
            Löschen
          </Button>
        </div>
      </div>

      {/* Producer Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-100 mb-2">{selectedProducer.name}</h1>
          <p className="text-gray-300 text-lg">{selectedProducer.description}</p>
        </div>
      </div>

      {/* Producer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Kontaktinformationen</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">📍 Adresse</h3>
                <p className="text-gray-200">{selectedProducer.address}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">📞 Telefon</h3>
                <a href={`tel:${selectedProducer.phone}`} className="text-brand-400 hover:text-brand-300">
                  {selectedProducer.phone}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">📧 E-Mail</h3>
                <a href={`mailto:${selectedProducer.email}`} className="text-brand-400 hover:text-brand-300">
                  {selectedProducer.email}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">🌐 Website</h3>
                <a 
                  href={selectedProducer.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300"
                >
                  {selectedProducer.website}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">🗺️ Koordinaten</h3>
                <p className="text-gray-300">
                  Lat: {selectedProducer.latitude}<br />
                  Lng: {selectedProducer.longitude}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">🔗 Unique URL</h3>
                <p className="text-gray-300 font-mono text-sm">{selectedProducer.unique_url}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Side Info Card */}
        <div className="space-y-6">
          {/* Image Card */}
          {selectedProducer.image_url && (
            <Card>
              <div className="p-4">
                <img 
                  src={selectedProducer.image_url} 
                  alt={selectedProducer.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </Card>
          )}

          {/* Categories Card */}
          {selectedProducer.categories && selectedProducer.categories.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">🏷️ Kategorien ({selectedProducer.categories.length})</h3>
                <div className="space-y-2">
                  {selectedProducer.categories.map((category) => (
                    <Link 
                      key={category.id} 
                      to={`/categories/${category.id}`}
                      className="block p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200">{category.name}</span>
                        <span className="text-gray-500">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Meta Info Card */}
          <Card>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Erstellt am</h3>
                <p className="text-gray-300 text-sm">
                  {new Date(selectedProducer.created_at).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Zuletzt aktualisiert</h3>
                <p className="text-gray-300 text-sm">
                  {new Date(selectedProducer.updated_at).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Products Section */}
      {selectedProducer.products && selectedProducer.products.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              🛒 Produkte ({selectedProducer.products.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProducer.products.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/products/${product.id}`}
                  className="block p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-100">{product.name}</h3>
                    <Badge variant={product.available ? 'success' : 'default'}>
                      {product.available ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-orange-500">{product.price} €</span>
                    <span className="text-gray-400 text-sm">/ {product.unit}</span>
                  </div>
                  {product.category && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <span className="text-xs text-gray-400">{product.category.name}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {selectedProducer && (
        <ProducerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          producer={selectedProducer}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedProducer?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

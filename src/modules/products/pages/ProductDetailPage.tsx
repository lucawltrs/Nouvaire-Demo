import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProductsStore } from '../store/useProductsStore';
import { ProductModal } from '../components/ProductModal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { producersApi, categoriesApi } from '../../shared/services/shared.api';
import type { Producer, Category } from '../../shared/types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { CreateProductInput } from '../types';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedProduct,
    isLoading,
    error,
    fetchProductById,
    updateProduct,
    deleteProduct,
  } = useProductsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductById(parseInt(id));
    }
  }, [id, fetchProductById]);

  useEffect(() => {
    if (selectedProduct) {
      loadMetaData();
    }
  }, [selectedProduct]);

  const loadMetaData = async () => {
    if (!selectedProduct) return;
    
    setIsLoadingMeta(true);
    try {
      const [producersData, categoriesData] = await Promise.all([
        producersApi.getAll(),
        categoriesApi.getAll(),
      ]);
      
      setProducer(producersData.find(p => p.id === selectedProduct.producer_id) || null);
      setCategory(categoriesData.find(c => c.id === selectedProduct.category_id) || null);
    } catch (error) {
      console.error('Error loading metadata:', error);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSave = async (productData: CreateProductInput) => {
    if (selectedProduct) {
      await updateProduct(selectedProduct.id, productData);
      await loadMetaData();
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProduct) {
      setIsDeleting(true);
      try {
        await deleteProduct(selectedProduct.id);
        navigate('/products');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lade Produkt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link to="/products">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Produkt nicht gefunden</p>
        <Link to="/products" className="inline-block mt-4">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Zurück-Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/products">
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

      {/* Product Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-100 mb-2">{selectedProduct.name}</h1>
          <div className="flex items-center space-x-3">
            <Badge variant={selectedProduct.available ? 'success' : 'default'}>
              {selectedProduct.available ? 'Verfügbar' : 'Nicht verfügbar'}
            </Badge>
            <span className="text-3xl font-bold text-orange-500">
              {selectedProduct.price} €
            </span>
            <span className="text-gray-400">/ {selectedProduct.unit}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Produktinformationen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Beschreibung</h3>
              <p className="text-gray-200 text-base">{selectedProduct.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Kategorie</h3>
              {isLoadingMeta ? (
                <p className="text-gray-400 text-sm">Lädt...</p>
              ) : (
                <p className="text-gray-200 text-base">
                  {category ? category.name : `ID: ${selectedProduct.category_id}`}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Produzent</h3>
              {isLoadingMeta ? (
                <p className="text-gray-400 text-sm">Lädt...</p>
              ) : (
                <p className="text-gray-200 text-base">
                  {producer ? producer.name : `ID: ${selectedProduct.producer_id}`}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Erstellt am</h3>
              <p className="text-gray-300">
                {new Date(selectedProduct.created_at).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Zuletzt aktualisiert</h3>
              <p className="text-gray-300">
                {new Date(selectedProduct.updated_at).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          product={selectedProduct}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedProduct?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

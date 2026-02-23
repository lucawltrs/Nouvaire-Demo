import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProductsStore } from '../store/useProductsStore';
import { ProductModal } from '../components/ProductModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { Product, CreateProductInput } from '../types';

export function ProductsPage() {
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProductsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = async (productData: CreateProductInput) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await createProduct(productData);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Products</h1>
          <p className="mt-2 text-gray-400">Manage your product catalog</p>
        </div>
        <Button onClick={handleCreateNew}>
          + Neues Produkt
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Lade Produkte...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} hover>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-100">{product.name}</h3>
                  <Badge variant={product.available ? 'success' : 'default'}>
                    {product.available ? 'Verfügbar' : 'N/A'}
                  </Badge>
                </div>

                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-orange-500">
                    {product.price} €
                  </span>
                  <span className="text-gray-400 text-sm">/ {product.unit}</span>
                </div>

                <div className="flex space-x-2">
                  <Link to={`/products/${product.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Details
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {products.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">Keine Produkte gefunden</p>
            </div>
          )}
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        product={editingProduct}
      />
    </div>
  );
}

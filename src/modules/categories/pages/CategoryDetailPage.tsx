import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { CategoryModal } from '../components/CategoryModal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import type { CreateCategoryInput } from '../types';

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedCategory,
    isLoading,
    error,
    fetchCategoryById,
    updateCategory,
    deleteCategory,
  } = useCategoriesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCategoryById(parseInt(id));
    }
  }, [id, fetchCategoryById]);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSave = async (categoryData: CreateCategoryInput) => {
    if (selectedCategory) {
      await updateCategory(selectedCategory.id, categoryData);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCategory) {
      setIsDeleting(true);
      try {
        await deleteCategory(selectedCategory.id);
        navigate('/categories');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lade Kategorie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link to="/categories">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  if (!selectedCategory) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Kategorie nicht gefunden</p>
        <Link to="/categories" className="inline-block mt-4">
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
          <Link to="/categories">
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

      {/* Category Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-100 mb-2">{selectedCategory.name}</h1>
          <p className="text-gray-400">Kategorie-Details</p>
        </div>
      </div>

      {/* Category Details */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Kategorieinformationen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Name</h3>
              <p className="text-gray-200 text-base">{selectedCategory.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">ID</h3>
              <p className="text-gray-200 text-base">#{selectedCategory.id}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Erstellt am</h3>
              <p className="text-gray-300">
                {new Date(selectedCategory.created_at).toLocaleDateString('de-DE', {
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
                {new Date(selectedCategory.updated_at).toLocaleDateString('de-DE', {
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

      {selectedCategory && (
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          category={selectedCategory}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedCategory?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

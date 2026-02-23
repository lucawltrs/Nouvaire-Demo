import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { CategoryModal } from '../components/CategoryModal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import type { Category, CreateCategoryInput } from '../types';

export function CategoriesPage() {
  const {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoriesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSave = async (categoryData: CreateCategoryInput) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryData);
    } else {
      await createCategory(categoryData);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      setIsDeleting(true);
      try {
        await deleteCategory(categoryToDelete.id);
      } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Categories</h1>
          <p className="mt-2 text-gray-400">Manage your product categories</p>
        </div>
        <Button onClick={handleCreateNew}>
          + Neue Kategorie
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Lade Kategorien...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={category.id} hover>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-100">{category.name}</h3>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  <p>Erstellt: {new Date(category.created_at).toLocaleDateString('de-DE')}</p>
                </div>

                <div className="flex space-x-2">
                  <Link to={`/categories/${category.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Details
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="flex-1"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteClick(category)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">Keine Kategorien gefunden</p>
            </div>
          )}
        </div>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        category={editingCategory}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={categoryToDelete?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

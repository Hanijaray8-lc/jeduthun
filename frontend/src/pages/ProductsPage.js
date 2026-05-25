import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiSave, FiX } from 'react-icons/fi';
import { productAPI } from '../utils/api';

const emptyForm = { name: '', description: '', amount: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productAPI.getAll(search);
      setProducts(res.data.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.amount) {
      return toast.error('Name and amount are required');
    }

    try {
      if (editId) {
        await productAPI.update(editId, form);
        toast.success('Product updated!');
      } else {
        await productAPI.create(form);
        toast.success('Product added!');
      }

      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description,
      amount: p.amount,
    });

    setEditId(p._id);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    setDeleting(id);

    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage your shop inventory
          </p>
        </div>

        <button
          className="gold-btn"
          onClick={() => {
            setShowForm(true);
            setForm(emptyForm);
            setEditId(null);
          }}
        >
          <FiPlus size={16} />
          Add Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-gold-700 animate-pulse-once">

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-gold-400 font-semibold text-lg">
              {editId ? 'Edit Product' : 'Add New Product'}
            </h2>

            <button
              onClick={cancelEdit}
              className="text-dark-400 hover:text-gold-400"
            >
              <FiX size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >

            <div>
              <label className="label">Product Name *</label>

              <input
                className="input-field"
                placeholder="e.g. Yamaha Guitar"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">Amount (₹) *</label>

              <input
                className="input-field"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>

              <input
                className="input-field"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">

              <button type="submit" className="gold-btn">
                <FiSave size={15} />
                {editId ? 'Update Product' : 'Add Product'}
              </button>

              <button
                type="button"
                onClick={cancelEdit}
                className="dark-btn"
              >
                <FiX size={15} />
                Cancel
              </button>

            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          size={16}
        />

        <input
          className="input-field pl-9"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="card p-0 overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full">

            <thead>
              <tr>
                <th className="table-th">#</th>
                <th className="table-th">Product Name</th>
                <th className="table-th text-right pr-4">Amount (₹)</th>
                <th className="table-th text-right pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-dark-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (

                <tr>
                  <td colSpan={4} className="text-center py-16">

                    <FiPackage
                      className="mx-auto text-dark-600 mb-3"
                      size={40}
                    />

                    <p className="text-dark-400">
                      No products found
                    </p>

                    <p className="text-dark-600 text-xs mt-1">
                      Add your first product above
                    </p>

                  </td>
                </tr>

              ) : (
                products.map((p, i) => (
                  <tr key={p._id} className="table-row">

                    <td className="table-td w-10 text-dark-500">
                      {i + 1}
                    </td>

                    <td className="table-td">
                      <div className="font-medium text-dark-100">
                        {p.name}
                      </div>

                      {p.description && (
                        <div className="text-xs text-dark-500">
                          {p.description}
                        </div>
                      )}
                    </td>

                    <td className="table-td text-right font-mono text-gold-400 font-semibold pr-4">
                      ₹
                      {Number(p.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="table-td text-right pr-4">

                      <div className="flex items-center justify-end gap-2">

                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 rounded-lg bg-dark-700 text-gold-500 hover:bg-gold-500 hover:text-dark-900 transition-colors"
                        >
                          <FiEdit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(p._id)}
                          disabled={deleting === p._id}
                          className="p-1.5 rounded-lg bg-dark-700 text-red-500 hover:bg-red-900 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {products.length > 0 && (
          <div className="px-4 py-2 text-xs text-dark-500 border-t border-dark-700">
            {products.length} products
          </div>
        )}

      </div>
    </div>
  );
}
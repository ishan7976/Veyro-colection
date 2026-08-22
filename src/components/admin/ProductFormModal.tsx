import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductSize, ProductColor } from '../../types';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Trash2,
  Tag,
  Palette
} from 'lucide-react';
import { uploadProductImageToSupabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface ProductFormModalProps {
  product?: Product | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
}

const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: 'Obsidian Black', hex: '#111111' },
  { name: 'Vintage Acid Wash', hex: '#333333' },
  { name: 'Chalk White', hex: '#F5F5F0' },
  { name: 'Olive Drab', hex: '#3D4A3E' },
  { name: 'Desert Sand', hex: '#D2B48C' },
  { name: 'Crimson Burgundy', hex: '#5C1D24' },
  { name: 'Midnight Navy', hex: '#1A2436' },
  { name: 'Heather Grey', hex: '#777777' }
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isOpen = true,
  onClose,
  onSave
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const isEditing = Boolean(product && product.id);

  // Form Fields State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Oversized T-Shirts');
  const [price, setPrice] = useState('1999');
  const [originalPrice, setOriginalPrice] = useState('2999');
  const [gsm, setGsm] = useState('280');
  const [fit, setFit] = useState<Product['fit']>('Oversized Boxy Fit');
  const [stockQuantity, setStockQuantity] = useState('25');
  const [productStatus, setProductStatus] = useState<'Active' | 'In Stock' | 'Out of Stock' | 'Draft' | 'Archived'>('Active');
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isLimitedDrop, setIsLimitedDrop] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [dropNumber, setDropNumber] = useState('DROP 004');
  const [tags, setTags] = useState('Heavyweight, Streetwear, Luxury Atelier');
  const [fabricDetails, setFabricDetails] = useState('100% Super Combed Heavyweight Cotton, Pre-shrunk & Bio-washed');

  // Sizes
  const [sizes, setSizes] = useState<ProductSize[]>(['S', 'M', 'L', 'XL']);

  // Color Variants
  const [colors, setColors] = useState<ProductColor[]>([
    { name: 'Obsidian Black', hex: '#111111' },
    { name: 'Vintage Acid Wash', hex: '#333333' }
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111111');

  // Images Slots (up to 4)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'
  ]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Form handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize state on product change or modal open
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSlug(product.slug || '');
      setDescription(product.description || '');
      setCategory(product.category || 'Oversized T-Shirts');
      setPrice(product.price ? String(product.price) : '1999');
      setOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
      setGsm(product.gsm ? String(product.gsm) : '280');
      setFit(product.fit || 'Oversized Boxy Fit');
      setStockQuantity(product.stockQuantity !== undefined ? String(product.stockQuantity) : '25');
      setProductStatus(
        product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0)
          ? 'Out of Stock'
          : 'Active'
      );
      setIsNewArrival(product.isNewArrival ?? true);
      setIsLimitedDrop(product.isLimitedDrop ?? false);
      setIsTrending(product.isTrending ?? false);
      setDropNumber(product.dropNumber || 'DROP 004');
      setTags(product.tags?.join(', ') || 'Heavyweight, Streetwear');
      setFabricDetails(product.fabricDetails || '100% Super Combed Heavyweight Cotton, Pre-shrunk');
      setSizes(product.sizes?.length ? product.sizes : ['S', 'M', 'L', 'XL']);
      setColors(
        product.colors?.length
          ? product.colors
          : [
              { name: 'Obsidian Black', hex: '#111111' },
              { name: 'Vintage Acid Wash', hex: '#333333' }
            ]
      );
      const existingImgs = product.images && product.images.length > 0
        ? product.images
        : (product.image_url ? [product.image_url] : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80']);
      setImages(existingImgs);
    } else {
      // Default blank garment form
      setName('');
      setSlug('');
      setDescription('Crafted from luxury combed heavyweight cotton with our signature boxy streetwear silhouette, tailored for maximum drape and durability.');
      setCategory('Oversized T-Shirts');
      setPrice('1999');
      setOriginalPrice('2999');
      setGsm('280');
      setFit('Oversized Boxy Fit');
      setStockQuantity('25');
      setProductStatus('Active');
      setIsNewArrival(true);
      setIsLimitedDrop(false);
      setIsTrending(false);
      setDropNumber('DROP 004');
      setTags('Heavyweight, Streetwear, Luxury Atelier');
      setFabricDetails('100% Super Combed Heavyweight Cotton, Pre-shrunk & Bio-washed');
      setSizes(['S', 'M', 'L', 'XL']);
      setColors([
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Vintage Acid Wash', hex: '#333333' }
      ]);
      setImages(['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80']);
    }
    setFormError(null);
    setUploadStatus(null);
  }, [product, isOpen]);

  // Auto-slug generator
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing || !slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const toggleSize = (sz: ProductSize) => {
    setSizes(prev => 
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    );
  };

  // Color variant handlers
  const handleAddPresetColor = (preset: { name: string; hex: string }) => {
    if (!colors.some(c => c.hex.toLowerCase() === preset.hex.toLowerCase())) {
      setColors([...colors, preset]);
    }
  };

  const handleAddCustomColor = () => {
    if (!newColorName.trim()) return;
    setColors([...colors, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName('');
  };

  const handleRemoveColor = (idx: number) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((_, i) => i !== idx));
  };

  // Image upload handler via Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(index);
    setUploadStatus(`Uploading image ${index + 1} to Supabase bucket "product-images"...`);
    setFormError(null);

    try {
      const result = await uploadProductImageToSupabase(file);
      if (result.success && result.publicUrl) {
        setImages(prev => {
          const next = [...prev];
          next[index] = result.publicUrl!;
          return next;
        });
        setUploadStatus(`Image ${index + 1} uploaded to Supabase successfully!`);
      } else {
        setFormError(result.error || 'Failed to upload image to Supabase Storage');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error uploading file');
    } finally {
      setUploadingSlot(null);
      setTimeout(() => setUploadStatus(null), 3500);
    }
  };

  const handleAddImageSlot = () => {
    if (images.length < 4) {
      setImages([...images, '']);
    }
  };

  const handleRemoveImageSlot = (index: number) => {
    if (images.length <= 1) {
      setImages(['']);
      return;
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImageUrlChange = (index: number, val: string) => {
    setImages(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Submit & Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Garment product name is required.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Please enter a valid garment selling price (₹).');
      return;
    }
    if (sizes.length === 0) {
      setFormError('Please select at least one available size (XS, S, M, L, XL, XXL).');
      return;
    }
    const validImages = images.map(img => img.trim()).filter(Boolean);
    if (validImages.length === 0) {
      setFormError('Please provide at least one product image or upload via Supabase.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const parsedStock = parseInt(stockQuantity) || 0;
      const inStockValue = productStatus !== 'Out of Stock' && productStatus !== 'Draft' && parsedStock > 0;
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      const payload = {
        id: product?.id || `prod_${Date.now()}`,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim(),
        category,
        price: numPrice,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        original_price: originalPrice ? parseFloat(originalPrice) : undefined,
        fabric_gsm: parseInt(gsm) || 280,
        gsm: parseInt(gsm) || 280,
        fabricDetails: fabricDetails.trim(),
        fit,
        images: validImages,
        image_url: validImages[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
        stockQuantity: parsedStock,
        stock_quantity: parsedStock,
        inStock: inStockValue,
        in_stock: inStockValue,
        sizes,
        colors: colors.length > 0 ? colors : [{ name: 'Obsidian Black', hex: '#111111' }],
        isNewArrival,
        new_arrival_badge: isNewArrival,
        isLimitedDrop,
        limited_drop_badge: isLimitedDrop,
        isTrending,
        status: productStatus,
        dropNumber: dropNumber.trim(),
        tags: tagArray.length > 0 ? tagArray : ['Heavyweight', 'Streetwear'],
        rating: product?.rating || 4.9,
        reviewCount: product?.reviewCount || 12,
        createdAt: product?.createdAt || new Date().toISOString()
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save garment to Supabase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="product-form-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md font-mono"
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col border rounded-2xl shadow-2xl overflow-hidden transition-colors ${
          isDark 
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        
        {/* STICKY MODAL HEADER */}
        <div className={`sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b backdrop-blur-xl shrink-0 ${
          isDark ? 'border-neutral-800 bg-neutral-950/95' : 'border-neutral-200 bg-neutral-50/95'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-bold text-sm uppercase tracking-wider truncate ${
                isDark ? 'text-white' : 'text-neutral-950'
              }`}>
                {isEditing ? `Edit Garment • ${product?.name}` : '+ Add Streetwear Garment'}
              </h3>
              <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Supabase catalog synchronization & image storage management
              </p>
            </div>
          </div>
          
          {/* CLEAR CLOSE (X) BUTTON AT TOP-RIGHT */}
          <button
            id="close-product-form-btn"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer shrink-0 ml-3 flex items-center justify-center ${
              isDark 
                ? 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700' 
                : 'border-neutral-200 bg-white text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 hover:border-neutral-300 shadow-xs'
            }`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
          
          {/* Validation error display */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Upload status display */}
          {uploadStatus && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 animate-spin" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>1. Garment Specifications & Nomenclature</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Product Name *
                </label>
                <input
                  id="product-name-input"
                  type="text"
                  required
                  placeholder="e.g. VEYRO Heavyweight Acid Wash Boxy Tee"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl font-bold focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <option value="Oversized T-Shirts">Oversized T-Shirts</option>
                  <option value="Graphic T-Shirts">Graphic T-Shirts</option>
                  <option value="Hoodies">Hoodies & Outerwear</option>
                  <option value="Limited Edition Drops">Limited Edition Drops</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="veyro-heavyweight-tee"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-neutral-300' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the luxury streetwear garment cut, silhouette, fabric handfeel..."
                  className={`w-full px-3 py-2.5 border rounded-xl focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, GSM & Inventory Stock */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>2. Financials, Fabric Weight (GSM) & Stock</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl font-bold focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-emerald-400' 
                      : 'bg-neutral-50 border-neutral-200 text-emerald-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="2999"
                  value={originalPrice}
                  onChange={e => setOriginalPrice(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl line-through focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-neutral-400' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Fabric GSM
                </label>
                <input
                  type="number"
                  placeholder="280"
                  value={gsm}
                  onChange={e => setGsm(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl font-bold focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-amber-400' 
                      : 'bg-neutral-50 border-neutral-200 text-amber-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl font-bold focus:border-amber-500 focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Product Status
                </label>
                <select
                  value={productStatus}
                  onChange={e => setProductStatus(e.target.value as any)}
                  className={`w-full px-3 py-2.5 border rounded-xl font-bold focus:border-amber-500 focus:outline-none transition ${
                    isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <option value="Active">Active (In Catalog)</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Draft">Draft (Unpublished)</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Silhouette / Cut
                </label>
                <select
                  value={fit}
                  onChange={e => setFit(e.target.value as any)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:border-amber-500 focus:outline-none transition ${
                    isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <option value="Oversized Boxy Fit">Oversized Boxy Fit</option>
                  <option value="Relaxed Fit">Relaxed Fit</option>
                  <option value="Regular Fit">Regular Fit</option>
                  <option value="Cropped Streetwear Fit">Cropped Streetwear Fit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Available Sizes */}
          <div className="space-y-2">
            <label className={`block font-bold uppercase text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Available Sizes ({sizes.length} Selected) *
            </label>
            <div className="flex flex-wrap gap-2">
              {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]).map(sz => {
                const isSelected = sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`w-14 h-10 rounded-xl font-bold text-xs transition flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 shadow-md font-black ring-2 ring-amber-500/50'
                        : isDark
                          ? 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          : 'bg-neutral-50 border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Color Variants */}
          <div className={`space-y-3 p-4 rounded-xl border ${
            isDark ? 'border-neutral-800/80 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-50/70'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Color Variants ({colors.length})</span>
              </label>
            </div>

            {/* Existing selected colors */}
            <div className="flex flex-wrap gap-2">
              {colors.map((col, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                    isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-200' : 'bg-white border-neutral-200 text-neutral-900 shadow-xs'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-500 shadow-xs"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span className="font-bold">{col.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(idx)}
                    className="text-neutral-500 hover:text-rose-500 cursor-pointer ml-1"
                    title="Remove color"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5 pt-2">
              <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Quick Streetwear Color Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleAddPresetColor(preset)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] transition cursor-pointer ${
                      isDark 
                        ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-amber-500/50' 
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-amber-500/50 shadow-xs'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: preset.hex }} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2 pt-2 text-xs">
              <input
                type="color"
                value={newColorHex}
                onChange={e => setNewColorHex(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-700 bg-transparent shrink-0"
              />
              <input
                type="text"
                placeholder="Custom color name (e.g. Washed Sage)"
                value={newColorName}
                onChange={e => setNewColorName(e.target.value)}
                className={`flex-1 px-3 py-1.5 border rounded-xl text-xs focus:outline-none ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              />
              <button
                type="button"
                onClick={handleAddCustomColor}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                Add Color
              </button>
            </div>
          </div>

          {/* Section 5: Product Imagery (Supabase Storage bucket: product-images) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Product Images (Supabase Storage: product-images)</span>
              </label>
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddImageSlot}
                  className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 cursor-pointer font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Image Slot</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {images.map((imgUrl, index) => {
                const isSlotUploading = uploadingSlot === index;
                return (
                  <div key={index} className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                      <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                        Image #{index + 1} {index === 0 && '(Primary / Cover)'}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                          <UploadCloud className="w-3 h-3" />
                          <span>{isSlotUploading ? 'Uploading...' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isSlotUploading}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, index)}
                          />
                        </label>
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageSlot(index)}
                            className="text-neutral-500 hover:text-rose-500 cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="https://... image URL or upload above"
                      value={imgUrl}
                      onChange={e => handleImageUrlChange(index, e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded-lg text-[11px] focus:outline-none font-mono ${
                        isDark 
                          ? 'bg-neutral-900 border-neutral-800 text-neutral-300' 
                          : 'bg-white border-neutral-200 text-neutral-800'
                      }`}
                    />

                    {imgUrl ? (
                      <div className={`h-32 rounded-lg overflow-hidden border relative ${
                        isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-100'
                      }`}>
                        <img
                          src={imgUrl}
                          alt={`Garment slot ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`h-32 rounded-lg border border-dashed flex flex-col items-center justify-center text-[11px] ${
                        isDark ? 'border-neutral-800 text-neutral-600' : 'border-neutral-300 text-neutral-400'
                      }`}>
                        <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                        <span>No image uploaded</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Badges & Drop Flags */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border text-xs ${
            isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={e => setIsNewArrival(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span className={`font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>New Arrival</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLimitedDrop}
                onChange={e => setIsLimitedDrop(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span className={`font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>Limited Drop</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={e => setIsTrending(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span className={`font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>Trending</span>
            </label>
          </div>

        </form>

        {/* STICKY FOOTER ACTIONS */}
        <div className={`sticky bottom-0 z-20 flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 border-t backdrop-blur-xl shrink-0 ${
          isDark ? 'border-neutral-800 bg-neutral-950/95' : 'border-neutral-200 bg-white/95 shadow-sm'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 text-xs font-bold uppercase rounded-xl border transition cursor-pointer ${
              isDark 
                ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' 
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving to Supabase...' : isEditing ? 'Update Garment' : 'Save & Publish to Supabase'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

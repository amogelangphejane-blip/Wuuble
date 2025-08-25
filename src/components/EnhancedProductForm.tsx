import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Tag,
  Eye,
  Download,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { StorageSetupHelper } from '@/components/StorageSetupHelper';
import type { CreateProductForm, UpdateProductForm, ProductCategory } from '@/types/store';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  preview?: string;
}

interface EnhancedProductFormProps {
  categories: ProductCategory[];
  initialData?: Partial<CreateProductForm>;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateProductForm | UpdateProductForm) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const EnhancedProductForm: React.FC<EnhancedProductFormProps> = ({
  categories,
  initialData,
  mode,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { toast } = useToast();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    category_id: initialData?.category_id || '',
    tags: initialData?.tags || [],
    download_limit: initialData?.download_limit || undefined,
  });

  // File upload state
  const [thumbnailFile, setThumbnailFile] = useState<FileUploadProgress | null>(null);
  const [previewFiles, setPreviewFiles] = useState<FileUploadProgress[]>([]);
  const [productFile, setProductFile] = useState<FileUploadProgress | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [storageError, setStorageError] = useState<string | null>(null);

  // File size limits (in bytes)
  const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_PREVIEW_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_PRODUCT_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_PREVIEW_FILES = 5;

  // Validation rules
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || value.length < 3) return 'Title must be at least 3 characters';
        if (value.length > 100) return 'Title must be less than 100 characters';
        return '';
      case 'description':
        if (!value || value.length < 20) return 'Description must be at least 20 characters';
        if (value.length > 2000) return 'Description must be less than 2000 characters';
        return '';
      case 'price':
        if (value < 0.01) return 'Price must be at least $0.01';
        if (value > 9999.99) return 'Price must be less than $10,000';
        return '';
      case 'category_id':
        if (!value) return 'Please select a category';
        return '';
      case 'productFile':
        if (mode === 'create' && !value) return 'Product file is required';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    file: File,
    type: 'thumbnail' | 'preview' | 'product',
    maxSize: number
  ): Promise<FileUploadProgress> => {
    // Validate file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }

    const uploadProgress: FileUploadProgress = {
      file,
      progress: 0,
      status: 'pending',
    };

    // Create preview for images
    if (file.type.startsWith('image/')) {
      uploadProgress.preview = await createFilePreview(file);
    }

    return uploadProgress;
  };

  const handleThumbnailUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Thumbnail must be an image file",
          variant: "destructive",
        });
        return;
      }

      const uploadProgress = await handleFileUpload(file, 'thumbnail', MAX_THUMBNAIL_SIZE);
      setThumbnailFile(uploadProgress);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload thumbnail";
      
      // Check if this is a storage configuration error
      if (errorMessage.includes('bucket') || errorMessage.includes('storage') || errorMessage.includes('policy')) {
        setStorageError(errorMessage);
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePreviewUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const newFiles = Array.from(files);
      
      if (previewFiles.length + newFiles.length > MAX_PREVIEW_FILES) {
        toast({
          title: "Too many files",
          description: `Maximum ${MAX_PREVIEW_FILES} preview images allowed`,
          variant: "destructive",
        });
        return;
      }

      const uploadPromises = newFiles.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        return handleFileUpload(file, 'preview', MAX_PREVIEW_SIZE);
      });

      const newUploads = await Promise.all(uploadPromises);
      setPreviewFiles(prev => [...prev, ...newUploads]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload preview images";
      
      // Check if this is a storage configuration error
      if (errorMessage.includes('bucket') || errorMessage.includes('storage') || errorMessage.includes('policy')) {
        setStorageError(errorMessage);
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleProductFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const uploadProgress = await handleFileUpload(file, 'product', MAX_PRODUCT_SIZE);
      setProductFile(uploadProgress);
      
      // Clear any existing product file error
      setErrors(prev => ({ ...prev, productFile: '' }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload product file";
      
      // Check if this is a storage configuration error
      if (errorMessage.includes('bucket') || errorMessage.includes('storage') || errorMessage.includes('policy')) {
        setStorageError(errorMessage);
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const removePreviewFile = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (formData.tags.includes(newTag)) {
      toast({
        title: "Duplicate tag",
        description: "This tag has already been added",
        variant: "destructive",
      });
      return;
    }

    if (formData.tags.length >= 10) {
      toast({
        title: "Too many tags",
        description: "Maximum 10 tags allowed",
        variant: "destructive",
      });
      return;
    }

    handleFieldChange('tags', [...formData.tags, newTag]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    handleFieldChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    // Validate product file for create mode
    if (mode === 'create') {
      const productFileError = validateField('productFile', productFile);
      if (productFileError) newErrors.productFile = productFileError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation errors",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      const submitData: CreateProductForm | UpdateProductForm = {
        ...formData,
        thumbnail_file: thumbnailFile?.file,
        preview_files: previewFiles.map(p => p.file),
        ...(mode === 'create' && { product_file: productFile!.file }),
        ...(mode === 'edit' && productFile && { product_file: productFile.file }),
      };

      await onSubmit(submitData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save product";
      
      // Check if this is a storage configuration error
      if (errorMessage.includes('bucket') || errorMessage.includes('storage') || errorMessage.includes('policy')) {
        setStorageError(errorMessage);
      }
      
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 min-h-0">
      {storageError && (
        <StorageSetupHelper 
          error={storageError} 
          onDismiss={() => setStorageError(null)}
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Fill in the details to list your digital product'
              : 'Update your product information'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Enter a descriptive title for your product"
                    className={cn(errors.title && "border-red-500")}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.title}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">{formData.title.length}/100 characters</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Describe your product, its features, and what customers will get..."
                    rows={6}
                    className={cn(errors.description && "border-red-500")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">{formData.description.length}/2000 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="9.99"
                      className={cn("pl-10", errors.price && "border-red-500")}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleFieldChange('category_id', value)}
                  >
                    <SelectTrigger className={cn(errors.category_id && "border-red-500")}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.category_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="download-limit">Download Limit (Optional)</Label>
                  <Input
                    id="download-limit"
                    type="number"
                    min="1"
                    value={formData.download_limit || ''}
                    onChange={(e) => handleFieldChange('download_limit', parseInt(e.target.value) || undefined)}
                    placeholder="Unlimited"
                  />
                  <p className="text-sm text-gray-500">Leave empty for unlimited downloads</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tags</h3>
              <div className="space-y-2">
                <Label>Product Tags</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      placeholder="Add a tag..."
                      className="pl-10"
                    />
                  </div>
                  <Button type="button" onClick={addTag} disabled={!tagInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500">{formData.tags.length}/10 tags</p>
              </div>
            </div>

            <Separator />

            {/* File Uploads */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Files</h3>

              {/* Product File */}
              <div className="space-y-2">
                <Label>Product File {mode === 'create' && '*'}</Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    "hover:border-orange-300 hover:bg-orange-50",
                    errors.productFile && "border-red-500"
                  )}
                  onClick={() => productFileInputRef.current?.click()}
                >
                  <input
                    ref={productFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleProductFileUpload(e.target.files)}
                  />
                  
                  {productFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-orange-600" />
                      <div className="text-left">
                        <p className="font-medium">{productFile.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(productFile.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900">
                        {mode === 'create' ? 'Upload Product File' : 'Replace Product File'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Click to browse or drag and drop (Max: 100MB)
                      </p>
                    </div>
                  )}
                </div>
                {errors.productFile && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.productFile}
                  </p>
                )}
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Thumbnail Image</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-orange-300 hover:bg-orange-50"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleThumbnailUpload(e.target.files)}
                  />
                  
                  {thumbnailFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={thumbnailFile.preview}
                        alt="Thumbnail"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="text-left">
                        <p className="font-medium">{thumbnailFile.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(thumbnailFile.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnailFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900">Upload Thumbnail</p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, WebP (Max: 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Images */}
              <div className="space-y-2">
                <Label>Preview Images ({previewFiles.length}/{MAX_PREVIEW_FILES})</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-orange-300 hover:bg-orange-50"
                  onClick={() => previewInputRef.current?.click()}
                >
                  <input
                    ref={previewInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePreviewUpload(e.target.files)}
                  />
                  
                  <div>
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900">Add Preview Images</p>
                    <p className="text-sm text-gray-500">
                      Show customers what they'll get (Max: {MAX_PREVIEW_FILES} images, 5MB each)
                    </p>
                  </div>
                </div>

                {previewFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewFiles.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removePreviewFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === 'create' ? 'Create Product' : 'Update Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
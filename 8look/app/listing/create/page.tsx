'use client';

import { ImagePlus, Loader2, MapPin, Trash2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import { getCurrentUser } from '@/lib/auth';
import styles from './create.module.css';

const categories = [
  { id: 1, label: 'Immovables' },
  { id: 2, label: 'Cars' },
  { id: 3, label: 'Jobs' },
  { id: 4, label: 'Tech' },
  { id: 5, label: 'Home' },
  { id: 6, label: 'Sports' },
  { id: 7, label: 'Clothing' },
];

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxImageCount = 8;
const maxImageSize = 5 * 1024 * 1024;

type PreviewImage = {
  id: string;
  file: File;
  url: string;
};

export default function CreateListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [price, setPrice] = useState('');
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [error, setError] = useState('');
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && categoryId.trim().length > 0,
    [categoryId, title],
  );

  useEffect(() => {
    let ignore = false;

    async function requireUser() {
      const user = await getCurrentUser();
      if (ignore) return;

      if (!user) {
        router.replace('/');
        return;
      }

      setIsCheckingUser(false);
    }

    void requireUser();

    return () => {
      ignore = true;
    };
  }, [router]);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [images]);

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    setError('');
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;
    const rejectedFile = selectedFiles.find((file) => !allowedImageTypes.has(file.type) || file.size > maxImageSize);

    if (rejectedFile) {
      setError('Photos must be JPG, PNG, WebP, or GIF files under 5 MB.');
      event.target.value = '';
      return;
    }

    if (images.length + selectedFiles.length > maxImageCount) {
      setError(`Upload up to ${maxImageCount} photos.`);
      event.target.value = '';
      return;
    }

    setImages((currentImages) => [
      ...currentImages,
      ...selectedFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);

    event.target.value = '';
  }

  function removeImage(imageId: string) {
    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);
      return currentImages.filter((image) => image.id !== imageId);
    });
  }

  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Title and category are required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('categoryId', categoryId);
    formData.append('price', price.trim());
    formData.append('place', place.trim());
    formData.append('description', description.trim());
    images.forEach((image) => formData.append('files', image.file));

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/listings', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/');
          return;
        }

        throw new Error(data?.error ?? 'Listing could not be created.');
      }

      router.push(data?.id ? `/listing/${data.id}` : '/');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <SiteHeader />

      {isCheckingUser ? (
        <section className={styles.createPage}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spin} size={22} aria-hidden="true" />
            <span>Checking your session</span>
          </div>
        </section>
      ) : (
      <section className={styles.createPage}>
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>New listing</p>
          <h1>Create a marketplace listing</h1>
        </div>

        <form className={styles.createForm} onSubmit={createListing}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Title</span>
              <input
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Samsung monitor, city apartment, mountain bike..."
              />
            </label>

            <label className={styles.field}>
              <span>Category</span>
              <select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Price</span>
              <input
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className={`${styles.field} ${styles.wideField}`}>
              <span>Place</span>
              <span className={styles.inputWithIcon}>
                <MapPin size={18} aria-hidden="true" />
                <input
                  maxLength={90}
                  value={place}
                  onChange={(event) => setPlace(event.target.value)}
                  placeholder="Zagreb, Split, remote..."
                />
              </span>
            </label>

            <label className={`${styles.field} ${styles.wideField}`}>
              <span>Description</span>
              <textarea
                rows={8}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Condition, dimensions, pickup details, warranty, trade options..."
              />
            </label>
          </div>

          <section className={styles.uploadPanel} aria-label="Listing photos">
            <label className={styles.uploadDropzone}>
              <UploadCloud size={28} aria-hidden="true" />
              <span>Add listing photos</span>
              <small>Optional. Up to 8 photos, 5 MB each.</small>
              <input type="file" accept="image/*" multiple onChange={addImages} />
            </label>

            {images.length > 0 ? (
              <div className={styles.previewGrid}>
                {images.map((image) => (
                  <div className={styles.previewTile} key={image.id}>
                    <img src={image.url} alt="" />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      aria-label={`Remove ${image.file.name}`}
                      title="Remove photo"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyPreview}>
                <ImagePlus size={24} aria-hidden="true" />
                <span>No photos selected</span>
              </div>
            )}
          </section>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <div className={styles.formActions}>
            <button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Loader2 className={styles.spin} size={18} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}
              {isSubmitting ? 'Creating listing' : 'Create listing'}
            </button>
          </div>
        </form>
      </section>
      )}
    </main>
  );
}

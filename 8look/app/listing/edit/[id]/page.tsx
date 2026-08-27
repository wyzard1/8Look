'use client';

import {
  ArrowLeft,
  Eye,
  ImagePlus,
  Loader2,
  MapPin,
  Save,
  Trash2,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import SiteHeader, { defaultAvatarUrl, HeaderSearch } from '@/app/components/SiteHeader';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import {
  fallbackListingImage,
  safeListingImageUrl,
  type ListingDetails,
} from '@/lib/listings';
import styles from './edit.module.css';

const categories = [
  { id: 1, label: 'Immovables' },
  { id: 2, label: 'Cars' },
  { id: 3, label: 'Jobs' },
  { id: 4, label: 'Tech' },
  { id: 5, label: 'Home' },
  { id: 6, label: 'Sports' },
  { id: 7, label: 'Clothing' },
];

type PreviewImage = {
  id: string;
  file: File;
  url: string;
};

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user: currentUser, isLoadingUser } = useAuth();

  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [price, setPrice] = useState('');
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<PreviewImage[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [isLoadingListing, setIsLoadingListing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = Boolean(currentUser && listing && currentUser.id === listing.sellerId);
  const canSubmit = title.trim().length > 0 && categoryId.trim().length > 0 && !isSubmitting;
  const visibleImages = useMemo(
    () => [
      ...existingImages.map((url) => ({ id: url, url: safeListingImageUrl(url) })),
      ...newImages.map((image) => ({ id: image.id, url: image.url })),
    ],
    [existingImages, newImages],
  );
  const previewImage = selectedImage || visibleImages[0]?.url || fallbackListingImage;

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    async function fetchListing() {
      try {
        setIsLoadingListing(true);
        setError('');

        const response = await fetch(`/api/listing/${id}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load this listing.');

        const data: ListingDetails = await response.json();
        if (ignore) return;

        setListing(data);
        setTitle(data.title ?? '');
        setCategoryId(String(data.categoryId ?? 1));
        setPrice(data.price ? String(data.price) : '');
        setPlace(data.place ?? '');
        setDescription(data.description ?? '');
        setExistingImages(data.images ?? []);
        setSelectedImage(safeListingImageUrl(data.images?.[0]));
      } catch (requestError) {
        if (!ignore) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load this listing.');
        }
      } finally {
        if (!ignore) setIsLoadingListing(false);
      }
    }

    void fetchListing();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.replace('/auth/logon');
    }
  }, [currentUser, isLoadingUser, router]);

  useEffect(() => {
    return () => {
      newImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [newImages]);

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    setNewImages((currentImages) => [
      ...currentImages,
      ...files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
    setSuccess('');
    event.target.value = '';
  }

  function removeExistingImage(imageUrl: string) {
    setExistingImages((currentImages) => currentImages.filter((image) => image !== imageUrl));
    if (selectedImage === safeListingImageUrl(imageUrl)) setSelectedImage('');
    setSuccess('');
  }

  function removeNewImage(imageId: string) {
    const removedImage = newImages.find((image) => image.id === imageId);
    setNewImages((currentImages) => currentImages.filter((candidate) => candidate.id !== imageId));
    if (removedImage) {
      URL.revokeObjectURL(removedImage.url);
      if (selectedImage === removedImage.url) setSelectedImage('');
    }
    setSuccess('');
  }

  async function updateListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!canSubmit || !id) {
      setError('Title and category are required.');
      return;
    }

    const rawPrice = price.trim();
    if (rawPrice && Number(rawPrice) <= 0) {
      setError('Enter a valid price.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('categoryId', categoryId);
    formData.append('price', rawPrice);
    formData.append('place', place.trim());
    formData.append('description', description.trim());
    existingImages.forEach((image) => formData.append('image_urls', image));
    newImages.forEach((image) => formData.append('files', image.file));

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/listing/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/auth/logon');
          return;
        }

        throw new Error(data?.error ?? 'Listing could not be updated.');
      }

      const updatedListing = data as ListingDetails;
      setListing(updatedListing);
      setExistingImages(updatedListing.images ?? []);
      setNewImages((currentImages) => {
        currentImages.forEach((image) => URL.revokeObjectURL(image.url));
        return [];
      });
      setSelectedImage(safeListingImageUrl(updatedListing.images?.[0]));
      setSuccess('Listing updated.');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteListing() {
    if (!id || !window.confirm('Delete this listing? This action cannot be undone.')) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/listing/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? 'Listing could not be deleted.');
      }

      router.push(currentUser ? `/listing/user/${currentUser.id}` : '/');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main>
      <SiteHeader search={<HeaderSearch />} />

      <section className={styles.editPage}>
        {isLoadingUser || isLoadingListing ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spin} size={22} aria-hidden="true" />
            <span>Loading editor</span>
          </div>
        ) : error && !listing ? (
          <div className={styles.emptyState}>
            <h1>Listing not available</h1>
            <p>{error}</p>
            <Link href="/">
              <ArrowLeft size={18} aria-hidden="true" />
              Back to listings
            </Link>
          </div>
        ) : !isOwner ? (
          <div className={styles.emptyState}>
            <h1>You cannot edit this listing</h1>
            <p>Only the seller who created the listing can manage its details.</p>
            <Link href={listing ? `/listing/${listing.id}` : '/'}>
              <Eye size={18} aria-hidden="true" />
              View listing
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.pageBar}>
              <div>
                <p className={styles.eyebrow}>Edit listing</p>
                <h1>Manage listing details</h1>
              </div>
              <Link className={styles.previewLink} href={`/listing/${listing?.id}`}>
                <Eye size={18} aria-hidden="true" />
                Preview
              </Link>
            </div>

            <div className={styles.editorLayout}>
              <form className={styles.editorForm} onSubmit={updateListing}>
                <section className={styles.panel} aria-labelledby="listing-info">
                  <div className={styles.panelHeading}>
                    <div>
                      <p className={styles.eyebrow}>Listing</p>
                      <h2 id="listing-info">Title, price, and location</h2>
                    </div>
                    <ImagePlus size={22} aria-hidden="true" />
                  </div>

                  <div className={styles.formGrid}>
                    <label className={`${styles.field} ${styles.wideField}`}>
                      <span>Title</span>
                      <input
                        required
                        maxLength={120}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Monitor, city apartment, mountain bike..."
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
                          placeholder="Sarajevo, Zagreb, remote..."
                        />
                      </span>
                    </label>

                    <label className={`${styles.field} ${styles.wideField}`}>
                      <span>Description</span>
                      <textarea
                        rows={8}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Condition, pickup details, warranty, trade options..."
                      />
                    </label>
                  </div>
                </section>

                <section className={styles.panel} aria-labelledby="listing-photos">
                  <div className={styles.panelHeading}>
                    <div>
                      <p className={styles.eyebrow}>Photos</p>
                      <h2 id="listing-photos">Gallery management</h2>
                    </div>
                    <UploadCloud size={22} aria-hidden="true" />
                  </div>

                  <label className={styles.uploadDropzone}>
                    <UploadCloud size={28} aria-hidden="true" />
                    <span>Add more photos</span>
                    <small>Choose one or more images.</small>
                    <input type="file" accept="image/*" multiple onChange={addImages} />
                  </label>

                  {visibleImages.length > 0 ? (
                    <div className={styles.previewGrid}>
                      {existingImages.map((image) => {
                        const imageUrl = safeListingImageUrl(image);
                        return (
                          <div className={styles.previewTile} key={image}>
                            <button
                              className={styles.previewImageButton}
                              type="button"
                              onClick={() => setSelectedImage(imageUrl)}
                              aria-label="Use existing photo in preview"
                            >
                              <img src={imageUrl} alt="" referrerPolicy="no-referrer" />
                            </button>
                            <button
                              className={styles.removeImageButton}
                              type="button"
                              onClick={() => removeExistingImage(image)}
                              aria-label="Remove existing photo"
                              title="Remove photo"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        );
                      })}

                      {newImages.map((image) => (
                        <div className={styles.previewTile} key={image.id}>
                          <button
                            className={styles.previewImageButton}
                            type="button"
                            onClick={() => setSelectedImage(image.url)}
                            aria-label={`Use ${image.file.name} in preview`}
                          >
                            <img src={image.url} alt="" />
                          </button>
                          <button
                            className={styles.removeImageButton}
                            type="button"
                            onClick={() => removeNewImage(image.id)}
                            aria-label={`Remove ${image.file.name}`}
                            title="Remove photo"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyPhotos}>No photos on this listing.</div>
                  )}
                </section>

                {error && (
                  <div className={styles.errorMessage} role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className={styles.successMessage} role="status">
                    {success}
                  </div>
                )}

                <div className={styles.formActions}>
                  <button className={styles.deleteButton} type="button" disabled={isDeleting} onClick={deleteListing}>
                    {isDeleting ? <Loader2 className={styles.spin} size={18} aria-hidden="true" /> : <Trash2 size={18} aria-hidden="true" />}
                    {isDeleting ? 'Deleting' : 'Delete'}
                  </button>
                  <button className={styles.saveButton} type="submit" disabled={!canSubmit}>
                    {isSubmitting ? <Loader2 className={styles.spin} size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                    {isSubmitting ? 'Saving' : 'Save changes'}
                  </button>
                </div>
              </form>

              <aside className={styles.sidePanel} aria-label="Listing preview and seller information">
                <div className={styles.previewCard}>
                  <div className={styles.previewImageWrap}>
                    <img
                      src={previewImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackListingImage;
                      }}
                    />
                  </div>
                  <div className={styles.previewCopy}>
                    <p>{formatPrice(price ? Number(price) : listing?.price ?? null)}</p>
                    <h2>{title || 'Untitled listing'}</h2>
                    <span>
                      <MapPin size={16} aria-hidden="true" />
                      {place || 'Location not provided'}
                    </span>
                  </div>
                </div>

                <div className={styles.sellerCard}>
                  <img
                    src={currentUser?.avatarUrl || defaultAvatarUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = defaultAvatarUrl;
                    }}
                  />
                  <div>
                    <p className={styles.eyebrow}>Seller info</p>
                    <h2>
                      <UserRound size={18} aria-hidden="true" />
                      {currentUser?.username || 'User'}
                    </h2>
                    <span>{currentUser?.phone_number || currentUser?.email || 'Contact info not set'}</span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

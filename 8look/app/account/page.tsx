'use client';

import {
  Camera,
  Check,
  KeyRound,
  Mail,
  Trash2,
  User,
  UserRound,
  X,
} from 'lucide-react';
import Image from 'next/image';
import SiteHeader, { defaultAvatarUrl} from '../components/SiteHeader';
import styles from './account.module.css';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function AccountPage() {
    const { user: currentUser, isLoadingUser, refreshUser } = useAuth();
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const avatarUrl = currentUser?.avatarUrl && currentUser.avatarUrl !== failedAvatarUrl
      ? currentUser.avatarUrl
      : defaultAvatarUrl;   

    useEffect(() => {
      if (!isLoadingUser && !currentUser) {
        router.push('/auth/logon');
      }
    }, [currentUser, isLoadingUser, router]);

    useEffect(() => {
      void refreshUser();
    }, [refreshUser]);

    async function handleDeleteAccount() {
      const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
      
      if (!confirmed) return;

      try {
        const response = await fetch('/api/deleteUser', {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to delete account');
        }

        window.alert('Your account has been deleted.');
        router.push('/auth/logon');
      } catch (error) {
        window.alert('There was an error deleting your account. Please try again later.');
      }
    }

    async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        event.target.value = '';
        window.alert('Please choose an image file.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        setIsUploadingAvatar(true);

        const response = await fetch('/api/updateAvatar', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Avatar upload failed');
        }

        setFailedAvatarUrl(null);
        await refreshUser();
      } catch {
        window.alert('Avatar could not be updated.');
      } finally {
        setIsUploadingAvatar(false);
        event.target.value = '';
      }
    }

  return (
    isLoadingUser ? (<div>Loading...</div>) : (
    <main>
      <SiteHeader/>

      <section className={styles.accountPage}>
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>Account settings</p>
          <h1>Manage your profile</h1>
          <span>Update the details people see when buying, selling, and messaging on 8look.</span>
        </div>

        <div className={styles.settingsLayout}>
          <aside className={styles.profilePanel} aria-label="Profile summary">
            <div className={styles.avatarWrap}>
              <Image
                src={avatarUrl}
                alt=""
                width={112}
                height={112}
                priority
                unoptimized
                onError={() => {
                  if (avatarUrl !== defaultAvatarUrl) {
                    setFailedAvatarUrl(avatarUrl);
                  }
                }}
              />
              <button
                type="button"
                aria-label="Change profile photo"
                title="Change profile photo"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={18} aria-hidden="true" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.avatarInput}
                onChange={handleAvatarChange}
              />
            </div>

            <div className={styles.profileCopy}>
              <h2>{currentUser?.username || 'User'}</h2>
              <p>Choose the name, avatar, and location shown beside your listings.</p>
            </div>

            <div className={styles.statusList}>
              <div>
                {currentUser?.is_verified ? (
                  <>
                    <Check size={16} aria-hidden="true" />
                    <span>Email verified</span>
                  </>
                ) : (<>
                  <X size={16} aria-hidden="true" />
                  <span>Email not verified</span>
                  </>
                )}
              </div>
            </div>
          </aside>

          <div className={styles.settingsStack}>
            <section className={styles.settingsCard} aria-labelledby="profile-settings">
              <div className={styles.cardHeading}>
                <div>
                  <p className={styles.eyebrow}>Profile</p>
                  <h2 id="profile-settings">Personal details</h2>
                </div>
                <UserRound size={22} aria-hidden="true" />
              </div>

              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.wideField}`}>
                  <span>Username</span>
                  <span className={styles.inputWithIcon}>
                    <User size={18} aria-hidden="true" />
                    <input name="username" type="text" placeholder="Your username" />
                  </span>
                </label>

              </div>
            </section>

            <section className={styles.settingsCard} aria-labelledby="contact-settings">
              <div className={styles.cardHeading}>
                <div>
                  <p className={styles.eyebrow}>Contact</p>
                  <h2 id="contact-settings">Email and security</h2>
                </div>
                <KeyRound size={22} aria-hidden="true" />
              </div>

              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.wideField}`}>
                  <span>Email address</span>
                  <span className={styles.inputWithIcon}>
                    <Mail size={18} aria-hidden="true" />
                    <input name="email" type="email" placeholder="name@example.com" />
                  </span>
                </label>

                <label className={styles.field}>
                  <span>New password</span>
                  <input name="password" type="password" placeholder="Leave blank to keep current" />
                </label>

                <label className={styles.field}>
                  <span>Confirm password</span>
                  <input name="confirmPassword" type="password" placeholder="Repeat new password" />
                </label>
              </div>
            </section>

            <div className={styles.formActions}>
              <button className={styles.deleteButton} type="button" onClick={handleDeleteAccount}>
                <Trash2 size={18} aria-hidden="true" />
                Delete account
              </button>
              <button className={styles.saveButton} type="button">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>)
  );
}

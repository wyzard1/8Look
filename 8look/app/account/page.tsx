'use client';

import {
  Camera,
  Check,
  KeyRound,
  Mail,
  Trash2,
  User,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';
import Image from 'next/image';
import SiteHeader, { defaultAvatarUrl} from '../components/SiteHeader';
import styles from './account.module.css';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

type UserUpdateDTO = {
  username?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  current_password?: string;
};

type AccountField = 'username' | 'email' | 'password' | 'confirmPassword' | 'current_password';
type FieldErrors = Partial<Record<AccountField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountPage() {
    const { user: currentUser, isLoadingUser, refreshUser } = useAuth();
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const [updateData, setUpdateData] = useState<UserUpdateDTO>({
      password: '',
      phone_number: '',
      current_password: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const avatarUrl = currentUser?.avatarUrl && currentUser.avatarUrl !== failedAvatarUrl
      ? currentUser.avatarUrl
      : defaultAvatarUrl;   
    const usernameValue = updateData.username ?? currentUser?.username ?? '';
    const emailValue = updateData.email ?? currentUser?.email ?? '';

    useEffect(() => {
      if (!isLoadingUser && !currentUser) {
        router.push('/auth/logon');
      }
    }, [currentUser, isLoadingUser, router]);

    useEffect(() => {
      void refreshUser();
    }, [refreshUser]);

    function clearMessagesFor(field: AccountField) {
      setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
      setErrorMessage(null);
      setSuccessMessage(null);
    }

    function updateField(field: keyof UserUpdateDTO, value: string) {
      setUpdateData((previous) => ({ ...previous, [field]: value }));
      clearMessagesFor(field as AccountField);
    }

    function validateAccountUpdate() {
      const errors: FieldErrors = {};
      const username = usernameValue.trim();
      const email = emailValue.trim();
      const password = updateData.password ?? '';
      const currentPassword = updateData.current_password ?? '';
      const hasChangedProfile =
        username !== (currentUser?.username ?? '') ||
        email !== (currentUser?.email ?? '') ||
        password.length > 0;

      if (!username) {
        errors.username = 'Username is required.';
      }

      if (!email) {
        errors.email = 'Email address is required.';
      } else if (!emailPattern.test(email)) {
        errors.email = 'Enter a valid email address.';
      }

      if (password && password.length < 8) {
        errors.password = 'New password must be at least 8 characters.';
      }

      if (password && password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }

      if (!password && confirmPassword) {
        errors.password = 'Enter a new password before confirming it.';
      }

      if (!currentPassword.trim()) {
        errors.current_password = 'Enter your current password to save changes.';
      }

      setFieldErrors(errors);

      if (Object.keys(errors).length > 0) {
        setErrorMessage('Check the highlighted fields and try again.');
        return null;
      }

      if (!hasChangedProfile) {
        setErrorMessage('Make at least one change before saving.');
        return null;
      }

      return {
        username,
        email,
        password,
        current_password: currentPassword,
      };
    }

    async function handleAccountUpdate() {
      const validatedData = validateAccountUpdate();

      if (!validatedData) {
        return;
      }

      try {
        setIsSaving(true);

        const response = await fetch('/api/updateUser', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validatedData),
          credentials: 'include',
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = typeof payload?.error === 'string'
            ? payload.error
            : 'There was an error updating your account.';

          if (response.status === 403) {
            setFieldErrors((previous) => ({
              ...previous,
              current_password: 'Current password is incorrect.',
            }));
          }

          throw new Error(message);
        }

        setErrorMessage(null);
        setFieldErrors({});
        setConfirmPassword('');
        setUpdateData((previous) => ({
          ...previous,
          username: undefined,
          email: undefined,
          password: '',
          current_password: '',
        }));
        setSuccessMessage('Your account has been updated.');
        await refreshUser();
      } catch (error) {
        setSuccessMessage(null);
        setErrorMessage(error instanceof Error ? error.message : 'There was an error updating your account.');
      } finally {
        setIsSaving(false);
      }

    }

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
      } catch {
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
                    <input
                      name="username"
                      type="text"
                      placeholder="Your username"
                      value={usernameValue}
                      aria-invalid={Boolean(fieldErrors.username)}
                      aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                      onChange={(e) => updateField('username', e.target.value)}
                    />
                  </span>
                  {fieldErrors.username && (
                    <span id="username-error" className={styles.fieldError}>
                      {fieldErrors.username}
                    </span>
                  )}
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
                    <input
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={emailValue}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </span>
                  {fieldErrors.email && (
                    <span id="email-error" className={styles.fieldError}>
                      {fieldErrors.email}
                    </span>
                  )}
                </label>

                <label className={styles.field}>
                  <span>New password</span>
                  <input
                    name="password"
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={updateData.password ?? ''}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                  {fieldErrors.password && (
                    <span id="password-error" className={styles.fieldError}>
                      {fieldErrors.password}
                    </span>
                  )}
                </label>

                <label className={styles.field}>
                  <span>Confirm password</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearMessagesFor('confirmPassword');
                    }}
                  />
                  {fieldErrors.confirmPassword && (
                    <span id="confirm-password-error" className={styles.fieldError}>
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </label>
              </div>
            </section>

            <section className={styles.settingsCard} aria-labelledby="delete-account">
              <div className={styles.cardHeading}>
                <div>
                  <p className={styles.eyebrow}>Credentials</p>
                </div>
                <UserCheck size={22} aria-hidden="true" />
              </div>

              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.wideField}`}>
                  <span>Current password</span>
                  <input
                    name="currentPassword"
                    type="password"
                    placeholder="Enter current password to save changes"
                    value={updateData.current_password ?? ''}
                    aria-invalid={Boolean(fieldErrors.current_password)}
                    aria-describedby={fieldErrors.current_password ? 'current-password-error' : undefined}
                    onChange={(e) => updateField('current_password', e.target.value)}
                  />
                  {fieldErrors.current_password && (
                    <span id="current-password-error" className={styles.fieldError}>
                      {fieldErrors.current_password}
                    </span>
                  )}
                </label>
              </div>
            </section>

            {errorMessage && (
              <div className={styles.errorMessage} role="alert">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className={styles.successMessage} role="status">
                {successMessage}
              </div>
            )}

            <div className={styles.formActions}>
              <button className={styles.deleteButton} type="button" onClick={handleDeleteAccount}>
                <Trash2 size={18} aria-hidden="true" />
                Delete account
              </button>
              <button className={styles.saveButton} type="button" disabled={isSaving} onClick={handleAccountUpdate}>
                {isSaving ? 'Saving' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>)
  );
}

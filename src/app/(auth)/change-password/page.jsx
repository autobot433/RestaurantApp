"use client";

import styles from "./page.module.css";

export default function ChangePasswordPage() {
  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <h1 className={styles.title}>Change Password</h1>
        <p className={styles.subtitle}>
          Update your password to keep your Ahar account secure.
        </p>
      </section>
    </main>
  );
}


"use client";

import styles from "./page.module.css";

export default function LoginMagicLinkPage() {
  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <h1 className={styles.title}>Login with Magic Link</h1>
        <p className={styles.subtitle}>
          Enter your email address and we&apos;ll send you a secure, one-time
          magic link to sign in.
        </p>
      </section>
    </main>
  );
}


"use client";

import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <h1 className={styles.title}>Login</h1>
        <p className={styles.subtitle}>
          Sign in to access your Ahar account, track orders, and manage rewards.
        </p>
      </section>
    </main>
  );
}


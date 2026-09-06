"use client";

import styles from "./page.module.css";

export default function LoginPhonePage() {
  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <h1 className={styles.title}>Login with Phone</h1>
        <p className={styles.subtitle}>
          Enter your mobile number to receive a one-time passcode and access your
          Ahar account.
        </p>
      </section>
    </main>
  );
}


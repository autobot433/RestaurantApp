"use client";

import styles from "./page.module.css";

export default function SignupPage() {
  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <h1 className={styles.title}>Create an Account</h1>
        <p className={styles.subtitle}>
          Join Ahar to earn rewards, save your favorites, and track every order.
        </p>
      </section>
    </main>
  );
}


import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className={styles.wrap}>
      <section className={`card ${styles.cardBox}`}>
        <Link href="/" className={styles.brand}>
          Freshly
        </Link>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </section>
    </div>
  );
}

import Link from "../../link";
import styles from "./styles.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.header_container}>
        <h1 className={styles.logo}>ChessMeet</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;

import { Link as RouterLink } from "react-router-dom";
import styles from "./styles.module.css";

function Link({ to, children }) {
  return (
    <RouterLink className={styles.link} to={to}>
      {children}
    </RouterLink>
  );
}

export default Link;

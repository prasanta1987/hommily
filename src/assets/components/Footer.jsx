import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { currentUser } = useAuth();

  return (
    <footer>
      <div className="container">
        <p className="text-center">
          {currentUser ? `Logged in as ${currentUser.email}` : "You are not logged in"}
        </p>
      </div>
    </footer>
  );
}

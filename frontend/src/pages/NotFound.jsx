import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
      <div className="text-center">
        <p className="text-8xl mb-4">🍽️</p>
        <h1 className="font-display text-6xl font-extrabold gradient-text mb-4">
          404
        </h1>
        <p className="text-xl text-gray-500 mb-8">
          Oops! This page isn't on the menu.
        </p>
        <Link to="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;

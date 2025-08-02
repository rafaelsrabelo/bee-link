export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-primary text-content-body flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-content-headline mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-accent-purple mb-4">
          Page Not Found
        </h2>
        <p className="text-content-placeholder mb-8">
          The page you are looking for doesn't exist.
        </p>
        <a
          href="/"
          className="bg-accent-purple text-white px-6 py-3 rounded-lg hover:bg-opacity-80 transition-all"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
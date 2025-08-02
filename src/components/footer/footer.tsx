export const Footer = () => {
  return (
    <footer className="bg-background-primary border-t border-border-primary py-3">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center text-xs text-content-placeholder leading-tight">
          <span className="mr-4">© 2025 Bee Coders Club</span>
          <a href="/politica-privacidade" className="mr-2 hover:text-content-body">Privacidade</a>
          <span className="mr-2">•</span>
          <a href="/termos-servico" className="mr-4 hover:text-content-body">Termos</a>
          <span>Feito com <span className="text-accent-pink">❤️</span> pela Bee Coders</span>
        </div>
      </div>
    </footer>
  );
}
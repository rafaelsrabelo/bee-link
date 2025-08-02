import Button from "../ui/button";

export default function Header() {
  return (
    <header className="bg-background-primary">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-content-headline text-xl font-bold">bee-link</h3>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost">Minha Página</Button>
          <Button>Entrar</Button>
        </div>
      </div>
    </header>
  );
}
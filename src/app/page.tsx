import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background-primary text-content-body">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-content-headline mb-8">
          Welcome to Bee Link
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background-secondary border border-border-primary rounded-lg p-6">
            <h2 className="text-xl font-semibold text-accent-purple mb-4">
              Purple Card
            </h2>
            <p className="text-content-body">
              This card uses the custom purple accent color.
            </p>
          </div>
          
          <div className="bg-background-secondary border border-border-primary rounded-lg p-6">
            <h2 className="text-xl font-semibold text-accent-green mb-4">
              Green Card
            </h2>
            <p className="text-content-body">
              This card uses the custom green accent color.
            </p>
          </div>
          
          <div className="bg-background-secondary border border-border-primary rounded-lg p-6">
            <h2 className="text-xl font-semibold text-accent-pink mb-4">
              Pink Card
            </h2>
            <p className="text-content-body">
              This card uses the custom pink accent color.
            </p>
          </div>
        </div>
        
        <div className="mt-8 bg-background-tertiary border border-border-secondary rounded-lg p-6">
          <h3 className="text-lg font-semibold text-content-headline mb-4">
            Color Palette Test
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background-primary h-16 rounded border border-border-tertiary flex items-center justify-center">
              <span className="text-xs text-content-placeholder">Primary</span>
            </div>
            <div className="bg-background-secondary h-16 rounded border border-border-tertiary flex items-center justify-center">
              <span className="text-xs text-content-placeholder">Secondary</span>
            </div>
            <div className="bg-background-tertiary h-16 rounded border border-border-tertiary flex items-center justify-center">
              <span className="text-xs text-content-placeholder">Tertiary</span>
            </div>
            <div className="bg-accent-purple h-16 rounded border border-border-tertiary flex items-center justify-center">
              <span className="text-xs text-white">Accent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

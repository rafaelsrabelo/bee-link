import { TotalVisits } from "../commons/total-visits"
import UserCard from "../commons/user-card"
import Button from "../ui/button"
import TextInput from "../ui/text-input"

export const Hero = () => {
  return (
    <div className="min-h-[60vh]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        {/* Seção de Texto */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 md:gap-6 justify-center px-4 md:px-8 py-12 lg:py-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-content-headline text-center lg:text-left">
          Sua loja e redes sociais em um único link
        </h1>
        <h2 className="text-lg md:text-xl leading-relaxed text-content-body max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
          Centralize produtos, redes sociais e contatos em uma página profissional.
          <br />
          Acompanhe o engajamento com Analytics de cliques
        </h2>
        
        {/* Input responsivo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full mt-6 md:mt-8">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-content-body text-sm md:text-lg font-medium whitespace-nowrap">
              bee-link.beecoders.club/
            </span>
            <TextInput 
              placeholder="minha-loja" 
              className="flex-1 min-w-0"
            />
          </div>
          <Button className="w-full sm:w-auto whitespace-nowrap">
            Criar agora
          </Button>
        </div>
      </div>

      {/* Seção do Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center  py-12 lg:py-16">
        <div className="relative w-full max-w-md px-4">
          <UserCard />
          <div className="absolute -bottom-4 -right-8 hidden lg:block z-10">
            <TotalVisits />
          </div>
          <div className="absolute top-[20%] -left-[45%] -z-10 hidden lg:block">
            {/* <ProjectCard /> */}
          </div>
          <div className="absolute -top-[5%] -left-[55%] -z-10 hidden lg:block">
            {/* <ProjectCard /> */}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
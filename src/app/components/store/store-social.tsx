'use client';

import { ExternalLink, Instagram, MessageCircle } from 'lucide-react';
import type { StoreData } from '../../[slug]/data';

interface StoreSocialProps {
  store: StoreData;
}

export function StoreSocial({ store }: StoreSocialProps) {
  const socialLinks = [
    {
      platform: 'Instagram',
      username: store.social_networks.instagram,
      url: `https://instagram.com/${store.social_networks.instagram}`,
      icon: Instagram,
      color: 'from-pink-500 to-yellow-500',
      description: 'Siga-nos no Instagram para ver nossos últimos trabalhos'
    },
    {
      platform: 'WhatsApp',
      username: store.social_networks.whatsapp,
      url: `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`,
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      description: 'Entre em contato direto conosco'
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-background-secondary to-background-tertiary">
      <div className="max-w-4xl mx-auto">
        {/* Header da seção */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-content-headline mb-4">
            Conecte-se Conosco
          </h2>
          <p className="text-lg text-content-body">
            Siga nossas redes sociais e fique por dentro de todas as novidades
          </p>
        </div>

        {/* Grid de redes sociais */}
        <div className="grid md:grid-cols-2 gap-6">
          {socialLinks.map((social) => {
            const IconComponent = social.icon;
            
            return (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  {/* Background gradient sutil */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${social.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    {/* Ícone da rede social */}
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${social.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent size={32} />
                    </div>

                    {/* Informações */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-content-headline mb-2 flex items-center gap-2">
                          {social.platform}
                          <ExternalLink size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-content-body">{social.description}</p>
                      </div>

                      {/* Username/número */}
                      <div className="flex items-center gap-3 p-4 bg-background-tertiary rounded-xl">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${social.color}`} />
                        <span className="font-mono text-content-headline">
                          {social.platform === 'Instagram' ? `@${social.username}` : social.username}
                        </span>
                      </div>

                      {/* Call to action */}
                      <div className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${social.color} text-white rounded-full font-semibold group-hover:shadow-lg transition-all duration-300`}>
                        <span>
                          {social.platform === 'Instagram' ? 'Seguir' : 'Conversar'}
                        </span>
                        <ExternalLink size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Seção de engajamento */}
        <div className="mt-16 text-center">
          <div className="inline-block p-8 bg-white rounded-3xl shadow-lg border border-border-primary">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Estatísticas fictícias */}
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-purple">150+</div>
                  <div className="text-sm text-content-placeholder">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-green">50+</div>
                  <div className="text-sm text-content-placeholder">Produtos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-pink">100+</div>
                  <div className="text-sm text-content-placeholder">Clientes</div>
                </div>
              </div>
              
              <div className="text-left">
                <h4 className="font-bold text-content-headline mb-2">
                  Faça parte da nossa comunidade!
                </h4>
                <p className="text-content-body text-sm">
                  Compartilhe suas fotos usando nossas peças
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
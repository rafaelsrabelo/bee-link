'use client';

import { Check, Clock, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import type { StoreData } from '../../[slug]/data';

interface StoreContactProps {
  store: StoreData;
}

export function StoreContact({ store }: StoreContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Criar mensagem para WhatsApp
    const whatsappMessage = `Olá ${store.store_name}! Meu nome é ${formData.name}. ${formData.message}`;
    const whatsappUrl = `https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Mostrar confirmação
    setIsSubmitted(true);
    
    // Reset form após 3 segundos
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Resposta rápida',
      value: store.social_networks.whatsapp,
      action: () => window.open(`https://wa.me/${store.social_networks.whatsapp.replace(/[^\d]/g, '')}`, '_blank')
    },
    {
      icon: MapPin,
      title: 'Localização',
      description: 'Fortaleza, CE',
      value: 'Entregas na região',
      action: null
    },
    {
      icon: Clock,
      title: 'Horário',
      description: 'Seg - Sex',
      value: '9h às 18h',
      action: null
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-background-primary to-background-secondary">
      <div className="max-w-6xl mx-auto">
        {/* Header da seção */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-content-headline mb-4">
            Entre em Contato
          </h2>
          <p className="text-lg text-content-body max-w-2xl mx-auto">
            Estamos aqui para tirar suas dúvidas e ajudar você a encontrar a peça perfeita
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Formulário de contato */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-border-primary">
              <h3 className="text-2xl font-bold text-content-headline mb-6">
                Envie uma Mensagem
              </h3>
              
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-content-body mb-2">
                      Seu nome
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-background-secondary text-content-headline placeholder:text-content-placeholder rounded-xl border border-border-primary hover:border-border-secondary focus:border-accent-purple focus:outline-none transition-all duration-200"
                      placeholder="Como podemos te chamar?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-content-body mb-2">
                      Sua mensagem
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 bg-background-secondary text-content-headline placeholder:text-content-placeholder rounded-xl border border-border-primary hover:border-border-secondary focus:border-accent-purple focus:outline-none transition-all duration-200 resize-none"
                      placeholder="Conte-nos sobre o que você está procurando..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-4 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Send size={20} />
                    Enviar via WhatsApp
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-content-headline mb-2">
                    Mensagem Enviada!
                  </h4>
                  <p className="text-content-body">
                    Você será redirecionado para o WhatsApp para continuar a conversa.
                  </p>
                </div>
              )}
            </div>

            {/* Decoração */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-accent-purple to-accent-pink rounded-3xl opacity-10 -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-accent-green to-accent-pink rounded-3xl opacity-5 -z-10" />
          </div>

          {/* Informações de contato */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-content-headline mb-6">
                Outras Formas de Contato
              </h3>
              <p className="text-content-body mb-8">
                Escolha a forma que for mais conveniente para você. Estamos sempre prontos para atender!
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((contact, index) => {
                const IconComponent = contact.icon;
                
                return (
                  <div
                    key={`contact-${contact.title}`}
                    className={`flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg border border-border-primary transition-all duration-300 ${
                      contact.action ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''
                    }`}
                    onClick={contact.action || undefined}
                    onKeyDown={contact.action ? (e) => e.key === 'Enter' && contact.action?.() : undefined}
                    role={contact.action ? 'button' : undefined}
                    tabIndex={contact.action ? 0 : undefined}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl flex items-center justify-center">
                        <IconComponent size={24} className="text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-content-headline">{contact.title}</h4>
                      <p className="text-sm text-content-placeholder">{contact.description}</p>
                      <p className="text-content-body font-medium">{contact.value}</p>
                    </div>

                    {contact.action && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-background-tertiary rounded-lg flex items-center justify-center">
                          <span className="text-content-body">→</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Call to action adicional */}
            <div className="bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 rounded-2xl p-6 border border-border-primary">
              <h4 className="font-bold text-content-headline mb-2">
                💡 Dica Especial
              </h4>
              <p className="text-content-body text-sm">
                Mencionando que veio pelo nosso link, você ganha desconto especial na primeira compra!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
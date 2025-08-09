'use client';

import { AlertTriangle, Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PrintSettings {
  default_printer?: string;
  auto_print?: boolean;
  print_format?: 'thermal' | 'a4';
  paper_width?: number;
  auto_cut?: boolean;
  print_logo?: boolean;
  print_address?: boolean;
}

interface BotaoImprimirProps {
  orderId: string;
  orderNumber?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  directPrint?: boolean; // Se true, imprime direto sem abrir janela
  printSettings?: PrintSettings | null; // Configurações da loja
}

export default function BotaoImprimir({
  orderId,
  orderNumber,
  className = '',
  variant = 'outline',
  size = 'md',
  showText = true,
  directPrint = false,
  printSettings
}: BotaoImprimirProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    if (!orderId) {
      toast.error('ID do pedido não fornecido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chamar a API de impressão
      const response = await fetch('/api/imprimir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar impressão');
      }

      const { content } = await response.json();

      if (directPrint) {
        // Impressão direta silenciosa
        printDirectly(content, orderNumber);
        toast.success('Enviado para impressão!');
      } else {
        // Abrir janela de impressão com opções
        printContent(content, orderNumber);
        toast.success('Conteúdo de impressão gerado com sucesso!');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro ao imprimir: ${errorMessage}`);
      console.error('Erro ao imprimir pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const printDirectly = (content: string, orderNum?: string) => {
    // Verificar se há impressora configurada
    const defaultPrinter = printSettings?.default_printer;
    const shouldAutoPrint = printSettings?.auto_print && defaultPrinter;
    const paperFormat = printSettings?.print_format || 'thermal';
    
    // Criar elemento invisível para impressão direta
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.visibility = 'hidden';
    
    document.body.appendChild(printFrame);
    
    // Configurar tamanho do papel baseado nas configurações
    const pageSize = paperFormat === 'thermal' ? '80mm auto' : 'A4';
    const fontSize = paperFormat === 'thermal' ? '14px' : '14px'; // Aumentar fonte
    const lineHeight = paperFormat === 'thermal' ? '1.3' : '1.4'; // Melhor espaçamento
    
    // Conteúdo HTML otimizado para impressão com melhor qualidade
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão Pedido ${orderNum || ''}</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: ${paperFormat === 'thermal' ? '3mm' : '10mm'};
              size: ${pageSize};
            }
            
            body {
              font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
              font-size: ${fontSize};
              line-height: ${lineHeight};
              margin: 0;
              padding: 5px;
              color: #000;
              background: #fff;
              font-weight: 500;
              text-rendering: optimizeLegibility;
              -webkit-font-smoothing: antialiased;
              ${paperFormat === 'thermal' ? 'width: 74mm; max-width: 74mm;' : 'max-width: 210mm;'}
            }
            
            .print-content {
              white-space: pre-line;
              word-wrap: break-word;
              overflow-wrap: break-word;
              letter-spacing: 0.2px;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-size: ${fontSize} !important;
                transform: scale(1.0);
                zoom: 100%;
              }
              
              .print-content {
                font-size: ${fontSize} !important;
                line-height: ${lineHeight} !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-content">${content}</div>
          <script>
            window.onload = function() {
              // Configurar impressão automática avançada
              ${shouldAutoPrint && defaultPrinter ? `
                console.log('🖨️ Configuração de impressão automática ativa');
                console.log('📱 Impressora configurada: ${defaultPrinter}');
                
                // Tentar configurar impressora específica usando APIs mais modernas
                if (typeof window.print === 'function') {
                  // Configurar opções de impressão se disponível
                  const printOptions = {
                    silent: true,
                    printBackground: true,
                    deviceName: '${defaultPrinter}',
                    color: false,
                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                    landscape: false,
                    scaleFactor: 100
                  };
                  
                  // Tentar usar API moderna se disponível
                  if (window.electronAPI) {
                    window.electronAPI.print(printOptions);
                  } else if (window.chrome && window.chrome.runtime) {
                    // Para extensões Chrome
                    console.log('🖨️ Tentando impressão via Chrome API');
                  }
                }
              ` : ''}
              
              // Aguardar carregamento e imprimir com tempo otimizado
              setTimeout(() => {
                // Forçar re-layout antes da impressão
                document.body.offsetHeight;
                
                // Imprimir com configurações otimizadas
                const beforePrint = () => {
                  document.body.style.zoom = '100%';
                  document.body.style.transform = 'scale(1.0)';
                };
                
                window.addEventListener('beforeprint', beforePrint);
                window.print();
                window.removeEventListener('beforeprint', beforePrint);
                
                // Cleanup melhorado
                setTimeout(() => {
                  const frames = parent.document.querySelectorAll('iframe[style*="visibility: hidden"], iframe[style*="position: absolute"]');
                  frames.forEach(frame => {
                    if (frame.parentNode) {
                      frame.parentNode.removeChild(frame);
                    }
                  });
                }, 1500);
              }, ${shouldAutoPrint ? '300' : '800'});
            };
            
            // Prevenir problemas de encoding
            document.addEventListener('DOMContentLoaded', function() {
              document.charset = 'UTF-8';
            });
          </script>
        </body>
      </html>
    `;

    // Escrever conteúdo no iframe
    if (printFrame.contentDocument) {
      printFrame.contentDocument.open();
      printFrame.contentDocument.write(htmlContent);
      printFrame.contentDocument.close();
    }

    // Log para debug
    if (shouldAutoPrint && defaultPrinter) {
      console.log('🖨️ Impressão automática ativada:', defaultPrinter);
    }
  };

  const printContent = (content: string, orderNum?: string) => {
    // Criar nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    
    if (!printWindow) {
      toast.error('Pop-up bloqueado. Permita pop-ups para imprimir.');
      return;
    }

    // Conteúdo HTML para impressão
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão Pedido ${orderNum || ''}</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 10mm;
              size: 80mm auto; /* Largura de impressora térmica */
            }
            
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
            }
            
            .print-content {
              white-space: pre-line;
              max-width: 100%;
              overflow-wrap: break-word;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
            }
            
            .print-actions {
              margin: 20px 0;
              text-align: center;
              gap: 10px;
              display: flex;
              justify-content: center;
            }
            
            .btn {
              padding: 10px 20px;
              margin: 0 5px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            }
            
            .btn-primary {
              background: #3b82f6;
              color: white;
            }
            
            .btn-secondary {
              background: #6b7280;
              color: white;
            }
            
            .btn:hover {
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="print-actions no-print">
            <button class="btn btn-primary" onclick="window.print()">
              🖨️ Imprimir
            </button>
            <button class="btn btn-secondary" onclick="downloadAsText()">
              💾 Baixar TXT
            </button>
            <button class="btn btn-secondary" onclick="window.close()">
              ❌ Fechar
            </button>
          </div>
          
          <div class="print-content">${content}</div>
          
          <script>
            function downloadAsText() {
              const content = \`${content.replace(/`/g, '\\`')}\`;
              const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'pedido-${orderNum || orderId}.txt';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
            
            // Auto-focus para impressão
            window.onload = function() {
              // Auto-print em alguns segundos se desejar
              // setTimeout(() => window.print(), 1000);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  // Estilos base
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variantes de estilo
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  
  // Tamanhos
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const buttonStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handlePrint}
        disabled={loading}
        className={buttonStyles}
        title={`Imprimir pedido ${orderNumber || ''}`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
        ) : (
          <Printer className={`${showText ? 'mr-2' : ''} h-4 w-4`} />
        )}
        {showText && (
          <span>
            {loading ? 'Imprimindo...' : 'Imprimir'}
          </span>
        )}
      </button>

      {/* Mostrar erro se houver */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs min-w-64 z-10">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Erro na impressão:</p>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-xs mt-1 underline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

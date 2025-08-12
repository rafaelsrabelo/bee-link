/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distância em linha reta em quilômetros
  
  // Aplicar fator de correção para rotas reais (aproximadamente 1.3x para rotas urbanas)
  const realDistance = distance * 1.3;
  
  return Math.round(realDistance * 10) / 10; // Arredonda para 1 casa decimal
}

/**
 * Converte endereço em coordenadas usando a API do Google Geocoding
 * @param address Endereço para geocodificar
 * @returns Promise com latitude e longitude
 */
export async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  try {
    console.log('🔍 Geocodificando:', address);
    
    // Criar um controller para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BeeLink/1.0'
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('❌ Erro na resposta da API:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('📡 Resposta da API:', data);
    
    if (data && data.length > 0) {
      const coords = {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon)
      };
      console.log('✅ Coordenadas encontradas:', coords);
      return coords;
    }
    
    console.log('❌ Nenhuma coordenada encontrada para:', address);
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏰ Timeout ao geocodificar endereço:', address);
    } else {
      console.error('❌ Erro ao geocodificar endereço:', address, error);
    }
    return null;
  }
}

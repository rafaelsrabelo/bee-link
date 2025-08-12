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
    // Para produção, você precisaria de uma API key do Google
    // Por enquanto, vamos usar uma API gratuita
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
}

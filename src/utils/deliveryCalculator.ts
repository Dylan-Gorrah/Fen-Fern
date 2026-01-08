// Business address coordinates
const BUSINESS_LAT = -34.1156;
const BUSINESS_LNG = 18.8739;
// This is 105 7th Street, Rusthof, Strand, 7140

// Delivery Options Configuration
const DELIVERY_CONFIG = {
  // Local hand delivery zones
  zones: {
    local: {
      maxKm: 20,
      fee: 0, // FREE (built into product price)
      label: "FREE Local Delivery",
      description: "Hand delivered within 2-3 days"
    },
    medium: {
      minKm: 21,
      maxKm: 35,
      fee: 50,
      label: "Extended Delivery",
      description: "Hand delivered within 3-5 days"
    },
    far: {
      minKm: 36,
      maxKm: 50,
      fee: 100,
      label: "Greater Cape Town",
      description: "Hand delivered within 5-7 days"
    }
  },
  
  // Courier options for far/nationwide
  courier: {
    pudo: {
      fee: 65,
      label: "Pudo Locker",
      description: "Collect from nearest Pudo locker (3-5 days)",
      minDistanceKm: 50, // Offer this option beyond 50km
      nationwide: true
    },
    paxi: {
      fee: 60,
      label: "Paxi Collection",
      description: "Collect from nearest PEP store (7-9 days)",
      minDistanceKm: 50,
      nationwide: true
    }
  }
};

export interface DeliveryOption {
  type: 'hand-delivery' | 'pudo' | 'paxi';
  cost: number;
  label: string;
  description: string;
  distance?: number;
  duration?: string;
  recommended?: boolean;
}

interface DeliveryResult {
  distance: number; // in km
  drivingDuration: string; // estimated driving time
  options: DeliveryOption[]; // all available delivery options
  isFarDistance: boolean; // true if beyond hand-delivery range
}

/**
 * Determine which delivery zone applies based on distance
 */
const getDeliveryZone = (distanceKm: number) => {
  const { zones } = DELIVERY_CONFIG;
  
  if (distanceKm <= zones.local.maxKm) {
    return { ...zones.local, type: 'local' };
  } else if (distanceKm >= zones.medium.minKm && distanceKm <= zones.medium.maxKm) {
    return { ...zones.medium, type: 'medium' };
  } else if (distanceKm >= zones.far.minKm && distanceKm <= zones.far.maxKm) {
    return { ...zones.far, type: 'far' };
  }
  
  return null; // Beyond hand-delivery range
};

/**
 * Get all available delivery options based on distance
 */
export const getDeliveryOptions = (distanceKm: number, drivingDuration?: string): DeliveryOption[] => {
  const options: DeliveryOption[] = [];
  const zone = getDeliveryZone(distanceKm);
  
  // Add hand-delivery option if within range
  if (zone) {
    options.push({
      type: 'hand-delivery',
      cost: zone.fee,
      label: zone.label,
      description: zone.description,
      distance: distanceKm,
      duration: drivingDuration,
      recommended: true
    });
  }
  
  // Add courier options if distance qualifies
  const { courier } = DELIVERY_CONFIG;
  
  // Always offer Paxi/Pudo as alternatives for 50km+
  if (distanceKm >= courier.pudo.minDistanceKm) {
    options.push({
      type: 'pudo',
      cost: courier.pudo.fee,
      label: courier.pudo.label,
      description: courier.pudo.description,
      recommended: !zone // Recommend if no hand-delivery available
    });
    
    options.push({
      type: 'paxi',
      cost: courier.paxi.fee,
      label: courier.paxi.label,
      description: courier.paxi.description,
      recommended: false
    });
  }
  
  return options;
};

/**
 * Get nationwide delivery options (for when address is unknown/very far)
 */
export const getNationwideDeliveryOptions = (): DeliveryOption[] => {
  const { courier } = DELIVERY_CONFIG;
  
  return [
    {
      type: 'pudo',
      cost: courier.pudo.fee,
      label: courier.pudo.label,
      description: courier.pudo.description + " (Nationwide)",
      recommended: true
    },
    {
      type: 'paxi',
      cost: courier.paxi.fee,
      label: courier.paxi.label,
      description: courier.paxi.description + " (Nationwide)",
      recommended: false
    }
  ];
};

/**
 * Calculate distance and get delivery options using Google Distance Matrix API
 */
export const calculateDeliveryDistance = async (
  destinationLat: number,
  destinationLng: number
): Promise<DeliveryResult> => {
  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [{ lat: BUSINESS_LAT, lng: BUSINESS_LNG }],
        destinations: [{ lat: destinationLat, lng: destinationLng }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0].elements[0];
          
          if (element.status === 'OK') {
            const distanceKm = element.distance.value / 1000; // Convert meters to km
            const roundedDistance = parseFloat(distanceKm.toFixed(1));
            const drivingDuration = element.duration.text;
            
            // Get all available delivery options
            const options = getDeliveryOptions(roundedDistance, drivingDuration);
            
            // Check if it's far (beyond hand-delivery or 50km+)
            const isFarDistance = roundedDistance >= DELIVERY_CONFIG.courier.pudo.minDistanceKm;

            resolve({
              distance: roundedDistance,
              drivingDuration,
              options,
              isFarDistance,
            });
          } else {
            reject(new Error('Could not calculate distance'));
          }
        } else {
          reject(new Error('Distance Matrix request failed'));
        }
      }
    );
  });
};

/**
 * Format delivery option for WhatsApp message
 */
export const formatDeliveryForWhatsApp = (option: DeliveryOption, distance?: number): string => {
  let message = `*Delivery Option:* ${option.label}\n`;
  message += `*Cost:* R${option.cost}\n`;
  message += `*Details:* ${option.description}\n`;
  
  if (distance && option.type === 'hand-delivery') {
    message += `*Distance:* ${distance}km\n`;
  }
  
  if (option.type === 'pudo') {
    message += `*Note:* Customer collects from nearest Pudo locker\n`;
  } else if (option.type === 'paxi') {
    message += `*Note:* Customer collects from nearest PEP store\n`;
  }
  
  return message;
};

// Export configuration for UI components
export { DELIVERY_CONFIG };
import React, { useState, useEffect } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  value: string;
  onChange: (value: string) => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  value,
  onChange,
}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  // Fix Google Maps z-index issue when component loads
  useEffect(() => {
    const fixGoogleMapsZIndex = () => {
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        (container as HTMLElement).style.zIndex = '99999';
      });
    };

    // Initial fix
    fixGoogleMapsZIndex();
    
    // Set up interval to catch dynamically created containers
    const interval = setInterval(fixGoogleMapsZIndex, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const address = place.formatted_address || '';
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onAddressSelect(address, lat, lng);
      }
    }
  };

  if (loadError) {
    return <div className="text-red-400 text-sm">Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div className="text-white/50 text-sm">Loading...</div>;
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        componentRestrictions: { country: "za" }, // Restrict to South Africa
        fields: ["formatted_address", "geometry"],
      }}
    >
      <Input
        placeholder="Start typing your address..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
      />
    </Autocomplete>
  );
};

export default AddressAutocomplete;

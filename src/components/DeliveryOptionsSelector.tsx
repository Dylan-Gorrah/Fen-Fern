import React from 'react';
import { Check, Package, MapPin, Store } from 'lucide-react';
import { DeliveryOption } from '@/utils/deliveryCalculator';

interface DeliveryOptionsSelectorProps {
  options: DeliveryOption[];
  selectedOption: DeliveryOption | null;
  onSelectOption: (option: DeliveryOption) => void;
  distance?: number;
}

const DeliveryOptionsSelector: React.FC<DeliveryOptionsSelectorProps> = ({
  options,
  selectedOption,
  onSelectOption,
  distance,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'hand-delivery':
        return <MapPin className="w-5 h-5" />;
      case 'pudo':
        return <Package className="w-5 h-5" />;
      case 'paxi':
        return <Store className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-medium">Choose Delivery Method</h3>
        {distance && (
          <span className="text-white/50 text-sm">
            {distance}km away
          </span>
        )}
      </div>

      {options.map((option, index) => (
        <div
          key={index}
          onClick={() => onSelectOption(option)}
          className={`
            relative p-4 rounded-xl cursor-pointer transition-all duration-300
            ${
              selectedOption?.type === option.type
                ? 'bg-white/20 border-2 border-white/40 shadow-lg'
                : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20'
            }
          `}
        >
          {/* Recommended Badge */}
          {option.recommended && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              Recommended
            </div>
          )}

          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`
                p-2 rounded-lg mt-1
                ${
                  selectedOption?.type === option.type
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/60'
                }
              `}
            >
              {getIcon(option.type)}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-white font-medium">{option.label}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-lg">
                    {option.cost === 0 ? 'FREE' : `R${option.cost}`}
                  </span>
                  {selectedOption?.type === option.type && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-white/70 text-sm mb-2">{option.description}</p>

              {/* Additional Details */}
              {option.type === 'hand-delivery' && option.duration && (
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span>⏱️ ~{option.duration} drive</span>
                </div>
              )}

              {option.type === 'pudo' && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg">
                  <p className="text-white/60 text-xs">
                    📍 Find your nearest Pudo locker at{' '}
                    <a
                      href="https://www.pudo.co.za/find-a-locker/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      pudo.co.za
                    </a>
                  </p>
                </div>
              )}

              {option.type === 'paxi' && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg">
                  <p className="text-white/60 text-xs">
                    📍 Collect from any PEP store nationwide
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Info Message for Far Distances */}
      {options.some(opt => opt.type !== 'hand-delivery') && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
          <p className="text-blue-200 text-xs">
            ℹ️ <strong>Nationwide delivery available!</strong> Choose Paxi or Pudo for convenient 
            collection anywhere in South Africa.
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryOptionsSelector;

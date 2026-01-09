import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, CheckCircle, Camera, X } from "lucide-react";
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { calculateDeliveryDistance } from '@/utils/deliveryCalculator';

interface OrderDetails {
  letter: string;
  size: string;
  boxColor: string;
  location: string;
  customMessage: string;
}

const CustomLetterForm = ({ onClose }: { onClose: () => void }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    letter: '',
    size: '',
    boxColor: '',
    location: '',
    customMessage: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number>(0);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [customerCoordinates, setCustomerCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Calculate price based on size
  const calculatePrice = () => {
    if (!orderDetails.size) return 0;
    
    let productPrice = 0;
    if (orderDetails.size === 'Small') productPrice = 75;
    if (orderDetails.size === 'Large') productPrice = 125;
    if (orderDetails.size === 'Stand') productPrice = 225;
    
    return productPrice + deliveryCost;
  };

  const currentPrice = calculatePrice();

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleAddressSelect = async (address: string, lat: number, lng: number) => {
    setOrderDetails({ ...orderDetails, location: address });
    setCustomerCoordinates({ lat, lng });
    setIsCalculatingDelivery(true);

    try {
      const result = await calculateDeliveryDistance(lat, lng);
      
      const selectedOption = result.options[0];
      
      if (selectedOption) {
        setDeliveryCost(selectedOption.cost);
        setDeliveryDistance(result.distance);
      } else {
        alert(`This location is ${result.distance}km away. Please contact us directly for delivery options.`);
        setDeliveryCost(0);
        setDeliveryDistance(0);
      }
    } catch (error) {
      console.error('Delivery calculation error:', error);
      setDeliveryCost(0);
      setDeliveryDistance(0);
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  const formatWhatsAppMessage = () => {
    const productPrice = currentPrice - deliveryCost;
    const sizeText = orderDetails.size === 'Stand' ? 'On Stand (3 letters)' : orderDetails.size;
    
    const message = `🌸 *New Custom Letter Order* 🌸

───────────────────────

*📋 Order Details*

🌿 *Letter:* ${orderDetails.letter}
🌺 *Size:* ${sizeText}
🎨 *Color:* ${orderDetails.boxColor || 'Natural Wood'}
📍 *Location:* ${orderDetails.location}
${orderDetails.customMessage ? `\n💌 *Message:*\n_"${orderDetails.customMessage}"_\n` : ''}
───────────────────────

💰 *Pricing Breakdown*
• Product: R${productPrice}
${deliveryCost > 0 ? `• Delivery (${deliveryDistance}km): R${deliveryCost}\n` : ''}
*Total: R${currentPrice}*

───────────────────────

📸 _Feel free to send any reference images in the next message!_

✨ _Customer is ready to discuss details!_

🪴 Thank you for choosing Fern & Fern 🪴`;

    return encodeURIComponent(message);
  };

  const handleSubmit = async () => {
    if (!orderDetails.letter || !orderDetails.size || !orderDetails.location) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSubmitted(true);

      setTimeout(() => {
        const whatsappUrl = `https://wa.me/27729670945?text=${formatWhatsAppMessage()}`;
        window.open(whatsappUrl, '_blank');
      }, 2000);
    }, 1000);
  };

  if (orderSubmitted) {
    const finalPrice = currentPrice;
    const sizeText = orderDetails.size === 'Stand' ? 'On Stand (3 letters)' : orderDetails.size;
    
    return (
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6">
        <Card className="bg-black/40 backdrop-blur-3xl border border-white/20 shadow-2xl p-8 md:p-12 rounded-3xl">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl animate-gentle-pulse">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            
            <div>
              <h2 className="text-3xl font-semibold text-white mb-3 tracking-tight">Order Ready</h2>
              <p className="text-white/60 text-base">
                Redirecting to WhatsApp...
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl text-left space-y-4">
              <div className="flex justify-between items-center text-base">
                <span className="text-white/50">Letter</span>
                <span className="text-white font-semibold">{orderDetails.letter}</span>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="flex justify-between items-center text-base">
                <span className="text-white/50">Size</span>
                <span className="text-white font-semibold">{sizeText}</span>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="flex justify-between items-center text-base">
                <span className="text-white/50">Color</span>
                <span className="text-white font-semibold">{orderDetails.boxColor || 'Natural Wood'}</span>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-white/70 font-medium text-lg">Total</span>
                <span className="text-white font-bold text-2xl">
                  R{finalPrice}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-green-400 text-sm">
              <MessageCircle className="w-5 h-5 animate-pulse" />
              <span>Opening WhatsApp</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full md:max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6">
      <Card className="bg-black/40 backdrop-blur-3xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-10 pb-5 md:pb-6 border-b border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1.5 tracking-tight">Custom Letter</h2>
              <p className="text-white/50 text-sm md:text-base">Design your keepsake</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 md:p-10 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Letter and Size - 2 Column Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Letter Selection */}
            <div className="form-field-stagger" style={{ animationDelay: '0.1s' }}>
              <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                Letter <span className="text-red-400">*</span>
              </Label>
              <Select onValueChange={(value) => setOrderDetails({ ...orderDetails, letter: value })}>
                <SelectTrigger className="glass-input text-white h-14 rounded-2xl text-base">
                  <SelectValue placeholder="Choose a letter" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl z-[10001]">
                  {alphabet.map((letter) => (
                    <SelectItem 
                      key={letter} 
                      value={letter} 
                      className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl"
                    >
                      {letter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size Selection */}
            <div className="form-field-stagger" style={{ animationDelay: '0.2s' }}>
              <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                Size <span className="text-red-400">*</span>
              </Label>
              <Select onValueChange={(value) => setOrderDetails({ ...orderDetails, size: value })}>
                <SelectTrigger className="glass-input text-white h-14 rounded-2xl text-base">
                  <SelectValue placeholder="Choose size" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl z-[10001]">
                  <SelectItem value="Small" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                    Small - R75
                  </SelectItem>
                  <SelectItem value="Large" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                    Large - R125
                  </SelectItem>
                  <SelectItem value="Stand" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                    On Stand (3 letters) - R225
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color and Location - 2 Column Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box Color Input */}
            <div className="form-field-stagger" style={{ animationDelay: '0.3s' }}>
              <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                Color
              </Label>
              <Input
                placeholder="e.g. Sage Green, Blush Pink, Natural Wood"
                value={orderDetails.boxColor}
                onChange={(e) => setOrderDetails({ ...orderDetails, boxColor: e.target.value })}
                className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
              />
              <p className="text-white/40 text-xs md:text-sm mt-2">Leave blank for Natural Wood</p>
            </div>

            {/* Location with Autocomplete */}
            <div className="form-field-stagger" style={{ animationDelay: '0.4s' }}>
              <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                Delivery Location <span className="text-red-400">*</span>
              </Label>
              <AddressAutocomplete
                onAddressSelect={handleAddressSelect}
                value={orderDetails.location}
                onChange={(value) => setOrderDetails({ ...orderDetails, location: value })}
              />
              {isCalculatingDelivery && (
                <p className="text-white/50 text-xs mt-2">Calculating delivery cost...</p>
              )}
              {deliveryDistance > 0 && (
                <p className="text-white/60 text-xs mt-2">
                  📍 {deliveryDistance}km away • R{deliveryCost} delivery
                </p>
              )}
            </div>
          </div>

          {/* Custom Message */}
          <div className="form-field-stagger" style={{ animationDelay: '0.5s' }}>
            <Label className="text-white text-sm md:text-base mb-3 block font-medium">
              Custom Message <span className="text-white/50 text-sm">(optional)</span>
            </Label>
            <Textarea
              placeholder="Any special instructions..."
              value={orderDetails.customMessage}
              onChange={(e) => setOrderDetails({ ...orderDetails, customMessage: e.target.value })}
              rows={3}
              className="glass-input text-white placeholder:text-white/30 rounded-2xl resize-none text-base py-4"
            />
          </div>

          {/* Image Note */}
          <div className="form-field-stagger" style={{ animationDelay: '0.6s' }}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-full p-3 flex-shrink-0">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-base mb-2">Pictures via WhatsApp.</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Send images directly via WhatsApp after placing your order. We'll get them right away.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="p-6 md:p-10 pt-5 md:pt-6 border-t border-white/10">
          {/* Live Price Display */}
          {currentPrice > 0 && (
            <div className="mb-4 p-4 md:p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Product</span>
                <span className="text-white">R{currentPrice - deliveryCost}</span>
              </div>
              {deliveryCost > 0 && (
                <>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Delivery ({deliveryDistance}km)</span>
                    <span className="text-white">R{deliveryCost}</span>
                  </div>
                </>
              )}
              <div className="h-px bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm md:text-base">Total Price</span>
                <span className="text-white font-bold text-2xl md:text-3xl">
                  R{currentPrice}
                </span>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white h-14 md:h-16 rounded-2xl font-semibold shadow-lg hover-lift disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base md:text-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Continue to WhatsApp</span>
              </div>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CustomLetterForm;
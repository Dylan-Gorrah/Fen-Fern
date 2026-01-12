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
  customLetterInput: string;
  size: string;
  letterColor: string;
  location: string;
  customMessage: string;
}

const CustomLetterForm = ({ onClose }: { onClose: () => void }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    letter: '',
    customLetterInput: '',
    size: '',
    letterColor: '',
    location: '',
    customMessage: ''
  });
  
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number>(0);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [customerCoordinates, setCustomerCoordinates] = useState<{lat: number, lng: number} | null>(null);

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

  // Calculate price based on size and letter type
  const calculatePrice = () => {
    if (!orderDetails.size) return 0;
    
    const isBundle = orderDetails.letter === '3 Letter Bundle';
    
    const prices: { [key: string]: { single: number; bundle: number } } = {
      'Small': { single: 75, bundle: 200 },
      'Medium': { single: 100, bundle: 250 },
      'Large': { single: 125, bundle: 300 }
    };

    const productPrice = isBundle 
      ? prices[orderDetails.size].bundle 
      : prices[orderDetails.size].single;
    
    return productPrice + deliveryCost;
  };

  const currentPrice = calculatePrice();

  const formatWhatsAppMessage = () => {
    const letterDisplay = orderDetails.letter === '3 Letter Bundle' 
      ? `3 Letter Bundle (${orderDetails.customLetterInput})` 
      : orderDetails.letter;
    
    let message = `🌸 *New Custom Letter Order* 🌸
───────────────────────
*📋 Order Details*

🌿 *Letter:* ${letterDisplay}

🌺 *Size:* ${orderDetails.size}`;

    // Add letter color if provided
    if (orderDetails.letterColor) {
      message += `

🎨 *Letter Color:* ${orderDetails.letterColor}`;
    }

    // Add location
    message += `

📍 *Location:* ${orderDetails.location}`;

    // Add custom message if provided
    if (orderDetails.customMessage) {
      message += `

💌 *Message:*
_"${orderDetails.customMessage}"_`;
    }

    // Add pricing and footer
    message += `

───────────────────────

💰 *Total Price:* R${currentPrice}

───────────────────────

✨ _Customer is ready to discuss details!_

🪴 Thank you for choosing Fern & Fern 🪴`;

    return message;
  };

  const handleSubmit = async () => {
    if (!orderDetails.letter || !orderDetails.size || !orderDetails.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (orderDetails.letter === '3 Letter Bundle' && !orderDetails.customLetterInput) {
      alert('Please enter your 3 letters for the bundle');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSubmitted(true);

      setTimeout(() => {
        const message = formatWhatsAppMessage();
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=27729670945&text=${encodedMessage}`;
        window.location.href = whatsappUrl;
      }, 2000);
    }, 1000);
  };

  if (orderSubmitted) {
    const finalPrice = currentPrice;
    const letterDisplay = orderDetails.letter === '3 Letter Bundle' 
      ? `3 Letter Bundle (${orderDetails.customLetterInput})` 
      : orderDetails.letter;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]" onClick={onClose}>
        <div className="w-full max-w-full md:max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6" onClick={(e) => e.stopPropagation()}>
          <Card className="bg-black/40 backdrop-blur-3xl border border-white/20 shadow-2xl p-8 md:p-12 rounded-3xl">
            <div className="text-center space-y-8">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto shadow-xl animate-gentle-pulse">
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
                  <span className="text-white font-semibold">{letterDisplay}</span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center text-base">
                  <span className="text-white/50">Size</span>
                  <span className="text-white font-semibold">{orderDetails.size}</span>
                </div>
                {orderDetails.letterColor && (
                  <>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-white/50">Color</span>
                      <span className="text-white font-semibold">{orderDetails.letterColor}</span>
                    </div>
                  </>
                )}
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center text-base">
                  <span className="text-white/50">Location</span>
                  <span className="text-white font-semibold text-right break-words">{orderDetails.location}</span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white/70 font-medium">Total Price</span>
                  <span className="text-white font-bold text-xl">R{finalPrice}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-0 md:p-4 z-[10000] overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <Card className="bg-black/40 backdrop-blur-3xl border-0 md:border border-white/20 shadow-2xl md:my-8 rounded-none md:rounded-3xl min-h-screen md:min-h-0">
          {/* Close Button - Top Right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-colors z-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="p-6 md:p-10 pb-32 md:pb-10">
            {/* Header */}
            <div className="text-center mb-8 md:mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Custom Letter</h1>
              <p className="text-white/60 text-base md:text-lg">Create your personalized moss letter</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Letter and Size - 2 Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Letter Selection */}
                <div className="form-field-stagger" style={{ animationDelay: '0.1s' }}>
                  <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                    Choose Letter <span className="text-red-400">*</span>
                  </Label>
                  <Select onValueChange={(value) => setOrderDetails({ ...orderDetails, letter: value })}>
                    <SelectTrigger className="glass-input text-white h-14 rounded-2xl text-base">
                      <SelectValue placeholder="Select a letter" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl z-[10001] max-h-[300px] overflow-y-auto">
                      <SelectItem value="A" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">A</SelectItem>
                      <SelectItem value="B" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">B</SelectItem>
                      <SelectItem value="C" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">C</SelectItem>
                      <SelectItem value="D" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">D</SelectItem>
                      <SelectItem value="E" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">E</SelectItem>
                      <SelectItem value="F" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">F</SelectItem>
                      <SelectItem value="G" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">G</SelectItem>
                      <SelectItem value="H" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">H</SelectItem>
                      <SelectItem value="I" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">I</SelectItem>
                      <SelectItem value="J" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">J</SelectItem>
                      <SelectItem value="K" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">K</SelectItem>
                      <SelectItem value="L" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">L</SelectItem>
                      <SelectItem value="M" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">M</SelectItem>
                      <SelectItem value="N" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">N</SelectItem>
                      <SelectItem value="O" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">O</SelectItem>
                      <SelectItem value="P" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">P</SelectItem>
                      <SelectItem value="Q" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">Q</SelectItem>
                      <SelectItem value="R" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">R</SelectItem>
                      <SelectItem value="S" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">S</SelectItem>
                      <SelectItem value="T" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">T</SelectItem>
                      <SelectItem value="U" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">U</SelectItem>
                      <SelectItem value="V" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">V</SelectItem>
                      <SelectItem value="W" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">W</SelectItem>
                      <SelectItem value="X" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">X</SelectItem>
                      <SelectItem value="Y" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">Y</SelectItem>
                      <SelectItem value="Z" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">Z</SelectItem>
                      <SelectItem value="3 Letter Bundle" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        3 Letter Bundle
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Letter Input - Only shown when 3 Letter Bundle is selected */}
                {orderDetails.letter === '3 Letter Bundle' && (
                  <div className="form-field-stagger" style={{ animationDelay: '0.15s' }}>
                    <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                      Enter Your 3 Letters <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. ABC, XYZ"
                      value={orderDetails.customLetterInput}
                      onChange={(e) => setOrderDetails({ ...orderDetails, customLetterInput: e.target.value.toUpperCase() })}
                      maxLength={3}
                      className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
                    />
                    <p className="text-white/40 text-xs md:text-sm mt-2">Type exactly 3 letters</p>
                  </div>
                )}

                {/* Size Selection */}
                <div className="form-field-stagger" style={{ animationDelay: '0.2s' }}>
                  <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                    Letter Size <span className="text-red-400">*</span>
                  </Label>
                  <Select onValueChange={(value) => setOrderDetails({ ...orderDetails, size: value })}>
                    <SelectTrigger className="glass-input text-white h-14 rounded-2xl text-base">
                      <SelectValue placeholder="Choose size" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl z-[10001]">
                      <SelectItem value="Small" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        Small - {orderDetails.letter === '3 Letter Bundle' ? 'R200' : 'R75'}
                      </SelectItem>
                      <SelectItem value="Medium" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        Medium - {orderDetails.letter === '3 Letter Bundle' ? 'R250' : 'R100'}
                      </SelectItem>
                      <SelectItem value="Large" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        Large - {orderDetails.letter === '3 Letter Bundle' ? 'R300' : 'R125'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Letter Color and Location - 2 Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">

                {/* Letter Color */}
                <div className="form-field-stagger" style={{ animationDelay: '0.3s' }}>
                  <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                    Letter Color <span className="text-white/50 text-sm">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Natural Wood, Sage Green"
                    value={orderDetails.letterColor}
                    onChange={(e) => setOrderDetails({ ...orderDetails, letterColor: e.target.value })}
                    className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
                  />
                  <p className="text-white/40 text-xs md:text-sm mt-2">Describe your desired letter color</p>
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
              <div className="form-field-stagger mt-5" style={{ animationDelay: '0.5s' }}>
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
              <div className="form-field-stagger mt-5" style={{ animationDelay: '0.6s' }}>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-white/10 rounded-full p-2 flex-shrink-0">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm mb-1">Send your pictures via WhatsApp</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                          Send images directly via WhatsApp after placing your order. We'll get them right away.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Sticky Footer with Submit Button */}
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-xl border-t border-white/10 p-4 md:p-6">
            {/* Live Price Display - Compact */}
            {currentPrice > 0 && (
              <div className="mb-3 p-3 md:p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="text-white/70 text-xs md:text-sm">
                    <div>Product: R{currentPrice - deliveryCost}</div>
                    {deliveryCost > 0 && (
                      <div className="text-white/50">Delivery: R{deliveryCost}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-white/50 text-xs">Total</div>
                    <div className="text-white font-bold text-xl md:text-2xl">
                      R{currentPrice}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white h-12 md:h-14 rounded-2xl font-semibold shadow-lg hover-lift disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
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
    </div>
  );
};

export default CustomLetterForm;
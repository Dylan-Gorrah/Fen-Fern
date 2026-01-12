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
  size: string;
  withPaint: string;
  boxColor: string;
  location: string;
  customMessage: string;
}

const CustomBoxForm = ({ onClose }: { onClose: () => void }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    size: '',
    withPaint: '',
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

  // Calculate price based on size and paint option
  const calculatePrice = () => {
    if (!orderDetails.size || !orderDetails.withPaint) return 0;
    
    const prices: { [key: string]: { withPaint: number; withoutPaint: number } } = {
      'Small': { withPaint: 200, withoutPaint: 150 },
      'Medium': { withPaint: 250, withoutPaint: 225 },
      'Large': { withPaint: 300, withoutPaint: 275 }
    };

    const size = orderDetails.size;
    const withPaint = orderDetails.withPaint === 'Yes';
    const productPrice = withPaint ? prices[size].withPaint : prices[size].withoutPaint;
    
    return productPrice + deliveryCost;
  };

  const currentPrice = calculatePrice();

  const formatWhatsAppMessage = () => {
    const paintText = orderDetails.withPaint === 'Yes' ? 'With Paint' : 'Without Paint';
    
    let message = `🎁 *New Custom Box Order* 🎁
───────────────────────
*📋 Order Details*

📦 *Size:* ${orderDetails.size}

🎨 *Paint:* ${paintText}`;

    // Add box color if paint is selected and color is provided
    if (orderDetails.withPaint === 'Yes' && orderDetails.boxColor) {
      message += `

🌈 *Box Color:* ${orderDetails.boxColor}`;
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
    if (!orderDetails.size || !orderDetails.withPaint || !orderDetails.location) {
      alert('Please fill in all required fields');
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
    const paintText = orderDetails.withPaint === 'Yes' ? 'With Paint' : 'Without Paint';
    
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
                  <span className="text-white/50">Size</span>
                  <span className="text-white font-semibold">{orderDetails.size}</span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center text-base">
                  <span className="text-white/50">Paint</span>
                  <span className="text-white font-semibold">{paintText}</span>
                </div>
                {orderDetails.withPaint === 'Yes' && orderDetails.boxColor && (
                  <>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-white/50">Color</span>
                      <span className="text-white font-semibold">{orderDetails.boxColor}</span>
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
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Custom Box</h1>
              <p className="text-white/60 text-base md:text-lg">Create your personalized moss box</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Size and Paint - 2 Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Size Selection */}
                <div className="form-field-stagger" style={{ animationDelay: '0.1s' }}>
                  <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                    Box Size <span className="text-red-400">*</span>
                  </Label>
                  <Select onValueChange={(value) => setOrderDetails({ ...orderDetails, size: value })}>
                    <SelectTrigger className="glass-input text-white h-14 rounded-2xl text-base">
                      <SelectValue placeholder="Choose size" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl z-[10001]">
                      <SelectItem value="Small" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        Small
                      </SelectItem>
                      <SelectItem value="Medium" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        Medium
                      </SelectItem>
                      <SelectItem value="Large" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        Large
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Paint Option */}
                <div className="form-field-stagger" style={{ animationDelay: '0.2s' }}>
                  <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                    Paint Option <span className="text-red-400">*</span>
                  </Label>
                  <Select onValueChange={(value) => setOrderDetails({ ...orderDetails, withPaint: value })}>
                    <SelectTrigger className="glass-input text-white h-14 rounded-2xl text-base">
                      <SelectValue placeholder="Choose option" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl z-[10001]">
                      <SelectItem value="No" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        Without Paint
                      </SelectItem>
                      <SelectItem value="Yes" className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer text-base py-3 rounded-xl">
                        With Paint
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color and Location - Smart Layout */}
              {orderDetails.withPaint === 'Yes' ? (
                // 2-column grid when "With Paint" is selected
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                  {/* Box Color */}
                  <div className="form-field-stagger" style={{ animationDelay: '0.3s' }}>
                    <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                      Box Color
                    </Label>
                    <Input
                      placeholder="e.g. Sage Green, Blush Pink"
                      value={orderDetails.boxColor}
                      onChange={(e) => setOrderDetails({ ...orderDetails, boxColor: e.target.value })}
                      className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
                    />
                    <p className="text-white/40 text-xs md:text-sm mt-2">Describe your desired color</p>
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
              ) : (
                // Full-width when "Without Paint" is selected
                <div className="form-field-stagger mt-5" style={{ animationDelay: '0.3s' }}>
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
              )}

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

export default CustomBoxForm;
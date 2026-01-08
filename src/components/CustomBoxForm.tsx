import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, MessageCircle, CheckCircle } from "lucide-react";

interface OrderDetails {
  size: string;
  withPaint: string;
  boxColor: string;
  location: string;
  customMessage: string;
  imageUrl?: string;
}

const CustomBoxForm = ({ onClose }: { onClose: () => void }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    size: '',
    withPaint: '',
    boxColor: '',
    location: '',
    customMessage: ''
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
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

    return withPaint ? prices[size].withPaint : prices[size].withoutPaint;
  };

  const currentPrice = calculatePrice();

  const formatWhatsAppMessage = () => {
    const price = calculatePrice();
    const paintText = orderDetails.withPaint === 'Yes' ? 'With Paint' : 'Without Paint';
    
    const message = `🎁 *New Custom Box Order* 🎁

───────────────────────

*📋 Order Details*

📦 *Size:* ${orderDetails.size}
🎨 *Paint:* ${paintText}
${orderDetails.withPaint === 'Yes' && orderDetails.boxColor ? `🌈 *Box Color:* ${orderDetails.boxColor}\n` : ''}📍 *Location:* ${orderDetails.location}

${orderDetails.customMessage ? `💌 *Message:*\n_"${orderDetails.customMessage}"_\n` : ''}${uploadedImage ? '📷 *Image:* Attached\n' : ''}
───────────────────────

💰 *Total Price:* R${price}

───────────────────────

✨ _Customer is ready to discuss details!_

🪴 Thank you for choosing Fern & Fern 🪴`;

    return encodeURIComponent(message);
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
        const whatsappUrl = `https://wa.me/27729670945?text=${formatWhatsAppMessage()}`;
        window.open(whatsappUrl, '_blank');
      }, 2000);
    }, 1000);
  };

  if (orderSubmitted) {
    const finalPrice = calculatePrice();
    const paintText = orderDetails.withPaint === 'Yes' ? 'With Paint' : 'Without Paint';
    
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
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1.5 tracking-tight">Custom Box</h2>
              <p className="text-white/50 text-sm md:text-base">Design your memory box</p>
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
          {/* Size and Paint Option - 2 Column Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Size Selection */}
            <div className="form-field-stagger" style={{ animationDelay: '0.1s' }}>
              <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                Size <span className="text-red-400">*</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box Color */}
              <div className="form-field-stagger" style={{ animationDelay: '0.3s' }}>
                <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                  Box Color
                </Label>
                <Input
                  placeholder="e.g. Sage Green, Blush Pink, Natural Wood"
                  value={orderDetails.boxColor}
                  onChange={(e) => setOrderDetails({ ...orderDetails, boxColor: e.target.value })}
                  className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
                />
                <p className="text-white/40 text-xs md:text-sm mt-2">Describe your desired color</p>
              </div>

              {/* Location */}
              <div className="form-field-stagger" style={{ animationDelay: '0.4s' }}>
                <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                  Delivery Location <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="Your address or area"
                  value={orderDetails.location}
                  onChange={(e) => setOrderDetails({ ...orderDetails, location: e.target.value })}
                  className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
                  required
                />
              </div>
            </div>
          ) : (
            // Full-width when "Without Paint" is selected
            <div className="form-field-stagger" style={{ animationDelay: '0.3s' }}>
              <Label className="text-white text-sm md:text-base mb-3 block font-medium">
                Delivery Location <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="Your address or area"
                value={orderDetails.location}
                onChange={(e) => setOrderDetails({ ...orderDetails, location: e.target.value })}
                className="glass-input text-white placeholder:text-white/30 h-14 rounded-2xl text-base"
                required
              />
            </div>
          )}

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

          {/* Image Upload */}
          <div className="form-field-stagger" style={{ animationDelay: '0.6s' }}>
            <Label className="text-white text-sm md:text-base mb-3 block font-medium">
              Upload Image <span className="text-white/50 text-sm">(optional)</span>
            </Label>
            <div className="border border-dashed border-white/20 rounded-2xl p-8 text-center glass-input hover:border-white/30 transition-all">
              {uploadedImage ? (
                <div className="relative">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-h-48 mx-auto rounded-xl shadow-lg"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-white/30" />
                  <span className="text-white/50 text-sm md:text-base">Click to upload</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="p-6 md:p-10 pt-5 md:pt-6 border-t border-white/10">
          {/* Live Price Display */}
          {currentPrice > 0 && (
            <div className="mb-4 p-4 md:p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
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

export default CustomBoxForm;
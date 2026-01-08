# Location & Delivery Cost Calculation Implementation Guide

Hey! This guide will walk you through adding **address autocomplete** and **automatic delivery cost calculation** to the Fern & Fern website. Everything is broken down into simple phases with clear instructions.

---

## 🎯 What We're Building

We want to add smart delivery pricing to both the **Custom Letter** and **Custom Box** forms. Here's what users will experience:

1. **Type their address** → Get autocomplete suggestions (like Google Maps)
2. **Select address** → System automatically calculates distance from the business
3. **See delivery cost** → Updates in real-time based on distance
4. **Get total price** → Product price + Delivery cost

**Business Address (Starting Point):**  
105 7th Street, Rusthof, Strand, 7140, South Africa

**Delivery Pricing:**  
- Based on Bolt prices: R7/km with 20% discount = **R5.60 per km**
- **Minimum delivery fee: R30** (for trips under 5km)
- Maximum reasonable distance: ~50km (anything beyond might need manual quote)

---

## 🛠️ Technology Choice: Google Maps API

### Why Google Maps?

**Pros:**
- ✅ Best user experience (everyone knows it)
- ✅ Most accurate for South African addresses
- ✅ Built-in distance calculation
- ✅ Easy to integrate with React
- ✅ Free tier: $200/month credit = ~40,000 autocomplete requests

**What You'll Need:**
- Google Cloud account (free)
- API key (takes 5 minutes to set up)
- No credit card charges unless you exceed free tier (very unlikely)

**Alternative Options (if you really can't use Google):**
- Mapbox (100k requests/month free, no credit card)
- OpenStreetMap + Nominatim (100% free but less polished)

---

## 📋 Implementation Phases

### **Phase 1: Get Google Maps API Set Up** (10 minutes) 
### **Phase 2: Install Required Packages** (2 minutes)
### **Phase 3: Add Address Autocomplete Component** (30 minutes)
### **Phase 4: Add Distance Calculation** (20 minutes)
### **Phase 5: Update Both Forms** (40 minutes)
### **Phase 6: Update WhatsApp Messages** (10 minutes)
### **Phase 7: Test Everything** (15 minutes)

**Total Time:** ~2 hours

---

## 🚀 Phase 1: Get Google Maps API Set Up

### Step 1.1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click **"Select a project"** at the top
3. Click **"New Project"**
4. Name it: `fern-and-fern-website`
5. Click **"Create"**

### Step 1.2: Enable Required APIs

1. In the search bar, type: **"Maps JavaScript API"**
2. Click on it, then click **"Enable"**
3. Go back, search for: **"Places API"**
4. Click on it, then click **"Enable"**
5. Go back, search for: **"Distance Matrix API"**
6. Click on it, then click **"Enable"**

### Step 1.3: Create API Key

1. In the left sidebar, click **"Credentials"**
2. Click **"+ Create Credentials"** → **"API Key"**
3. Copy the API key (looks like: `AIzaSyC...`)
4. Click **"Restrict Key"** (important for security!)
5. Under **"API restrictions"**, select **"Restrict key"**
6. Check these three APIs:
   - Maps JavaScript API
   - Places API
   - Distance Matrix API
7. Click **"Save"**

### Step 1.4: Add API Key to Your Project

Create a `.env.local` file in your project root:

```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

⚠️ **IMPORTANT:** Add `.env.local` to your `.gitignore` file so you don't commit your API key!

---

## 📦 Phase 2: Install Required Packages

Open your terminal in the project directory and run:

```bash
npm install @react-google-maps/api
```

This package makes it super easy to use Google Maps in React.

---

## 🧩 Phase 3: Add Address Autocomplete Component

### Step 3.1: Create the Component

Create a new file: `src/components/AddressAutocomplete.tsx`

```tsx
import React, { useState } from 'react';
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
```

**What This Does:**
- Loads Google Maps API
- Shows autocomplete dropdown as user types
- Restricts results to South Africa
- Returns the full address + coordinates when user selects

---

## 📏 Phase 4: Add Distance Calculation

### Step 4.1: Create Distance Calculator Utility

Create a new file: `src/utils/deliveryCalculator.ts`

```typescript
// Business address coordinates
const BUSINESS_LAT = -34.1156;
const BUSINESS_LNG = 18.8739;
// This is 105 7th Street, Rusthof, Strand, 7140

// Pricing configuration
const PRICE_PER_KM = 5.60; // R7 Bolt price minus 20%
const MINIMUM_DELIVERY = 30; // R30 minimum
const MAX_REASONABLE_DISTANCE = 50; // 50km max

interface DeliveryResult {
  distance: number; // in km
  cost: number; // in ZAR
  duration: string; // estimated time
  isTooFar: boolean;
}

/**
 * Calculate delivery cost based on distance
 */
export const calculateDeliveryCost = (distanceKm: number): number => {
  if (distanceKm <= 5) {
    // Under 5km = minimum fee
    return MINIMUM_DELIVERY;
  }
  // Over 5km = per-km pricing
  return Math.ceil(distanceKm * PRICE_PER_KM);
};

/**
 * Calculate distance using Google Distance Matrix API
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
            const cost = calculateDeliveryCost(distanceKm);
            const isTooFar = distanceKm > MAX_REASONABLE_DISTANCE;

            resolve({
              distance: parseFloat(distanceKm.toFixed(1)),
              cost,
              duration: element.duration.text,
              isTooFar,
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
```

**What This Does:**
- Calculates driving distance from your business to customer
- Applies pricing: R30 minimum or R5.60/km
- Returns distance, cost, and estimated delivery time
- Flags if location is too far (>50km)

---

## 🔧 Phase 5: Update Both Forms

Now we need to update `CustomLetterForm.tsx` and `CustomBoxForm.tsx` to use the new components.

### Step 5.1: Update CustomLetterForm.tsx

**What to Change:**

1. **Add imports at the top:**

```tsx
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { calculateDeliveryDistance } from '@/utils/deliveryCalculator';
```

2. **Add new state variables** (after existing useState declarations):

```tsx
const [deliveryCost, setDeliveryCost] = useState<number>(0);
const [deliveryDistance, setDeliveryDistance] = useState<number>(0);
const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
const [customerCoordinates, setCustomerCoordinates] = useState<{lat: number, lng: number} | null>(null);
```

3. **Add address selection handler** (before the return statement):

```tsx
const handleAddressSelect = async (address: string, lat: number, lng: number) => {
  setOrderDetails({ ...orderDetails, location: address });
  setCustomerCoordinates({ lat, lng });
  setIsCalculatingDelivery(true);

  try {
    const result = await calculateDeliveryDistance(lat, lng);
    
    if (result.isTooFar) {
      alert(`This location is ${result.distance}km away. Please contact us directly for delivery options.`);
      setDeliveryCost(0);
      setDeliveryDistance(0);
    } else {
      setDeliveryCost(result.cost);
      setDeliveryDistance(result.distance);
    }
  } catch (error) {
    console.error('Delivery calculation error:', error);
    setDeliveryCost(0);
    setDeliveryDistance(0);
  } finally {
    setIsCalculatingDelivery(false);
  }
};
```

4. **Update the calculatePrice function** to include delivery:

```tsx
const calculatePrice = () => {
  if (!orderDetails.size) return 0;
  
  let productPrice = 0;
  if (orderDetails.size === 'Small') productPrice = 75;
  if (orderDetails.size === 'Large') productPrice = 125;
  if (orderDetails.size === 'Stand') productPrice = 225;
  
  return productPrice + deliveryCost; // Add delivery cost!
};
```

5. **Replace the Location input field** with AddressAutocomplete:

Find this section:
```tsx
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
```

Replace it with:
```tsx
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
```

6. **Update the price display section** to show breakdown:

Find the "Live Price Display" section in the footer and update it:

```tsx
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
```

### Step 5.2: Update CustomBoxForm.tsx

**Do the exact same changes** as above for `CustomBoxForm.tsx`. The code is identical, just make sure to:
- Add the same imports
- Add the same state variables
- Add the same `handleAddressSelect` function
- Update the `calculatePrice` function
- Replace the Location input with AddressAutocomplete
- Update the price display section

The only difference is the product prices (150-300 instead of 75-225).

---

## 📱 Phase 6: Update WhatsApp Messages

Update the `formatWhatsAppMessage` function in **both forms** to include delivery info:

```tsx
const formatWhatsAppMessage = () => {
  const productPrice = currentPrice - deliveryCost;
  const price = orderDetails.size === 'Small' ? '75' : orderDetails.size === 'Large' ? '125' : '225';
  const sizeText = orderDetails.size === 'Stand' ? 'On Stand (3 letters)' : orderDetails.size;
  
  const message = `🌸 *New Custom Letter Order* 🌸

───────────────────────

*📋 Order Details*

🌿 *Letter:* ${orderDetails.letter}
🌺 *Size:* ${sizeText}
🎨 *Box Color:* ${orderDetails.boxColor || 'Natural Wood'}
📍 *Location:* ${orderDetails.location}

${orderDetails.customMessage ? `💌 *Message:*\n_"${orderDetails.customMessage}"_\n` : ''}${uploadedImage ? '📷 *Image:* Attached\n' : ''}
───────────────────────

💰 *Pricing Breakdown*
• Product: R${productPrice}
${deliveryCost > 0 ? `• Delivery (${deliveryDistance}km): R${deliveryCost}\n` : ''}
*Total: R${currentPrice}*

───────────────────────

✨ _Customer is ready to discuss details!_

🪴 Thank you for choosing Fern & Fern 🪴`;

  return encodeURIComponent(message);
};
```

Do the same for CustomBoxForm (adjust product details accordingly).

---

## 🧪 Phase 7: Test Everything

### Testing Checklist:

1. **Test Address Autocomplete:**
   - [ ] Type "105 7th" → Should show suggestions
   - [ ] Select an address → Should populate field
   - [ ] Check that delivery cost appears below

2. **Test Distance Calculation:**
   - [ ] Enter address 2km away → Should show R30 (minimum)
   - [ ] Enter address 10km away → Should show ~R56
   - [ ] Enter address 30km away → Should show ~R168
   - [ ] Enter address 60km away → Should show "too far" warning

3. **Test Price Display:**
   - [ ] Select size → Product price appears
   - [ ] Select address → Delivery cost appears
   - [ ] Total = Product + Delivery ✅

4. **Test WhatsApp Message:**
   - [ ] Complete form and submit
   - [ ] WhatsApp should open with breakdown
   - [ ] Check product price, delivery, and total are correct

5. **Test on Mobile:**
   - [ ] Address autocomplete works
   - [ ] Prices display correctly
   - [ ] Form stays wide and readable

---

## 🚨 Common Issues & Fixes

### Issue: "Google Maps API key not working"
**Fix:** 
1. Make sure you enabled all three APIs (Maps JavaScript, Places, Distance Matrix)
2. Check your API key restrictions
3. Make sure `.env.local` is in the root directory
4. Restart your dev server after adding the API key

### Issue: "Autocomplete dropdown not appearing"
**Fix:**
1. Check browser console for errors
2. Make sure `libraries={["places"]}` is passed correctly
3. Try clearing browser cache

### Issue: "Distance calculation takes too long"
**Fix:**
1. This is normal for first request (2-3 seconds)
2. Consider adding a loading state (already included in code above)

### Issue: "Delivery cost is wrong"
**Fix:**
1. Check the `PRICE_PER_KM` constant in `deliveryCalculator.ts`
2. Verify the minimum delivery logic (5km threshold)
3. Test with known distances

---

## 💡 Future Enhancements (Optional)

Once the basic system works, you could add:

1. **Delivery Zones:**
   - Green zone (0-10km): Standard delivery
   - Yellow zone (10-30km): Extended delivery  
   - Red zone (30km+): Contact for quote

2. **Delivery Time Estimates:**
   - "Estimated delivery: 2-3 days"
   - Based on distance + processing time

3. **Collection Option:**
   - "Collect from store: Free"
   - Let users skip delivery cost

4. **Delivery Schedule:**
   - "Next delivery day: Friday"
   - Batch deliveries by area

---

## 📊 Estimated Costs

**Google Maps API (Monthly):**
- Average small business: 500-1000 requests/month
- Cost: FREE (under $200 credit)
- Even at 5000 requests: ~$25/month

**Your Pricing Examples:**
- Customer 5km away orders R75 letter: R75 + R30 = R105
- Customer 15km away orders R225 stand: R225 + R84 = R309
- Customer 25km away orders R200 box: R200 + R140 = R340

---

## ✅ Final Checklist

Before going live:

- [ ] API key is working and restricted
- [ ] `.env.local` is in `.gitignore`
- [ ] Tested on desktop and mobile
- [ ] Delivery costs calculate correctly
- [ ] WhatsApp messages include delivery breakdown
- [ ] Both forms (Letter & Box) work
- [ ] "Too far" warning works (>50km)
- [ ] Minimum delivery (R30) works for short distances

---

## 🆘 Need Help?

If you run into issues:

1. **Check browser console** for errors
2. **Verify API key** is correct and enabled
3. **Test with simple address** first (e.g., "Cape Town City Centre")
4. **Check coordinates** of business address (use Google Maps to verify)

---

## 🎉 Summary

You're adding:
- ✅ Smart address autocomplete
- ✅ Automatic delivery cost calculation  
- ✅ Distance-based pricing (R5.60/km, R30 minimum)
- ✅ Beautiful price breakdown display
- ✅ WhatsApp message includes delivery details

This will make ordering **so much easier** for customers and **automate pricing** for you!

**Estimated Setup Time:** 2 hours  
**Estimated Monthly Cost:** R0 (free tier)  
**Customer Experience:** 🚀 Massively improved

Good luck! 🌸

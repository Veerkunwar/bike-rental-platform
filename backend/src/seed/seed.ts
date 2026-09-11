/* eslint-disable no-console */
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';
import { City } from '../models/City';
import { Location } from '../models/Location';
import { Bike, BikeCategory } from '../models/Bike';
import { Coupon } from '../models/Coupon';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';

import citiesData from './data/cities.json';
import locationsData from './data/locations.json';

const BRANDS = ['Honda', 'Royal Enfield', 'TVS', 'Bajaj', 'Yamaha', 'Hero', 'KTM', 'Ather', 'Ola Electric'];
const CATEGORIES: BikeCategory[] = ['scooty', 'scooter', 'commuter', 'sports', 'cruiser', 'adventure', 'electric'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function destroy() {
  await connectDB();
  await Promise.all([
    User.deleteMany({ role: 'user' }),
    City.deleteMany({}),
    Location.deleteMany({}),
    Bike.deleteMany({}),
    Coupon.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('[seed] All seeded collections cleared.');
  await mongoose.disconnect();
  process.exit(0);
}

async function seed() {
  await connectDB();

  console.log('[seed] Seeding admin account...');
  const existingAdmin = await User.findOne({ email: env.admin.email });
  if (!existingAdmin) {
    await User.create({
      fullName: 'Platform Admin',
      email: env.admin.email,
      phone: '+919999999999',
      password: env.admin.password,
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
    });
    console.log(`[seed] Admin created: ${env.admin.email} / ${env.admin.password}`);
  } else {
    console.log('[seed] Admin already exists, skipping.');
  }

  console.log('[seed] Seeding cities...');
  const cityDocs = [];
  for (const c of citiesData as any[]) {
    const doc = await City.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
    cityDocs.push(doc);
  }

  console.log('[seed] Seeding locations...');
  const locationDocs: Record<string, any[]> = {};
  for (const [cityName, locs] of Object.entries(locationsData as Record<string, any[]>)) {
    const city = cityDocs.find((c) => c.name === cityName);
    if (!city) continue;
    locationDocs[cityName] = [];
    for (const loc of locs) {
      const doc = await Location.findOneAndUpdate(
        { city: city._id, name: loc.name },
        { ...loc, city: city._id },
        { upsert: true, new: true },
      );
      locationDocs[cityName].push(doc);
    }
  }
  // Every other city gets at least one generic "City Center" location so bikes always have a valid pickup point.
  for (const city of cityDocs) {
    if (!locationDocs[city.name]) {
      const doc = await Location.findOneAndUpdate(
        { city: city._id, name: `${city.name} City Center` },
        {
          city: city._id,
          name: `${city.name} City Center`,
          address: `Main Market, ${city.name}`,
          latitude: 20 + Math.random() * 10,
          longitude: 75 + Math.random() * 10,
        },
        { upsert: true, new: true },
      );
      locationDocs[city.name] = [doc];
    }
  }

  console.log('[seed] Seeding bikes (30+)...');
  const existingBikeCount = await Bike.countDocuments();
  if (existingBikeCount === 0) {
    const bikesToCreate = [];
    for (let i = 0; i < 36; i++) {
      const city = randomFrom(cityDocs);
      const locations = locationDocs[city.name];
      const location = randomFrom(locations);
      const category = randomFrom(CATEGORIES);
      const brand = randomFrom(BRANDS);
      const isElectric = category === 'electric';

      bikesToCreate.push({
        name: `${brand} ${category.charAt(0).toUpperCase() + category.slice(1)} ${randomInt(100, 400)}`,
        brand,
        modelName: `${randomInt(2020, 2026)}-${category}`,
        manufacturingYear: randomInt(2019, 2026),
        category,
        engineCC: isElectric ? undefined : randomInt(100, 650),
        mileageKmpl: isElectric ? undefined : randomInt(30, 65),
        fuelType: isElectric ? 'electric' : 'petrol',
        transmission: category === 'scooty' || category === 'scooter' || isElectric ? 'automatic' : 'manual',
        helmetIncluded: Math.random() > 0.3,
        photos: [
          `https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=60`,
        ],
        city: city._id,
        pickupLocation: location._id,
        pricePerHour: randomInt(30, 150),
        pricePerDay: randomInt(400, 2000),
        securityDeposit: randomInt(500, 3000),
        status: 'available',
        rentalTerms: 'Valid driving license and government ID required at pickup. Fuel not included.',
        cancellationPolicy: 'Free cancellation up to 24 hours before pickup. 50% charge thereafter.',
        averageRating: Math.round((3 + Math.random() * 2) * 10) / 10,
        reviewCount: randomInt(0, 120),
        isFeatured: Math.random() > 0.8,
      });
    }
    await Bike.insertMany(bikesToCreate);
    console.log(`[seed] Created ${bikesToCreate.length} bikes.`);
  } else {
    console.log('[seed] Bikes already exist, skipping.');
  }

  console.log('[seed] Seeding coupons...');
  await Coupon.findOneAndUpdate(
    { code: 'WELCOME100' },
    {
      code: 'WELCOME100',
      fixedDiscount: 100,
      minBookingAmount: 500,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 0,
      perUserLimit: 1,
      isActive: true,
    },
    { upsert: true },
  );
  await Coupon.findOneAndUpdate(
    { code: 'SAVE20' },
    {
      code: 'SAVE20',
      discountPercentage: 20,
      maxDiscount: 300,
      minBookingAmount: 800,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
      perUserLimit: 2,
      isActive: true,
    },
    { upsert: true },
  );

  console.log('[seed] Seeding a sample traveler user...');
  // Use findOne + create (rather than findOneAndUpdate) so the password
  // actually goes through the User model's pre-save bcrypt hashing hook.
  let sampleUser = await User.findOne({ email: 'traveler@example.com' });
  if (!sampleUser) {
    sampleUser = await User.create({
      fullName: 'Test Traveler',
      email: 'traveler@example.com',
      phone: '+919812345678',
      password: 'Password123!',
      city: 'Dehradun',
      isEmailVerified: true,
      isPhoneVerified: true,
      documents: {
        governmentId: { status: 'approved' },
        drivingLicense: { status: 'approved' },
        selfie: { status: 'approved' },
      },
    });
  }
  console.log(`[seed] Sample user ready: traveler@example.com / Password123! (id=${sampleUser?._id})`);

  console.log('[seed] Done.');
  await mongoose.disconnect();
  process.exit(0);
}

if (process.argv.includes('--destroy')) {
  destroy().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

import { PrismaClient } from "@prisma/client";
import { findCity, haversineKm } from "../src/lib/cities";
import { estimatePrice } from "../src/lib/pricing";
import { computeBreakdown } from "../src/lib/mock/payments";
import { AUCTION_WINDOW_MS, COMMISSION_PCT } from "../src/lib/constants";

const prisma = new PrismaClient();

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

function threadId(loadId: string, a: string, b: string) {
  const [x, y] = [a, b].sort();
  return `${loadId}:${x}:${y}`;
}

async function main() {
  console.log("Resetting data…");
  // Order matters due to FKs.
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.load.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users…");

  // ---- Truck owners (varying ratings, fleets, verified state) ----
  const raju = await prisma.user.create({
    data: {
      role: "TRUCK_OWNER",
      name: "Raju Transport Co.",
      phone: "9000000001",
      verified: true,
      avgRating: 4.9,
      ratingCount: 42,
      tripsCompleted: 128,
      onTimePct: 97,
      fleetSize: 12,
      truckTypes: "open,container,trailer",
      memberSince: daysAgo(900),
      docs: JSON.stringify({ rc: "uploaded", licence: "uploaded", truckPhoto: "uploaded" }),
    },
  });
  const singh = await prisma.user.create({
    data: {
      role: "TRUCK_OWNER",
      name: "Singh Cargo Movers",
      phone: "9000000002",
      verified: true,
      avgRating: 4.3,
      ratingCount: 21,
      tripsCompleted: 64,
      onTimePct: 91,
      fleetSize: 6,
      truckTypes: "container,reefer",
      memberSince: daysAgo(500),
      docs: JSON.stringify({ rc: "uploaded", licence: "uploaded" }),
    },
  });
  const fatima = await prisma.user.create({
    data: {
      role: "TRUCK_OWNER",
      name: "Fatima Freight Lines",
      phone: "9000000003",
      verified: false, // shows unverified state
      avgRating: 4.1,
      ratingCount: 9,
      tripsCompleted: 23,
      onTimePct: 88,
      fleetSize: 3,
      truckTypes: "open,trailer",
      memberSince: daysAgo(150),
      docs: JSON.stringify({}),
    },
  });
  const kumar = await prisma.user.create({
    data: {
      role: "TRUCK_OWNER",
      name: "Kumar Roadways",
      phone: "9000000004",
      verified: true,
      avgRating: 3.8,
      ratingCount: 15,
      tripsCompleted: 40,
      onTimePct: 82,
      fleetSize: 4,
      truckTypes: "open",
      memberSince: daysAgo(300),
      docs: JSON.stringify({ rc: "uploaded" }),
    },
  });

  // ---- Load owners (businesses) ----
  const acme = await prisma.user.create({
    data: {
      role: "LOAD_OWNER",
      name: "Anita Sharma",
      phone: "8000000001",
      verified: true,
      businessName: "Acme Steel Traders",
      pan: "AAAPA1234A",
      gst: "27AAAPA1234A1Z5",
      avgRating: 4.7,
      ratingCount: 18,
      tripsCompleted: 55,
      onTimePct: 100,
      memberSince: daysAgo(700),
      docs: JSON.stringify({ pan: "uploaded", gst: "uploaded" }),
    },
  });
  const freshfarm = await prisma.user.create({
    data: {
      role: "LOAD_OWNER",
      name: "Vikram Reddy",
      phone: "8000000002",
      verified: true,
      businessName: "FreshFarm Produce Pvt Ltd",
      pan: "BBBPB5678B",
      gst: "36BBBPB5678B1Z2",
      avgRating: 4.5,
      ratingCount: 11,
      tripsCompleted: 30,
      onTimePct: 100,
      memberSince: daysAgo(260),
      docs: JSON.stringify({ pan: "uploaded" }),
    },
  });
  const buildmart = await prisma.user.create({
    data: {
      role: "LOAD_OWNER",
      name: "Priya Nair",
      phone: "8000000003",
      verified: false,
      businessName: "BuildMart Materials",
      pan: "CCCPC9012C",
      avgRating: 4.2,
      ratingCount: 6,
      tripsCompleted: 12,
      onTimePct: 100,
      memberSince: daysAgo(90),
      docs: JSON.stringify({}),
    },
  });

  console.log("Seeding loads…");

  async function makeLoad(opts: {
    posterId: string;
    pickup: string;
    drop: string;
    weightTonnes: number;
    materialType: string;
    truckType: string;
    numTrucks?: number;
    fragile?: boolean;
    loadingResponsibility?: string;
    notes?: string;
    status?: string;
    auctionClosesAt?: Date;
    pickupAt?: Date;
    deliverBy?: Date;
  }) {
    const p = findCity(opts.pickup)!;
    const d = findCity(opts.drop)!;
    const distanceKm = haversineKm(p, d);
    const { estMinPrice, estMaxPrice } = estimatePrice(distanceKm, opts.weightTonnes);
    return prisma.load.create({
      data: {
        posterId: opts.posterId,
        pickupCity: opts.pickup,
        dropCity: opts.drop,
        pickupLat: p.lat,
        pickupLng: p.lng,
        dropLat: d.lat,
        dropLng: d.lng,
        distanceKm,
        pickupAt: opts.pickupAt ?? daysFromNow(1),
        deliverBy: opts.deliverBy ?? daysFromNow(4),
        weightTonnes: opts.weightTonnes,
        materialType: opts.materialType,
        truckType: opts.truckType,
        numTrucks: opts.numTrucks ?? 1,
        fragile: opts.fragile ?? false,
        loadingResponsibility: opts.loadingResponsibility ?? "Load Owner",
        notes: opts.notes ?? "",
        estMinPrice,
        estMaxPrice,
        status: opts.status ?? "POSTED",
        auctionClosesAt: opts.auctionClosesAt ?? new Date(Date.now() + AUCTION_WINDOW_MS),
      },
    });
  }

  // Several OPEN loads across real routes.
  await makeLoad({
    posterId: acme.id,
    pickup: "Ahmedabad",
    drop: "Jaipur",
    weightTonnes: 18,
    materialType: "Machinery",
    truckType: "trailer",
    notes: "Heavy CNC machines. Crane available at pickup.",
  });
  await makeLoad({
    posterId: buildmart.id,
    pickup: "Hyderabad",
    drop: "Pune",
    weightTonnes: 25,
    materialType: "General Goods",
    truckType: "open",
    notes: "Cement bags, tarpaulin required.",
  });
  await makeLoad({
    posterId: freshfarm.id,
    pickup: "Chennai",
    drop: "Bengaluru",
    weightTonnes: 9,
    materialType: "Perishables",
    truckType: "reefer",
    fragile: true,
    notes: "Maintain 4°C. Time-critical.",
    auctionClosesAt: new Date(Date.now() + AUCTION_WINDOW_MS),
  });

  // ---- 2 loads already in BIDDING with bids ----
  const biddingLoad1 = await makeLoad({
    posterId: acme.id,
    pickup: "Mumbai",
    drop: "Delhi",
    weightTonnes: 20,
    materialType: "General Goods",
    truckType: "container",
    status: "BIDDING",
    notes: "Palletised electronics. Dock available both ends.",
    auctionClosesAt: new Date(Date.now() + AUCTION_WINDOW_MS),
  });
  await prisma.bid.create({ data: { loadId: biddingLoad1.id, truckOwnerId: raju.id, amount: 92000 } });
  await prisma.bid.create({ data: { loadId: biddingLoad1.id, truckOwnerId: singh.id, amount: 88000 } });
  await prisma.bid.create({ data: { loadId: biddingLoad1.id, truckOwnerId: kumar.id, amount: 95000 } });

  const biddingLoad2 = await makeLoad({
    posterId: freshfarm.id,
    pickup: "Kolkata",
    drop: "Patna",
    weightTonnes: 12,
    materialType: "Perishables",
    truckType: "reefer",
    status: "BIDDING",
    fragile: true,
    notes: "Fresh produce. Keep chilled.",
    auctionClosesAt: new Date(Date.now() + AUCTION_WINDOW_MS),
  });
  await prisma.bid.create({ data: { loadId: biddingLoad2.id, truckOwnerId: singh.id, amount: 34000 } });
  await prisma.bid.create({ data: { loadId: biddingLoad2.id, truckOwnerId: fatima.id, amount: 31500 } });

  console.log("Seeding an in-transit trip…");

  // ---- 1 Trip IN_TRANSIT so live tracking works immediately ----
  const transitLoad = await makeLoad({
    posterId: buildmart.id,
    pickup: "Nagpur",
    drop: "Indore",
    weightTonnes: 15,
    materialType: "Machinery",
    truckType: "open",
    status: "IN_TRANSIT",
    notes: "Steel coils.",
    auctionClosesAt: daysAgo(1),
  });
  const winBid = await prisma.bid.create({
    data: { loadId: transitLoad.id, truckOwnerId: raju.id, amount: 41000, status: "WON" },
  });
  const transitBreak = computeBreakdown({
    winningBid: 41000,
    cargoValue: 600000,
    insuranceOn: true,
    fuelCardOn: false,
    commissionPct: COMMISSION_PCT,
  });
  await prisma.trip.create({
    data: {
      loadId: transitLoad.id,
      winningBidId: winBid.id,
      status: "IN_TRANSIT",
      insuranceOn: true,
      fuelCardOn: false,
      cargoValue: 600000,
      commissionPct: COMMISSION_PCT,
      commissionAmount: transitBreak.commissionAmount,
      addonsTotal: transitBreak.addonsTotal,
      grandTotal: transitBreak.grandTotal,
      // Started ~25s ago so the truck is a little way along the 2-min journey.
      startedAt: new Date(Date.now() - 25 * 1000),
      progressPct: 20,
    },
  });

  console.log("Seeding a completed & closed trip with reviews…");

  // ---- 1 CLOSED trip with reviews so profiles show history ----
  const doneLoad = await makeLoad({
    posterId: acme.id,
    pickup: "Surat",
    drop: "Mumbai",
    weightTonnes: 10,
    materialType: "General Goods",
    truckType: "container",
    status: "CLOSED",
    notes: "Textiles.",
    pickupAt: daysAgo(10),
    deliverBy: daysAgo(8),
    auctionClosesAt: daysAgo(10),
  });
  const doneBid = await prisma.bid.create({
    data: { loadId: doneLoad.id, truckOwnerId: singh.id, amount: 22000, status: "WON" },
  });
  const doneBreak = computeBreakdown({
    winningBid: 22000,
    cargoValue: 300000,
    insuranceOn: true,
    fuelCardOn: true,
    commissionPct: COMMISSION_PCT,
  });
  const doneTrip = await prisma.trip.create({
    data: {
      loadId: doneLoad.id,
      winningBidId: doneBid.id,
      status: "CLOSED",
      insuranceOn: true,
      fuelCardOn: true,
      cargoValue: 300000,
      commissionPct: COMMISSION_PCT,
      commissionAmount: doneBreak.commissionAmount,
      addonsTotal: doneBreak.addonsTotal,
      grandTotal: doneBreak.grandTotal,
      progressPct: 100,
      startedAt: daysAgo(9),
      deliveredAt: daysAgo(8),
      paidAt: daysAgo(8),
    },
  });
  await prisma.review.create({
    data: {
      tripId: doneTrip.id,
      fromUserId: acme.id,
      toUserId: singh.id,
      stars: 5,
      text: "On time, cargo spotless. Great communication throughout.",
    },
  });
  await prisma.review.create({
    data: {
      tripId: doneTrip.id,
      fromUserId: singh.id,
      toUserId: acme.id,
      stars: 4,
      text: "Smooth loading, prompt payment. Would carry again.",
    },
  });

  // A couple of chat messages on a bidding load so the thread isn't empty.
  await prisma.message.create({
    data: {
      threadId: threadId(biddingLoad1.id, acme.id, singh.id),
      loadId: biddingLoad1.id,
      senderId: singh.id,
      receiverId: acme.id,
      text: "Namaste! I can pick up tomorrow morning. Is the dock free by 9am?",
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });
  await prisma.message.create({
    data: {
      threadId: threadId(biddingLoad1.id, acme.id, singh.id),
      loadId: biddingLoad1.id,
      senderId: acme.id,
      receiverId: singh.id,
      text: "Yes, dock is free from 8:30am. Can you do ₹85,000?",
      createdAt: new Date(Date.now() - 4 * 60 * 1000),
    },
  });

  // A welcome notification for each user.
  const everyone = [raju, singh, fatima, kumar, acme, freshfarm, buildmart];
  for (const u of everyone) {
    await prisma.notification.create({
      data: { userId: u.id, type: "WELCOME", text: "Welcome to Bharatfleet! Your account is ready." },
    });
  }
  await prisma.notification.create({
    data: {
      userId: acme.id,
      type: "BID",
      text: "New bids on your Mumbai → Delhi load. Lowest is ₹88,000.",
      link: `/loads/${biddingLoad1.id}`,
    },
  });

  console.log("\n✅ Seed complete.");
  console.log("Load owners:  Anita Sharma (Acme Steel), Vikram Reddy (FreshFarm), Priya Nair (BuildMart)");
  console.log("Truck owners: Raju Transport, Singh Cargo, Fatima Freight, Kumar Roadways");
  console.log("Any 10-digit phone + OTP 123456 logs you in.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categoryNames = [
    "Electronics",
    "Fashion & Apparel",
    "Home & Kitchen",
    "Health & Beauty",
    "Sports & Outdoors",
    "Books & Stationery",
    "Toys & Games",
    "Groceries",
    "Furniture",
    "Automotive",
  ];

  await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const cats = await prisma.category.findMany();
  const categoryMap: Record<string, string> = {};
  cats.forEach((c) => (categoryMap[c.name] = c.id));

  const products = [
    { name: "Smartphone X", price: "699.00", stock: "50", barcode: "ELEC001", imageUrl: "https://picsum.photos/200?1", categoryId: categoryMap["Electronics"] },
    { name: "Laptop Pro 15\"", price: "1299.00", stock: "30", barcode: "ELEC002", imageUrl: "https://picsum.photos/200?2", categoryId: categoryMap["Electronics"] },
    { name: "Wireless Earbuds", price: "99.00", stock: "100", barcode: "ELEC003", imageUrl: "https://picsum.photos/200?3", categoryId: categoryMap["Electronics"] },
    { name: "4K Smart TV", price: "899.00", stock: "20", barcode: "ELEC004", imageUrl: "https://picsum.photos/200?4", categoryId: categoryMap["Electronics"] },
    { name: "Bluetooth Speaker", price: "59.00", stock: "75", barcode: "ELEC005", imageUrl: "https://picsum.photos/200?5", categoryId: categoryMap["Electronics"] },
    { name: "Classic T-Shirt", price: "19.99", stock: "200", barcode: "FASH001", imageUrl: "https://picsum.photos/200?6", categoryId: categoryMap["Fashion & Apparel"] },
    { name: "Denim Jeans", price: "49.99", stock: "150", barcode: "FASH002", imageUrl: "https://picsum.photos/200?7", categoryId: categoryMap["Fashion & Apparel"] },
    { name: "Sneakers", price: "79.99", stock: "120", barcode: "FASH003", imageUrl: "https://picsum.photos/200?8", categoryId: categoryMap["Fashion & Apparel"] },
    { name: "Leather Jacket", price: "199.00", stock: "40", barcode: "FASH004", imageUrl: "https://picsum.photos/200?9", categoryId: categoryMap["Fashion & Apparel"] },
    { name: "Baseball Cap", price: "14.99", stock: "180", barcode: "FASH005", imageUrl: "https://picsum.photos/200?10", categoryId: categoryMap["Fashion & Apparel"] },
    { name: "Non-stick Frying Pan", price: "29.99", stock: "80", barcode: "HOME001", imageUrl: "https://picsum.photos/200?11", categoryId: categoryMap["Home & Kitchen"] },
    { name: "Coffee Maker", price: "89.99", stock: "45", barcode: "HOME002", imageUrl: "https://picsum.photos/200?12", categoryId: categoryMap["Home & Kitchen"] },
    { name: "Vacuum Cleaner", price: "159.00", stock: "25", barcode: "HOME003", imageUrl: "https://picsum.photos/200?13", categoryId: categoryMap["Home & Kitchen"] },
    { name: "Blender", price: "49.99", stock: "60", barcode: "HOME004", imageUrl: "https://picsum.photos/200?14", categoryId: categoryMap["Home & Kitchen"] },
    { name: "Microwave Oven", price: "129.00", stock: "35", barcode: "HOME005", imageUrl: "https://picsum.photos/200?15", categoryId: categoryMap["Home & Kitchen"] },
    { name: "Moisturizing Cream", price: "24.99", stock: "100", barcode: "HB001", imageUrl: "https://picsum.photos/200?16", categoryId: categoryMap["Health & Beauty"] },
    { name: "Shampoo", price: "12.99", stock: "150", barcode: "HB002", imageUrl: "https://picsum.photos/200?17", categoryId: categoryMap["Health & Beauty"] },
    { name: "Electric Toothbrush", price: "49.99", stock: "70", barcode: "HB003", imageUrl: "https://picsum.photos/200?18", categoryId: categoryMap["Health & Beauty"] },
    { name: "Hair Dryer", price: "39.99", stock: "90", barcode: "HB004", imageUrl: "https://picsum.photos/200?19", categoryId: categoryMap["Health & Beauty"] },
    { name: "Perfume", price: "59.99", stock: "40", barcode: "HB005", imageUrl: "https://picsum.photos/200?20", categoryId: categoryMap["Health & Beauty"] },
    { name: "Running Shoes", price: "89.99", stock: "120", barcode: "SPORT001", imageUrl: "https://picsum.photos/200?21", categoryId: categoryMap["Sports & Outdoors"] },
    { name: "Mountain Bike", price: "499.00", stock: "15", barcode: "SPORT002", imageUrl: "https://picsum.photos/200?22", categoryId: categoryMap["Sports & Outdoors"] },
    { name: "Tent 2-Person", price: "149.00", stock: "25", barcode: "SPORT003", imageUrl: "https://picsum.photos/200?23", categoryId: categoryMap["Sports & Outdoors"] },
    { name: "Yoga Mat", price: "29.99", stock: "60", barcode: "SPORT004", imageUrl: "https://picsum.photos/200?24", categoryId: categoryMap["Sports & Outdoors"] },
    { name: "Dumbbell Set", price: "79.99", stock: "40", barcode: "SPORT005", imageUrl: "https://picsum.photos/200?25", categoryId: categoryMap["Sports & Outdoors"] },
  ];

  await Promise.all(
    products.map((p) =>
      prisma.product.upsert({
        where: { barcode: p.barcode! },
        update: {
          name: p.name,
          price: p.price,
          stock: p.stock,
          imageUrl: p.imageUrl,
          status: undefined,
          categoryId: p.categoryId,
        },
        create: p,
      })
    )
  );
}

main()
  .then(() => {
    console.log("✅ Database seeded!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

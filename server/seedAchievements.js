require("dotenv").config();
const mongoose = require("mongoose");
const Accomplishment = require("./models/Accomplishment");
const { faker } = require("@faker-js/faker");

// بيانات الموظفين (استخرجتها من الصورة)
const employees = [
  {
    _id: "6887813f7c748ff3a6a80900",
    name: "naser",
  },
  {
    _id: "688781603bb218bb2d666e84",
    name: "admin",
    email: "sarah@example.com",
  },
];

// إعدادات الاتصال
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/company_management";

// دالة تاريخ عشوائي
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// القيم المحتملة للحالة
const possibleStatus = ["pending", "reviewed", "needs_modification"];

async function seedAccomplishments() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected!");

    // حذف كل الإنجازات السابقة (يمكنك حذف هذا السطر إذا لا تريد)
    // await Accomplishment.deleteMany({});
    // console.log('Cleared previous accomplishments.');

    const accomplishments = [];
    for (let i = 0; i < 50; i++) {
      const emp = employees[Math.floor(Math.random() * employees.length)];
      const status =
        possibleStatus[Math.floor(Math.random() * possibleStatus.length)];
      const updatedAt = randomDate(new Date(2024, 5, 1), new Date());
      accomplishments.push({
        description: faker.lorem.sentence(),
        employee: emp._id,
        status,
        updatedAt,
        files: [],
        comments: [],
      });
    }

    await Accomplishment.insertMany(accomplishments);
    console.log(`تمت إضافة ${accomplishments.length} إنجاز بنجاح!`);

    mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (err) {
    console.error("Error seeding accomplishments:", err);
    mongoose.disconnect();
  }
}

seedAccomplishments();

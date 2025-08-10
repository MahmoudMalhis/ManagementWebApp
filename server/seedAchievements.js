require("dotenv").config();
const mongoose = require("mongoose");
const Accomplishment = require("./models/Accomplishment");
const { faker } = require("@faker-js/faker");

// بيانات الموظفين (استخرجتها من الصورة)
const employees = [
  {
    _id: "68972752d24eed84d75a3560",
    name: "ناصر",
  },
  {
    _id: "6897276dd24eed84d75a356c",
    name: "عبد",
  },
  {
    _id: "6897275fd24eed84d75a3566",
    name: "محمود",
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
const taskTitles = ["دراسة جدوى", "تصميم جزئي", "زيارة موقع", "تعديل على صور"];

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
        taskTitle: taskTitles[Math.floor(Math.random() * taskTitles.length)],
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

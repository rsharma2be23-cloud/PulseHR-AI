require("dotenv/config");

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { ROLES } = require("./src/config/roles");
const { Department } = require("./src/models/department.model");
const { User } = require("./src/models/user.model");
const { Employee } = require("./src/models/employee.model");
const { Attendance } = require("./src/models/attendance.model");
const { PerformanceReview } = require("./src/models/performanceReview.model");
const { Feedback } = require("./src/models/feedback.model");
const { Survey } = require("./src/models/survey.model");
const { AttritionPrediction } = require("./src/models/attritionPrediction.model");
const { buildAttritionFeatures } = require("./src/services/attritionFeature.service");
const { predictAttrition } = require("./src/clients/ml.client");

const PASSWORD_HASH = bcrypt.hashSync("Password123!", 12);
const MONTHS = [
  { label: "2026-06", period: new Date(Date.UTC(2026, 5, 1)) },
  { label: "2026-07", period: new Date(Date.UTC(2026, 6, 1)) },
  { label: "2026-08", period: new Date(Date.UTC(2026, 7, 1)) },
];

const departmentSeeds = [
  { name: "Engineering", code: "ENG", location: "Seattle", budget: 14500000, description: "Code: ENG | Location: Seattle | Budget: $14.5M | Headcount: 18" },
  { name: "Human Resources", code: "HR", location: "Austin", budget: 4200000, description: "Code: HR | Location: Austin | Budget: $4.2M | Headcount: 8" },
  { name: "Sales", code: "SAL", location: "New York", budget: 9800000, description: "Code: SAL | Location: New York | Budget: $9.8M | Headcount: 14" },
  { name: "Marketing", code: "MKT", location: "Chicago", budget: 6100000, description: "Code: MKT | Location: Chicago | Budget: $6.1M | Headcount: 10" },
  { name: "Finance", code: "FIN", location: "Denver", budget: 5400000, description: "Code: FIN | Location: Denver | Budget: $5.4M | Headcount: 9" },
  { name: "Customer Success", code: "CS", location: "Remote", budget: 4700000, description: "Code: CS | Location: Remote | Budget: $4.7M | Headcount: 11" },
  { name: "Operations", code: "OPS", location: "Atlanta", budget: 5200000, description: "Code: OPS | Location: Atlanta | Budget: $5.2M | Headcount: 10" },
  { name: "Product", code: "PRD", location: "San Francisco", budget: 7200000, description: "Code: PRD | Location: San Francisco | Budget: $7.2M | Headcount: 12" },
];

const employeeSeeds = [
  { name: "Maya Chen", department: "Engineering", designation: "Director", age: 41, salary: 220000, joiningDate: "2017-04-12", employmentStatus: "active", manager: null, persona: "high-performing, growth-oriented" },
  { name: "Anika Patel", department: "Engineering", designation: "Senior Engineer", age: 34, salary: 175000, joiningDate: "2019-06-01", employmentStatus: "active", manager: "Maya Chen", persona: "excellent attendance, strong ownership" },
  { name: "Derek Moore", department: "Engineering", designation: "Senior Engineer", age: 36, salary: 168000, joiningDate: "2018-09-15", employmentStatus: "active", manager: "Maya Chen", persona: "high overtime, burnout risk" },
  { name: "Sara Ali", department: "Engineering", designation: "Software Engineer", age: 29, salary: 142000, joiningDate: "2022-03-22", employmentStatus: "active", manager: "Maya Chen", persona: "steady performer, needs mentorship" },
  { name: "Noah Rivera", department: "Engineering", designation: "Junior", age: 24, salary: 96000, joiningDate: "2024-09-02", employmentStatus: "active", manager: "Anika Patel", persona: "learning curve, strong curiosity" },

  { name: "Priya Shah", department: "Human Resources", designation: "Manager", age: 38, salary: 145000, joiningDate: "2016-11-03", employmentStatus: "active", manager: null, persona: "people-first leadership" },
  { name: "Liam Brooks", department: "Human Resources", designation: "HR Business Partner", age: 33, salary: 125000, joiningDate: "2020-07-18", employmentStatus: "active", manager: "Priya Shah", persona: "stable, policy-focused" },
  { name: "Kavya Reddy", department: "Human Resources", designation: "HR Generalist", age: 31, salary: 112000, joiningDate: "2021-01-12", employmentStatus: "active", manager: "Priya Shah", persona: "high engagement, good relationships" },
  { name: "Jonas Lee", department: "Human Resources", designation: "Senior HR Coordinator", age: 27, salary: 94000, joiningDate: "2023-02-01", employmentStatus: "active", manager: "Priya Shah", persona: "needs process clarity" },
  { name: "Mina Ortiz", department: "Human Resources", designation: "Intern", age: 22, salary: 52000, joiningDate: "2025-01-20", employmentStatus: "active", manager: "Liam Brooks", persona: "early career, low tenure" },

  { name: "Rafael Torres", department: "Sales", designation: "Director", age: 44, salary: 210000, joiningDate: "2015-05-10", employmentStatus: "active", manager: null, persona: "high-growth sales leader" },
  { name: "Nadia Hassan", department: "Sales", designation: "Sales Manager", age: 37, salary: 155000, joiningDate: "2018-12-02", employmentStatus: "active", manager: "Rafael Torres", persona: "strong quota attainment" },
  { name: "Ethan Park", department: "Sales", designation: "Account Executive", age: 31, salary: 132000, joiningDate: "2021-04-14", employmentStatus: "active", manager: "Nadia Hassan", persona: "travel-heavy, inconsistent attendance" },
  { name: "Tasha Green", department: "Sales", designation: "Account Executive", age: 29, salary: 128000, joiningDate: "2022-09-11", employmentStatus: "active", manager: "Nadia Hassan", persona: "high compensation concerns" },
  { name: "Colin Brooks", department: "Sales", designation: "Business Development Rep", age: 26, salary: 98000, joiningDate: "2023-11-05", employmentStatus: "notice_period", manager: "Nadia Hassan", persona: "mixed signals, high attrition risk" },

  { name: "Ava Singh", department: "Marketing", designation: "Manager", age: 39, salary: 152000, joiningDate: "2017-10-17", employmentStatus: "active", manager: null, persona: "strategic marketing leader" },
  { name: "Jordan Kim", department: "Marketing", designation: "Senior Marketing Manager", age: 35, salary: 138000, joiningDate: "2019-08-06", employmentStatus: "active", manager: "Ava Singh", persona: "creative, collaborative" },
  { name: "Riley Foster", department: "Marketing", designation: "Brand Manager", age: 32, salary: 124000, joiningDate: "2020-02-19", employmentStatus: "active", manager: "Ava Singh", persona: "strong ownership, needs balance" },
  { name: "Sophie Nguyen", department: "Marketing", designation: "Content Specialist", age: 28, salary: 108000, joiningDate: "2022-07-01", employmentStatus: "active", manager: "Jordan Kim", persona: "high workload, low work-life balance" },
  { name: "Vic Patel", department: "Marketing", designation: "Intern", age: 23, salary: 56000, joiningDate: "2024-06-14", employmentStatus: "active", manager: "Riley Foster", persona: "learning, low tenure" },

  { name: "Marcus Bell", department: "Finance", designation: "Manager", age: 42, salary: 160000, joiningDate: "2015-03-01", employmentStatus: "active", manager: null, persona: "analytical and process-minded" },
  { name: "Ivy Chen", department: "Finance", designation: "Senior Accountant", age: 34, salary: 132000, joiningDate: "2019-01-10", employmentStatus: "active", manager: "Marcus Bell", persona: "excellent attention to detail" },
  { name: "Dev Patel", department: "Finance", designation: "FP&A Analyst", age: 30, salary: 118000, joiningDate: "2021-05-20", employmentStatus: "active", manager: "Marcus Bell", persona: "good performer, low manager support" },
  { name: "Nina Alvarez", department: "Finance", designation: "Accountant", age: 27, salary: 102000, joiningDate: "2022-10-09", employmentStatus: "active", manager: "Ivy Chen", persona: "needs growth support" },
  { name: "Owen Harris", department: "Finance", designation: "Junior", age: 25, salary: 89000, joiningDate: "2024-01-15", employmentStatus: "active", manager: "Nina Alvarez", persona: "early-stage, high curiosity" },

  { name: "Harper Lewis", department: "Customer Success", designation: "Director", age: 40, salary: 188000, joiningDate: "2016-08-22", employmentStatus: "active", manager: null, persona: "customer-first leader" },
  { name: "Aiden Cruz", department: "Customer Success", designation: "Manager", age: 35, salary: 146000, joiningDate: "2018-07-12", employmentStatus: "active", manager: "Harper Lewis", persona: "strong coaching, high empathy" },
  { name: "Leah Rivera", department: "Customer Success", designation: "Senior CSM", age: 32, salary: 128000, joiningDate: "2020-04-07", employmentStatus: "active", manager: "Aiden Cruz", persona: "excellent customer health, needs balance" },
  { name: "Mateo Ortiz", department: "Customer Success", designation: "CSM", age: 29, salary: 116000, joiningDate: "2022-09-16", employmentStatus: "active", manager: "Aiden Cruz", persona: "low engagement, remote friction" },
  { name: "Jules Carter", department: "Customer Success", designation: "Specialist", age: 26, salary: 93000, joiningDate: "2023-12-01", employmentStatus: "active", manager: "Leah Rivera", persona: "high potential, several late arrivals" },

  { name: "Ben Foster", department: "Operations", designation: "Manager", age: 43, salary: 158000, joiningDate: "2014-09-16", employmentStatus: "active", manager: null, persona: "steady ops leader" },
  { name: "Grace Flores", department: "Operations", designation: "Operations Manager", age: 36, salary: 138000, joiningDate: "2018-11-02", employmentStatus: "active", manager: "Ben Foster", persona: "process improvement focus" },
  { name: "Nate Wilson", department: "Operations", designation: "Process Analyst", age: 31, salary: 112000, joiningDate: "2021-03-19", employmentStatus: "active", manager: "Grace Flores", persona: "good reliability, low growth visibility" },
  { name: "Zara Khan", department: "Operations", designation: "Program Coordinator", age: 28, salary: 101000, joiningDate: "2022-06-10", employmentStatus: "active", manager: "Ben Foster", persona: "high workload, average attendance" },
  { name: "Kai Gomez", department: "Operations", designation: "Junior", age: 24, salary: 88000, joiningDate: "2024-07-01", employmentStatus: "active", manager: "Grace Flores", persona: "learning, needs support" },

  { name: "Elena Brooks", department: "Product", designation: "Director", age: 45, salary: 215000, joiningDate: "2013-01-08", employmentStatus: "active", manager: null, persona: "visionary product leader" },
  { name: "Chris Nguyen", department: "Product", designation: "Product Manager", age: 37, salary: 164000, joiningDate: "2018-05-01", employmentStatus: "active", manager: "Elena Brooks", persona: "strong execution, solid collaboration" },
  { name: "Mina Shah", department: "Product", designation: "Senior Product Manager", age: 34, salary: 152000, joiningDate: "2020-03-21", employmentStatus: "active", manager: "Elena Brooks", persona: "high influence, quality focus" },
  { name: "Toby Reed", department: "Product", designation: "Product Designer", age: 30, salary: 128000, joiningDate: "2022-01-13", employmentStatus: "active", manager: "Chris Nguyen", persona: "creative, needs more autonomy" },
  { name: "Lina Park", department: "Product", designation: "Junior", age: 25, salary: 91000, joiningDate: "2024-02-28", employmentStatus: "active", manager: "Mina Shah", persona: "high potential, moderate focus" },
];

function fmtDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildAttendancePattern(persona) {
  if (persona.includes("burnout")) return { presentDays: 15, absentDays: 5, overtimeHours: 16 };
  if (persona.includes("excellent")) return { presentDays: 20, absentDays: 0, overtimeHours: 2 };
  if (persona.includes("poor") || persona.includes("inconsistent") || persona.includes("late")) return { presentDays: 14, absentDays: 6, overtimeHours: 1 };
  if (persona.includes("high workload")) return { presentDays: 17, absentDays: 3, overtimeHours: 8 };
  return { presentDays: 18, absentDays: 2, overtimeHours: 3 };
}

function buildReviewStory(persona) {
  if (persona.includes("burnout")) return { rating: 3, comments: "High workload and delivery pressure are affecting focus and work-life balance. Recommend a lighter near-term load and stronger support." };
  if (persona.includes("excellent")) return { rating: 5, comments: "Consistent delivery, strong ownership, and thoughtful collaboration. A natural fit for broader technical leadership." };
  if (persona.includes("high attrition")) return { rating: 2, comments: "Needs stronger engagement and more clarity around growth opportunities. Attendance and follow-through require attention." };
  if (persona.includes("policy") || persona.includes("process")) return { rating: 4, comments: "Reliable and calm under pressure. Needs more autonomy on ownership of recurring processes." };
  if (persona.includes("high potential")) return { rating: 4, comments: "Strong initiative and solid execution. Continue building strategic influence and cross-functional communication." };
  return { rating: 3, comments: "Steady performer with good fundamentals. Continue building consistency and communication on larger initiatives." };
}

function buildFeedbackStory(persona, index) {
  const stories = [
    { label: "positive", score: 0.8, text: "The team has been very supportive, and the new roadmap is giving more clarity than before." },
    { label: "positive", score: 0.7, text: "I appreciate the thoughtful feedback and the chance to take ownership of a meaningful project." },
    { label: "neutral", score: 0.1, text: "The work is steady, but I would appreciate more frequent check-ins from my manager." },
    { label: "negative", score: -0.7, text: "The workload has felt heavy and inconsistent communication is making prioritization difficult." },
    { label: "negative", score: -0.6, text: "I am concerned about compensation relative to the market and the current level of support." },
  ];
  if (persona.includes("burnout")) return { ...stories[3], label: "negative" };
  if (persona.includes("excellent")) return { ...stories[0], label: "positive" };
  if (persona.includes("high attrition")) return { ...stories[4], label: "negative" };
  if (index % 5 === 0) return { ...stories[1], label: "positive" };
  if (index % 7 === 0) return { ...stories[2], label: "neutral" };
  return { ...stories[3], label: "negative" };
}

function buildSurveyStory(persona) {
  if (persona.includes("burnout")) return { jobSatisfaction: 2, workLifeBalance: 2, careerGrowth: 3, managerSupport: 2, compensationSatisfaction: 2 };
  if (persona.includes("high attrition")) return { jobSatisfaction: 2, workLifeBalance: 3, careerGrowth: 2, managerSupport: 2, compensationSatisfaction: 1 };
  if (persona.includes("excellent")) return { jobSatisfaction: 5, workLifeBalance: 4, careerGrowth: 4, managerSupport: 5, compensationSatisfaction: 3 };
  if (persona.includes("high workload")) return { jobSatisfaction: 3, workLifeBalance: 2, careerGrowth: 3, managerSupport: 3, compensationSatisfaction: 3 };
  return { jobSatisfaction: 4, workLifeBalance: 3, careerGrowth: 4, managerSupport: 4, compensationSatisfaction: 3 };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await mongoose.connection.dropDatabase();
  console.log("Dropped existing database data");

  const departmentDocs = [];
  for (const department of departmentSeeds) {
    departmentDocs.push(await Department.create({ name: department.name, description: department.description, manager: null }));
  }

  const departmentIndex = Object.fromEntries(departmentDocs.map((item) => [item.name, item]));
  const userDocs = [];

  const adminUser = await User.create({ name: "Avery Adams", email: "admin@example.com", passwordHash: PASSWORD_HASH, role: ROLES.ADMIN, isActive: true });
  const hrUser = await User.create({ name: "Harper Wells", email: "hr@example.com", passwordHash: PASSWORD_HASH, role: ROLES.HR, isActive: true });
  userDocs.push(adminUser, hrUser);

  const employeeUserDocs = [];
  for (const employee of employeeSeeds) {
    const user = await User.create({
      name: employee.name,
      email: `${employee.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@pulsehr.example`,
      passwordHash: PASSWORD_HASH,
      role: employee.designation.toLowerCase().includes("director") || employee.designation.toLowerCase().includes("manager") ? ROLES.MANAGER : ROLES.EMPLOYEE,
      isActive: true,
    });
    employeeUserDocs.push({ user, employee });
  }

  const createdEmployees = [];
  for (const { user, employee } of employeeUserDocs) {
    const department = departmentIndex[employee.department];
    const baseEmployee = await Employee.create({
      user: user._id,
      employeeCode: `${department.name.slice(0, 3).toUpperCase()}${String(createdEmployees.length + 1).padStart(3, "0")}`,
      department: department._id,
      manager: null,
      designation: employee.designation,
      dateOfJoining: new Date(employee.joiningDate),
      age: employee.age,
      salary: employee.salary,
      employmentStatus: employee.employmentStatus,
      lastPromotionDate: employee.joiningDate < "2020-01-01" ? new Date("2023-02-01") : null,
    });
    createdEmployees.push({ ...employee, _id: baseEmployee._id, userId: user._id, departmentId: department._id, employeeCode: baseEmployee.employeeCode, role: user.role, persona: employee.persona });
  }

  const employeeByName = Object.fromEntries(createdEmployees.map((item) => [item.name, item]));
  for (const created of createdEmployees) {
    const managerName = employeeSeeds.find((item) => item.name === created.name)?.manager;
    if (managerName) {
      const managerEmployee = employeeByName[managerName];
      if (managerEmployee) {
        await Employee.findByIdAndUpdate(created._id, { manager: managerEmployee._id });
      }
    }
  }

  const departmentManagerAssignments = Object.fromEntries(
    departmentSeeds.map((department) => [department.name, createdEmployees.find((item) => item.department === department.name && item.designation.toLowerCase().includes("director") || item.designation.toLowerCase().includes("manager"))])
  );

  for (const department of departmentSeeds) {
    const managerEmployee = createdEmployees.find((item) => item.department === department.name && (item.designation.toLowerCase().includes("director") || item.designation.toLowerCase().includes("manager")) && item.name !== "Maya Chen");
    const departmentDoc = departmentIndex[department.name];
    await Department.findByIdAndUpdate(departmentDoc._id, { manager: managerEmployee ? managerEmployee._id : null });
  }

  for (const employee of createdEmployees) {
    for (const month of MONTHS) {
      const pattern = buildAttendancePattern(employee.persona);
      const workingDays = 20;
      const presentDays = month.label === "2026-08" && employee.persona.includes("burnout") ? 14 : pattern.presentDays;
      const absentDays = month.label === "2026-08" && employee.persona.includes("burnout") ? 6 : pattern.absentDays;
      await Attendance.create({
        employee: employee._id,
        period: month.period,
        workingDays,
        presentDays,
        absentDays,
        overtimeHours: month.label === "2026-08" && employee.persona.includes("burnout") ? 12 : pattern.overtimeHours,
      });
    }
  }

  const reviewerLookup = Object.fromEntries(createdEmployees.filter((item) => item.designation.toLowerCase().includes("manager") || item.designation.toLowerCase().includes("director")).map((item) => [item.name, item]));
  for (const employee of createdEmployees) {
    const reviewer = reviewerLookup[employee.managerName || employee.name] || createdEmployees.find((item) => item.department === employee.department && (item.designation.toLowerCase().includes("manager") || item.designation.toLowerCase().includes("director")));
    const reviewStory = buildReviewStory(employee.persona);
    const reviewPeriods = ["2025 Q4", "2026 Q1"];
    for (const period of reviewPeriods) {
      await PerformanceReview.create({
        employee: employee._id,
        reviewer: reviewer ? reviewer.userId : hrUser._id,
        reviewPeriod: period,
        rating: reviewStory.rating + (period === "2026 Q1" ? 0 : -1),
        comments: `${reviewStory.comments} ${period.includes("2026") ? "The employee is showing clear momentum in their broader role." : "Focus on consistency in execution and collaboration."}`,
      });
    }
  }

  let feedbackCount = 0;
  for (const employee of createdEmployees) {
    const entryCount = employee.persona.includes("burnout") || employee.persona.includes("high attrition") ? 3 : 2;
    for (let index = 0; index < entryCount; index += 1) {
      const feedbackStory = buildFeedbackStory(employee.persona, index);
      await Feedback.create({
        employee: employee._id,
        text: `${feedbackStory.text} ${index === 0 ? "This is especially visible in the current quarter." : "I would value continued follow-up on this area."}`,
        sentimentLabel: feedbackStory.label,
        sentimentScore: feedbackStory.score,
        submittedAt: new Date(Date.UTC(2026, 4 + index, 10 + index)),
      });
      feedbackCount += 1;
    }
  }
  while (feedbackCount < 100) {
    const employee = createdEmployees[feedbackCount % createdEmployees.length];
    const story = buildFeedbackStory(employee.persona, feedbackCount);
    await Feedback.create({
      employee: employee._id,
      text: `${story.text} ${feedbackCount % 3 === 0 ? "The team is collaborating more clearly now." : "I would still like more visibility on next steps."}`,
      sentimentLabel: story.label,
      sentimentScore: story.score,
      submittedAt: new Date(Date.UTC(2026, 5 + (feedbackCount % 2), 5 + feedbackCount)),
    });
    feedbackCount += 1;
  }

  for (const employee of createdEmployees) {
    const surveyStory = buildSurveyStory(employee.persona);
    await Survey.create({
      employee: employee._id,
      jobSatisfaction: surveyStory.jobSatisfaction,
      workLifeBalance: surveyStory.workLifeBalance,
      careerGrowth: surveyStory.careerGrowth,
      managerSupport: surveyStory.managerSupport,
      compensationSatisfaction: surveyStory.compensationSatisfaction,
      submittedAt: new Date(Date.UTC(2026, 6, 15)),
    });
  }

  for (const employee of createdEmployees) {
    const { features, defaults } = await buildAttritionFeatures({
      _id: employee._id,
      department: employee.departmentId,
      manager: employee.manager ? employee._id : null,
      dateOfJoining: new Date(employee.joiningDate),
      age: employee.age,
      salary: employee.salary,
      designation: employee.designation,
      lastPromotionDate: employee.joiningDate < "2020-01-01" ? new Date("2023-02-01") : null,
    });
    const response = await predictAttrition(features);
    await AttritionPrediction.create({
      employee: employee._id,
      probability: response.attritionProbability,
      riskLevel: response.riskLevel,
      prediction: response.prediction,
      threshold: response.decisionThreshold,
      modelVersion: response.modelVersion,
      mappingDefaults: defaults,
      explanations: response.explanations,
      shapValues: response.shapValues,
      predictedAt: new Date(),
    });
  }

  const summary = {
    departments: await Department.countDocuments(),
    users: await User.countDocuments(),
    employees: await Employee.countDocuments(),
    attendance: await Attendance.countDocuments(),
    reviews: await PerformanceReview.countDocuments(),
    feedback: await Feedback.countDocuments(),
    surveys: await Survey.countDocuments(),
    attritionPredictions: await AttritionPrediction.countDocuments(),
  };

  console.log("Seed complete", JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export interface PricingPlan {
  name: string;
  tests: number;
  students: number;
  price: number;
}

export interface Addon {
  name: string;
  tests?: number;
  students?: number;
  price: number;
}

export const PRICING_PLANS: PricingPlan[] = [
  { name: "Starter", tests: 10, students: 200, price: 10000 },
  { name: "Standard", tests: 30, students: 500, price: 25000 },
  { name: "Professional", tests: 75, students: 2000, price: 50000 },
  { name: "Institution", tests: 200, students: 10000, price: 100000 },
];

export const TEST_ADDONS: Addon[] = [
  { name: "+5 Tests", tests: 5, price: 5000 },
  { name: "+10 Tests", tests: 10, price: 9000 },
  { name: "+25 Tests", tests: 25, price: 20000 },
];

export const STUDENT_ADDONS: Addon[] = [
  { name: "+100 Students", students: 100, price: 3000 },
  { name: "+500 Students", students: 500, price: 10000 },
  { name: "+1000 Students", students: 1000, price: 18000 },
];

import type { ActivityItem, Branch, DashboardData, Expense, Inspection, Lease, Maintenance, Payment, Property, Staff, Tenant, Unit } from "@/types";

export const branches: Branch[] = [
  {id:"b1",name:"Ntinda Branch",address:"Plot 18 Bukoto-Ntinda Road",city:"Kampala",manager:"Sarah Nakato",properties:3,units:26,status:"ACTIVE"},
  {id:"b2",name:"Kireka Branch",address:"Kireka Road",city:"Wakiso",manager:"Peter Ouma",properties:2,units:18,status:"ACTIVE"},
  {id:"b3",name:"Mukono Branch",address:"Kampala-Jinja Road",city:"Mukono",manager:"—",properties:1,units:8,status:"ACTIVE"}
];
export const properties: Property[] = [
  {id:"p1",branchId:"b1",branch:"Ntinda Branch",name:"Sunrise Apartments",type:"Apartment building",address:"Ntinda, Kampala",units:14,occupied:12,monthlyIncome:8400000,status:"ACTIVE"},
  {id:"p2",branchId:"b1",branch:"Ntinda Branch",name:"Bukoto Courts",type:"Apartment building",address:"Bukoto, Kampala",units:8,occupied:7,monthlyIncome:4900000,status:"ACTIVE"},
  {id:"p3",branchId:"b1",branch:"Ntinda Branch",name:"Ntinda Shops",type:"Commercial building",address:"Ntinda Trading Centre",units:4,occupied:4,monthlyIncome:3800000,status:"ACTIVE"},
  {id:"p4",branchId:"b2",branch:"Kireka Branch",name:"Green View Residences",type:"Apartment building",address:"Kireka, Wakiso",units:12,occupied:9,monthlyIncome:5400000,status:"ACTIVE"},
  {id:"p5",branchId:"b2",branch:"Kireka Branch",name:"Kireka Arcade",type:"Commercial building",address:"Kireka Town",units:6,occupied:5,monthlyIncome:4200000,status:"ACTIVE"},
  {id:"p6",branchId:"b3",branch:"Mukono Branch",name:"Mukono Family Homes",type:"Residential houses",address:"Mukono",units:8,occupied:6,monthlyIncome:3600000,status:"ACTIVE"}
];
export const units: Unit[] = [
  {id:"u1",propertyId:"p1",property:"Sunrise Apartments",name:"A01",type:"2 Bedroom",floor:"1",rent:700000,status:"OCCUPIED",tenant:"Grace Namusoke"},
  {id:"u2",propertyId:"p1",property:"Sunrise Apartments",name:"A02",type:"2 Bedroom",floor:"1",rent:700000,status:"OCCUPIED",tenant:"Ivan Kato"},
  {id:"u3",propertyId:"p1",property:"Sunrise Apartments",name:"A03",type:"1 Bedroom",floor:"1",rent:550000,status:"VACANT"},
  {id:"u4",propertyId:"p1",property:"Sunrise Apartments",name:"B01",type:"2 Bedroom",floor:"2",rent:700000,status:"OCCUPIED",tenant:"Rita Achieng"},
  {id:"u5",propertyId:"p2",property:"Bukoto Courts",name:"C04",type:"Studio",floor:"2",rent:500000,status:"MAINTENANCE"},
  {id:"u6",propertyId:"p4",property:"Green View Residences",name:"G07",type:"2 Bedroom",floor:"3",rent:650000,status:"VACANT"},
  {id:"u7",propertyId:"p5",property:"Kireka Arcade",name:"S03",type:"Shop",floor:"G",rent:900000,status:"OCCUPIED",tenant:"Moses Traders Ltd"},
  {id:"u8",propertyId:"p6",property:"Mukono Family Homes",name:"H06",type:"House",floor:"G",rent:600000,status:"VACANT"}
];
export const tenants: Tenant[] = [
  {id:"t1",name:"Grace Namusoke",phone:"+256 772 120 441",email:"grace@example.com",nationalId:"CM********01",occupation:"Accountant",unit:"A01",property:"Sunrise Apartments",rent:700000,balance:0,status:"ACTIVE"},
  {id:"t2",name:"Ivan Kato",phone:"+256 701 338 122",email:"ivan@example.com",nationalId:"CF********38",occupation:"Developer",unit:"A02",property:"Sunrise Apartments",rent:700000,balance:250000,status:"ACTIVE"},
  {id:"t3",name:"Rita Achieng",phone:"+256 782 901 773",email:"rita@example.com",occupation:"Nurse",unit:"B01",property:"Sunrise Apartments",rent:700000,balance:700000,status:"ACTIVE"},
  {id:"t4",name:"Moses Traders Ltd",phone:"+256 754 448 991",email:"accounts@mosestraders.ug",unit:"S03",property:"Kireka Arcade",rent:900000,balance:1800000,status:"ACTIVE"},
  {id:"t5",name:"Derrick Ssemanda",phone:"+256 776 553 992",email:"derrick@example.com",unit:"D02",property:"Green View Residences",rent:650000,balance:0,status:"ACTIVE"}
];
export const leases: Lease[] = [
  {id:"l1",tenant:"Grace Namusoke",tenantId:"t1",unit:"A01",unitId:"u1",property:"Sunrise Apartments",startDate:"2026-01-01",endDate:"2026-12-31",rent:700000,dueDay:5,status:"ACTIVE"},
  {id:"l2",tenant:"Ivan Kato",tenantId:"t2",unit:"A02",unitId:"u2",property:"Sunrise Apartments",startDate:"2026-04-01",endDate:"2027-03-31",rent:700000,dueDay:5,status:"ACTIVE"},
  {id:"l3",tenant:"Rita Achieng",tenantId:"t3",unit:"B01",unitId:"u4",property:"Sunrise Apartments",startDate:"2025-11-01",endDate:"2026-10-31",rent:700000,dueDay:3,status:"ENDING_SOON"},
  {id:"l4",tenant:"Moses Traders Ltd",tenantId:"t4",unit:"S03",unitId:"u7",property:"Kireka Arcade",startDate:"2026-02-01",endDate:"2027-01-31",rent:900000,dueDay:1,status:"ACTIVE"}
];
export const payments: Payment[] = [
  {id:"pay1",receipt:"RCT-2026-000184",tenant:"Grace Namusoke",property:"Sunrise Apartments",unit:"A01",amount:700000,method:"MTN Mobile Money",date:"2026-10-05",recordedBy:"Benjamin W.",status:"RECEIVED"},
  {id:"pay2",receipt:"RCT-2026-000183",tenant:"Derrick Ssemanda",property:"Green View Residences",unit:"D02",amount:650000,method:"Bank transfer",date:"2026-10-04",recordedBy:"Sarah N.",status:"RECEIVED"},
  {id:"pay3",receipt:"RCT-2026-000182",tenant:"Ivan Kato",property:"Sunrise Apartments",unit:"A02",amount:450000,method:"Cash",date:"2026-10-03",recordedBy:"Benjamin W.",status:"RECEIVED"},
  {id:"pay4",receipt:"RCT-2026-000181",tenant:"Moses Traders Ltd",property:"Kireka Arcade",unit:"S03",amount:900000,method:"Airtel Money",date:"2026-09-30",recordedBy:"Peter O.",status:"RECEIVED"}
];
export const expenses: Expense[] = [
  {id:"e1",branch:"Ntinda Branch",property:"Sunrise Apartments",category:"Repairs",description:"Water pump repair",amount:380000,date:"2026-10-08",method:"Cash"},
  {id:"e2",branch:"Kireka Branch",property:"Kireka Arcade",category:"Security",description:"October guard services",amount:650000,date:"2026-10-02",method:"Bank transfer"},
  {id:"e3",branch:"Ntinda Branch",property:"Bukoto Courts",category:"Cleaning",description:"Compound and common areas",amount:250000,date:"2026-10-01",method:"MTN Mobile Money"}
];
export const maintenance: Maintenance[] = [
  {id:"m1",property:"Bukoto Courts",unit:"C04",tenant:"—",title:"Bathroom pipe leak",priority:"HIGH",status:"IN_PROGRESS",reportedAt:"2026-10-12",dueDate:"2026-10-15",cost:180000},
  {id:"m2",property:"Sunrise Apartments",unit:"A01",tenant:"Grace Namusoke",title:"Kitchen socket not working",priority:"MEDIUM",status:"OPEN",reportedAt:"2026-10-13",dueDate:"2026-10-18",cost:0},
  {id:"m3",property:"Kireka Arcade",unit:"S03",tenant:"Moses Traders Ltd",title:"Roller shutter adjustment",priority:"LOW",status:"RESOLVED",reportedAt:"2026-10-04",dueDate:"2026-10-09",cost:120000}
];

export const inspections: Inspection[] = [
  {id:"i1",propertyId:"p1",unitId:"u1",tenantId:"t1",property:"Sunrise Apartments",unit:"A01",tenant:"Grace Namusoke",title:"Quarterly unit inspection",type:"ROUTINE",scheduledDate:"2026-10-20",scheduledTime:"10:00",notes:"Check plumbing, sockets and common wear.",status:"SCHEDULED",assignedTo:"Sarah Nakato",assignedToId:"s2"},
  {id:"i2",propertyId:"p4",unitId:"u6",property:"Green View Residences",unit:"G07",tenant:"—",title:"Vacancy readiness inspection",type:"MOVE_IN",scheduledDate:"2026-10-23",scheduledTime:"14:00",notes:"Confirm unit is ready for a new tenant.",status:"SCHEDULED",assignedTo:"Peter Ouma",assignedToId:"s3"}
];

export const sampleActivity: ActivityItem[] = [
  {id:"a1",title:"Payment received",body:"Rent payment recorded and receipt generated.",action:"INSERT",entityType:"payments",occurredAt:"2026-10-14T08:45:00Z",actor:"Benjamin Wamono"},
  {id:"a2",title:"Lease updated",body:"Lease status updated.",action:"UPDATE",entityType:"leases",occurredAt:"2026-10-13T13:20:00Z",actor:"Sarah Nakato"},
  {id:"a3",title:"Maintenance request created",body:"Kitchen socket not working · OPEN",action:"INSERT",entityType:"maintenance_requests",occurredAt:"2026-10-13T09:10:00Z",actor:"Sarah Nakato"}
];

export const staff: Staff[] = [
  {id:"s1",name:"Benjamin Wamono",email:"owner@example.com",phone:"+256 700 000 001",role:"OWNER",branches:["All branches"],status:"ACTIVE"},
  {id:"s2",name:"Sarah Nakato",email:"sarah@example.com",phone:"+256 700 000 002",role:"MANAGER",branches:["Ntinda Branch"],status:"ACTIVE"},
  {id:"s3",name:"Peter Ouma",email:"peter@example.com",phone:"+256 700 000 003",role:"MANAGER",branches:["Kireka Branch"],status:"ACTIVE"}
];

export const dashboard: DashboardData = {
  metrics:{properties:6,units:52,occupied:43,vacant:8,expected:29900000,collected:24150000,outstanding:5750000,expenses:3260000},
  payments,
  overdue:[
    {tenant:"Moses Traders Ltd",property:"Kireka Arcade",unit:"S03",amount:1800000,days:43},
    {tenant:"Rita Achieng",property:"Sunrise Apartments",unit:"B01",amount:700000,days:11},
    {tenant:"Ivan Kato",property:"Sunrise Apartments",unit:"A02",amount:250000,days:9}
  ],
  vacantUnits:units.filter(x=>x.status==="VACANT"),
  expiring:[
    {tenant:"Rita Achieng",property:"Sunrise Apartments",unit:"B01",endDate:"2026-10-31",days:17},
    {tenant:"Andrew Mutesa",property:"Green View Residences",unit:"G04",endDate:"2026-11-15",days:32}
  ],
  monthly:[
    {month:"May",expected:27400000,collected:25800000,expenses:2900000},
    {month:"Jun",expected:27700000,collected:26400000,expenses:3100000},
    {month:"Jul",expected:28100000,collected:26900000,expenses:2750000},
    {month:"Aug",expected:28600000,collected:27600000,expenses:3550000},
    {month:"Sep",expected:29200000,collected:28100000,expenses:3000000},
    {month:"Oct",expected:29900000,collected:24150000,expenses:3260000}
  ]
};

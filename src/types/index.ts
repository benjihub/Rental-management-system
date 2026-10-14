export type UnitStatus = 'VACANT'|'OCCUPIED'|'RESERVED'|'MAINTENANCE'|'INACTIVE';
export type LeaseStatus = 'DRAFT'|'ACTIVE'|'ENDING_SOON'|'ENDED'|'TERMINATED'|'CANCELLED';
export type ChargeStatus = 'UPCOMING'|'UNPAID'|'PARTIALLY_PAID'|'PAID'|'OVERDUE'|'WAIVED';
export type MaintenanceStatus = 'OPEN'|'IN_PROGRESS'|'RESOLVED'|'CANCELLED';
export type MemberRole = 'OWNER'|'ADMIN'|'MANAGER'|'AGENT';

export interface Branch {id:string;name:string;address:string;city:string;phone?:string;email?:string;notes?:string;manager:string;managerMemberId?:string;properties:number;units:number;status:string}
export interface Property {id:string;branchId:string;branch:string;name:string;type:string;address:string;description?:string;floors?:number|null;imageUrl?:string|null;units:number;occupied:number;monthlyIncome:number;status:string}
export interface Unit {id:string;propertyId:string;property:string;name:string;type:string;floor:string;bedrooms?:number|null;bathrooms?:number|null;rent:number;deposit?:number;description?:string;status:UnitStatus;tenant?:string}
export interface Tenant {id:string;branchId?:string|null;branch?:string;name:string;phone:string;email:string;nationalId?:string;gender?:string;dateOfBirth?:string;occupation?:string;employer?:string;previousAddress?:string;emergencyContactName?:string;emergencyContactPhone?:string;notes?:string;unit?:string;property?:string;rent:number;balance:number;status:string}
export interface Lease {id:string;tenant:string;tenantId:string;unit:string;unitId:string;property:string;startDate:string;endDate:string;rent:number;depositRequired?:number;depositPaid?:number;frequency?:string;dueDay:number;gracePeriod?:number;notes?:string;status:LeaseStatus}
export interface RentCharge {id:string;leaseId:string;tenantId:string;tenant:string;tenantPhone?:string;property:string;unit:string;period:string;dueDate:string;amount:number;paid:number;balance:number;status:ChargeStatus}
export interface Payment {id:string;receipt:string;tenant:string;tenantPhone?:string;tenantId?:string;leaseId?:string;property:string;unit:string;amount:number;method:string;date:string;reference?:string;notes?:string;recordedBy:string;reversedAt?:string|null;reversalReason?:string|null;status?:'RECEIVED'|'REVERSED'}
export interface Expense {id:string;branchId?:string|null;propertyId?:string|null;categoryId?:string|null;branch:string;property:string;category:string;description:string;amount:number;date:string;method:string;documentUrl?:string|null}
export interface Maintenance {id:string;propertyId?:string;unitId?:string;tenantId?:string;property:string;unit:string;tenant:string;title:string;description?:string;priority:string;status:MaintenanceStatus;reportedAt:string;dueDate?:string;estimatedCost?:number;cost:number;assignedTo?:string;assignedToId?:string}
export interface Staff {id:string;userId?:string;name:string;email:string;phone:string;role:string;branches:string[];branchIds?:string[];status:string}
export interface ExpenseCategory {id:string;name:string}
export interface Notification {id:string;kind:string;title:string;body:string;href?:string;readAt?:string|null;createdAt:string}
export interface AuditLog {id:string;action:string;entityType:string;entityId?:string;user:string;createdAt:string;metadata:any}
export interface TenantDocument {id:string;type:string;fileName:string;url:string;createdAt:string}
export interface DashboardData {metrics:{properties:number;units:number;occupied:number;vacant:number;expected:number;collected:number;outstanding:number;expenses:number};payments:Payment[];overdue:{tenant:string;property:string;unit:string;amount:number;days:number}[];vacantUnits:Unit[];expiring:{tenant:string;property:string;unit:string;endDate:string;days:number}[];monthly:{month:string;expected:number;collected:number;expenses:number}[]}

export interface Inspection {id:string;propertyId:string;unitId?:string|null;tenantId?:string|null;property:string;unit:string;tenant:string;title:string;type:string;scheduledDate:string;scheduledTime?:string|null;notes?:string;status:'SCHEDULED'|'COMPLETED'|'CANCELLED';assignedTo?:string;assignedToId?:string;completedAt?:string|null}
export interface CalendarEvent {id:string;kind:'RENT_DUE'|'LEASE_END'|'INSPECTION'|'MAINTENANCE';title:string;date:string;time?:string;subtitle:string;href:string;status?:string}
export interface ActivityItem {id:string;title:string;body?:string;action:string;entityType:string;occurredAt:string;actor:string}
export interface UserPreferences {tourCompleted?:boolean;dashboardWidgets?:string[]}

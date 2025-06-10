export interface SearchPayload {
  //budgetGroupCode: string;
  status: number;
  search: string;
  page: number;
  size: number;
};

export interface BudgetGroup {
  code: string;
  name: string;
}

export interface Budget {
  code: string;
  name: string;
  flexValue: string;
  requiredFlg: boolean | null;
}

export interface ContentItem {
  id: number;
  unitCode: string;
  unitName: string;
  //budgetGroups: BudgetGroup[]; // parsed from the JSON string
  startDate: string;
  endDate: string | null;
  note: string;
  organizationId: number;
  organizationCode: string;
  organizationName: string;
  deleted?: number;
  _checked?: number;
}

export interface Sort {
  sorted: boolean;
  empty: boolean;
  unsorted: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}


export interface OrganizationDetail {
  organizationId: number;
  organizationCode: string;
  organizationName: string;
}

export interface paramUpdatePush {
  unitCode: string;
  unitName: string;
  //budgetGroups: BudgetGroup[];
  startDate: string;  // You might want to use Date type if it's being processed as a Date object
  endDate: string;    // Same as above, Date type is preferred
  note: string;
  createdBy: string | null;
  organizationDetails: OrganizationDetail[];
  id?: string;
  type?: string;
}
export interface Organization {
  organizationId: number;
  code: string;
  name: string;
  createdDtg: string;
  createdBy: string;
  updatedDtg: string;
  updatedBy: string;
  deleted: number;
  version: number;
  active: number;
  displayOrder: number;
  breadCrumb: string;
  parentList: string;
  level: number;
  parentActive: number;
  codeGl: string;
  hrisOrganizationId: string;
  hrisOrgLevelManage: number;
  codeGlKeToanNoiBo: string;
  _checked?: boolean;
}

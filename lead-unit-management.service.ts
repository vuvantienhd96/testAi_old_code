import { Injectable } from '@angular/core';
import {BaseService} from "@pams-fe/shared/common/base-service";
import {map, Observable} from "rxjs";
import {environment} from "@pams-fe/shared/environment";
import { format, parse, isValid  } from 'date-fns';
import {
  Budget,
  ContentItem,
  Organization,
  PaginatedResponse, paramUpdatePush,
  SearchPayload
} from "../models/lead-unit-management.model";

@Injectable({
  providedIn: 'root'
})
export class LeadUnitManagementService extends BaseService {
  private url = '/v1.0/risk-focal-units/';

  public searchBasic(params: SearchPayload): Observable<PaginatedResponse<ContentItem>> {
    let urlEndPoint = this.url + 'search';
    const httpParams = this.toParams(params);
    return this.get(environment.pamsCommon, urlEndPoint, { params: httpParams }).pipe(map(res => res.data));
  }

  public budgetCommon(): Observable<Budget[]> {
    let urlEndPoint = '/v1.0/budget/category-ancestor-code?flexValueSetName=PAM_COA_BUDGET_ROOT_LEVEL_BANK&transactionCateg=CONTRACT&page=0&size=10000&hideLoading=true';
    return this.get(environment.pamsCommon, urlEndPoint, undefined).pipe(map(res => res?.data?.content));
    // let urlEndPoint = '/v1.0/bud_flexvalue/category-flex-value-parent'
    // return this.get(environment.budgetUrl, urlEndPoint, undefined).pipe(map(res => res?.data?.content));
  }


  public deleteById(id: (number | null | undefined)) {
    let urlEndPoint = this.url + `delete/${id}`;
    return this.delete(environment.pamsCommon, urlEndPoint, undefined);
  }

  public confirmSource(param: any) {
    let urlEndPoint = `/v1.0/risk-focal-units/submit-import?key=${param?.data?.key}`
    return this.post(environment.pamsCommon, urlEndPoint, undefined);
  }


  export(params: any): Observable<any> {
    let urlEndPoint = 'v1.0/risk-focal-units/export';
    return this.getRequestFile(environment.pamsCommon, urlEndPoint, {params});
  }

  getListUnit(search =  ''): Observable<PaginatedResponse<Organization>> {
    let urlEndPoint = `v1.0/risk-focal-units/search-organization?search=${search}&page=0&size=10000`;
    return this.get(environment.pamsCommon, urlEndPoint, undefined).pipe(map(res => res.data));
  }

  parseFlexibleDate(input: string | Date): string {
    let date: Date;

    if (input instanceof Date) {
      date = input;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
      // Nếu là dạng 14/05/2025 thì dùng parse
      date = parse(input, 'dd/MM/yyyy', new Date());
    } else {
      // Nếu là dạng Wed May 14 2025 ... thì dùng new Date
      date = new Date(input);
    }

    // Kiểm tra hợp lệ
    if (!isValid(date)) {
      return 'Invalid Date';
    }

    return format(date, 'dd/MM/yyyy');
  }


  postSaveRiskFocalUnits(param: paramUpdatePush, type: string | undefined){
    const paramConvert = {
      ...param,
      startDate: this.parseFlexibleDate(param.startDate),
      endDate: param.endDate === null ? '' : this.parseFlexibleDate(param.endDate),
    };
    let urlEndPoint = 'v1.0/risk-focal-units/create';
    if(type === 'add'){
      return this.post(environment.pamsCommon, urlEndPoint, paramConvert).pipe(map(res => res.data));
    }else
      urlEndPoint = `v1.0/risk-focal-units/update/${param?.id}`;
      return this.put(environment.pamsCommon, urlEndPoint, paramConvert).pipe(map(res => res.data));



  }

  getDetailRiskManagement(id: number){
    let urlEndPoint = `v1.0/risk-focal-units/detail/${id}`;
    return this.get(environment.pamsCommon, urlEndPoint, undefined).pipe(map(res => res.data));
  }
}

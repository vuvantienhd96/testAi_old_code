import {AfterViewInit, ChangeDetectorRef, Component, Injector, Input, OnInit} from '@angular/core';
import {BaseComponent} from "@pams-fe/shared/common/base-component";
import {NzModalRef} from "ng-zorro-antd/modal";
import {Validators} from "@angular/forms";
import {noWhitespaceValidator} from "../../../../../../payment/feature/secured-asset-invoice/secured-asset-invoice-list/src/lib/validators/nospace.class";
import {
  Budget, BudgetGroup,
  ContentItem,
  Organization,
  PaginatedResponse,
  paramUpdatePush
} from "../data-access/models/lead-unit-management.model";
import {ReqVatOutDetail} from "../../../../../../payment/feature/secured-asset-invoice/secured-asset-invoice-list/src/lib/models/interface";
import {
  alphanumericUppercaseValidator,
  dateRangeValidator
} from "../data-access/validators/alphanumericUppercaseValidator.class";
import {differenceInCalendarDays,  parse, format} from "date-fns";
import {LeadUnitManagementService} from "../data-access/services/lead-unit-management.service";
import {NzSafeAny} from "ng-zorro-antd/core/types";
import {MBTableConfig, Pagination} from "@pams-fe/shared/data-access/models";
import {forkJoin, map, of, switchMap, tap} from "rxjs";
import { catchError } from 'rxjs/operators';
import {FunctionCode} from "@pams-fe/shared/common/constants";


@Component({
  selector: 'pams-fe-lead-unit-management-update',
  templateUrl: './lead-unit-management-update.component.html',
  styleUrls: ['./lead-unit-management-update.component.scss']
})
export class LeadUnitManagementUpdateComponent extends BaseComponent implements OnInit, AfterViewInit {

  constructor( injector: Injector,
               private modalRef: NzModalRef,
               private cdr: ChangeDetectorRef,
               private readonly leadUnitManagementService: LeadUnitManagementService
  ) {
    super(injector);
    this.objFunction = this.sessionService.getSessionData(
      `FUNCTION_${FunctionCode.RISK_MANAGEMENT}`
    );
  }

  public formModal = this.fb.group({
    unitCode: ['', [Validators.required, Validators.maxLength(20), alphanumericUppercaseValidator()]],
    unitName: ['', [Validators.required, noWhitespaceValidator()]],
    startDate: [new Date, [Validators.required]],
    endDate: [null],
    note: [''],
    //budgetGroups: [null, [Validators.required]]

  },
    {
      validators: dateRangeValidator('startDate', 'endDate')
    }
    );
  public dataPath: Partial<ContentItem> | undefined = undefined;
  public viewEye: string | undefined = undefined;
  @Input() addData!: (data: paramUpdatePush) => void; // Injected from parent component
  public isSubmitted = false;
  public mode: 'add' | 'edit' = 'add';
  private dateDisabled =  new Date();
  private tableHeaderShows: string[] = [];
  checkedTb: NzSafeAny[] = [];
  public listDataOrigin: Organization[] = [];
  public listDataOriginDrop: Organization[] = [];
  public listDataOriginDropId: ContentItem[] = [];
  private listDataChecked: Organization[] = [];
  public scrollTable: { x: string, y: string } = { x: '20vw', y: '490px' }
  tableConfig!: MBTableConfig;
  tableConfigDrop!: MBTableConfig;
  listBuggetGroup : Budget[] = [];
  private isSavecontinue = false;
  public OnSelectedCheck : number = 0;

  public saveDisable = true;
  public unitName = '';

  parsedDate = (input: any) => parse(input, 'dd/MM/yyyy', new Date());

  pagination = new Pagination();
  ngOnInit(): void {
    this.initTable();

    forkJoin([
      this.leadUnitManagementService.getListUnit().pipe(
        catchError(err => {
          // Handle error for getListUnit and return a fallback value (empty or default data)
          this.toastrCustom.error("Lỗi khi tải danh sách đơn vị!");
          return of({ data: { content: [], totalElements: 0, number: 0 } }); // Fallback value
        })
      ),
      this.leadUnitManagementService.budgetCommon().pipe(
        catchError(err => {
          // Handle error for budgetCommon and return a fallback value (empty or default data)
          this.toastrCustom.error("Lỗi khi tải thông tin ngân sách!");
          return of([]); // Fallback value
        })
      )
    ]).pipe(tap((res: any) => {


    })).subscribe(
      ([listUnitResponse, budgetResponse]: [any, any] )=> {
        // Handle the response from both APIs here
        this.listBuggetGroup = budgetResponse;
        //
        this.listDataOrigin = listUnitResponse?.content;
        this.tableConfig.total = listUnitResponse?.totalElements;
        this.tableConfig.pageIndex = listUnitResponse?.number + 1;
        // list budgetResponse
        if(this.dataPath){
          this.leadUnitManagementService.getDetailRiskManagement(this.dataPath?.id).subscribe(idItem => {
            this.mode = 'edit';
            this.listDataOriginDropId = [...idItem.organizationDetails];
            this.dataPath = idItem;
            this.formModal.patchValue(idItem);
            this.formModal.patchValue({
              //budgetGroups: idItem?.budgetGroups?.length > 0 ? idItem?.budgetGroups.map((el: BudgetGroup) => el.code) : [],
              startDate: format(this.parsedDate(idItem.startDate), 'yyyy-MM-dd'),
              endDate:  idItem.endDate === '' || idItem.endDate === null ? null : format(this.parsedDate(idItem.endDate), 'yyyy-MM-dd'),
            });
            // this.checkedTb = [...this.listDataOriginDropId];
            // Create a Set of codes in b for faster lookup
            let bCodes = new Set(idItem?.organizationDetails.map((item: ContentItem) => item.organizationId));
            this.listDataOrigin.forEach(el => {
              if(bCodes.has(el.organizationId)){
                el._checked = true
              }
            });
            const applyChecked = [...this.listDataOrigin.map((res:Organization) => {
              return {
                ...res,
                _checked: bCodes.has(res.organizationId) ? true : false
              }
            })]
            this.listDataOrigin = [...applyChecked];
            this.OnSelectedCheck = this.listDataOrigin.length > 0 ? this.listDataOrigin.filter(el => el._checked).length : 0;
            const idSelected = this.listDataOrigin?.map(item => item._checked);
            if(idSelected && idSelected.length) {
              this.checkedTb = this.listDataOrigin.filter(res => res._checked);
              this.listDataChecked = this.listDataOrigin.filter(res => res._checked);
              this.listDataOriginDrop = this.listDataOrigin.filter(res => res._checked);
            }
          });
        };
      },
      err => {
        // If an error occurs in the forkJoin, this will be triggered (though it's unlikely in this case due to catchError)
        this.toastrCustom.error(err?.message && err.status === 400 ? err?.message :  "Đã có lỗi xảy ra vui lòng liên hệ admin!");
      }
    );

  }

  ngAfterViewInit(): void {

  }

  public UpperCaseUnitCode($event: string){
    this.formModal.patchValue({
      unitCode: $event.toUpperCase()
    })
  }

  public handlePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    const cleanText = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '');
    event.preventDefault();
    this.formModal.get('unitCode')?.setValue(cleanText);
  }

  public preventInvalidKeys(event: KeyboardEvent): void {
    const key = event.key;
    const isAllowedKey = /^[A-Z0-9]$/.test(key.toUpperCase()) ||
      ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(key);
    if (!isAllowedKey) {
      event.preventDefault();
    }
  }

  public transformInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.formModal.get('unitCode')?.setValue(input.value, { emitEvent: false }); // Update form value
  }

  public searchUnit(){
    this.leadUnitManagementService.getListUnit(this.unitName).pipe(
      catchError(err => {
        // Handle error for getListUnit and return a fallback value (empty or default data)
        this.toastrCustom.error("Lỗi khi tải danh sách đơn vị!");
        return of({ data: { content: [], totalElements: 0, number: 0 } }); // Fallback value
      })
    ).subscribe((listUnitResponse: any) => {
      this.listDataOrigin = listUnitResponse?.content;
      this.tableConfig.total = listUnitResponse?.totalElements;
      this.tableConfig.pageIndex = listUnitResponse?.number + 1;
      //

      this.OnSelectedCheck = this.listDataOriginDrop.length > 0 ? this.listDataOrigin.filter(el => el._checked).length : 0;
      const idSelected = this.listDataOriginDrop?.map(item => item._checked);
      if(idSelected && idSelected.length) {
        this.checkedTb = this.listDataOriginDrop.filter(res => res._checked);
        this.listDataChecked = this.listDataOriginDrop.filter(res => res._checked);
        this.listDataOriginDrop = this.listDataOriginDrop.filter(res => res._checked);
      }
    })
  };

  headerChecked($event: any) {
    if ($event) {
      this.tableHeaderShows = $event.filter(item => item.field).map(item => { return item.field })
    }
  }

  changePage($event: number){

  }

  changePageSize($event: number){

  }

  selectedChange($event: any) {
    if ($event) {
      this.listDataChecked = $event;
    }
    this.OnSelectedCheck =  this.listDataChecked.length > 0 ? this.listDataChecked.filter(e => e._checked === true).length : 0;
    if(this.mode === 'add' || this.mode === 'edit'){
      this.listDataOriginDrop = [...this.listDataChecked];
    }
  }

  public disabledRequisitionDate = (current: Date): boolean => {
    // if(this.mode === 'edit' && this.formModal.get("startDate")?.value === null || this.mode === 'edit' && this.formModal.get("startDate")?.value) {
    //   return differenceInCalendarDays(current, new Date()) < 0;
    // }else if(this.formModal.get("startDate")?.value === null) return differenceInCalendarDays(current, new Date(this.dateDisabled)) < 0;
    // return this.formModal?.value?.requisitionDate ? differenceInCalendarDays(current, new Date(this.dateDisabled)) < 0 : false;
    return differenceInCalendarDays(current, new Date(this.dateDisabled)) < 0;
  }

  initTable() {
    this.tableConfig = this.getDefaultColumn();
    this.tableConfigDrop = this.getDefaultColumnDrop();
    this.pagination.pageNumber = 1;

    this.tableConfig.pageIndex = 1 ? this.tableConfig.pageIndex : 1;

    //Bat buoc phai co total de hien paging
    this.tableConfig.total = 10;
    this.tableConfig.pageIndex = 1 ? this.tableConfig.pageIndex : 1;

  }

  public doClose(){
    this.modalRef.close();
  }

  public doSave() {
    this.isSubmitted = true;
    this.formModal.patchValue({
      description: this.formModal.get("description")?.value?.trim()
    });

    if(this.formModal.valid){
      if((this.mode === 'add' || this.mode === 'edit') && this.listDataChecked.length <=0){
        this.toastrCustom.warning("Trường bắt buộc nhập với loại đơn vị");
        return;
      }
      if(this.mode === 'add'){
        this.modalRef.close({
          ...this.formModal.value,
          //budgetGroups: this.listBuggetGroup.filter((item: Budget) => this.formModal.value.budgetGroups.includes(item.code)),
          organizationDetails: [...this.listDataChecked],
          type: this.mode
        });
      }else if(this.mode === 'edit'){
        // console.log(this.listDataOriginDropId, "========listDataOriginDropId"); // SOURCE GET FROM ID
        // console.log(this.listDataOriginDrop, "======== this.listDataOriginDrop"); // SOURCE CHECKED
        // const a = [...this.listDataOriginDrop];
        // a.forEach(el => el._checked = true);
        // const b = [...this.listDataOriginDropId];
        // //console.log(this.buildPayloadToSend(a, b));
        // console.log(this.buildPayloadToSend2(a, b));
        this.modalRef.close({
          ...this.formModal.value,
          //budgetGroups: this.listBuggetGroup.filter((item: Budget) => this.formModal.value.budgetGroups.includes(item.code)),
          organizationDetails: [...this.listDataOriginDrop],
          type: this.mode,
          id: this.dataPath?.id
        });

      }

      this.listDataChecked = [];
      this.listDataOriginDrop = [];
      this.checkedTb = [];
      this.formModal.reset(); // Reset form for new input
      this.isSubmitted = false;
    }else {
      console.log("error form");
    }
  };

   buildPayloadToSend(a: any[], b: any[]) {
    const aIds = new Set(a.map(item => item.organizationId));
    const bIds = new Set(b.map(item => item.organizationId));
    const result: any[] = [];

    // ✅ TH1: item từ b mà không tồn tại trong a => Thêm mới
    for (const itemB of b) {
      if (!aIds.has(itemB.organizationId)) {
        result.push({
          organizationId: itemB.organizationId,
          deleted: 0
        });
      }
    }

    // ✅ TH2: item từ a mà không tồn tại trong b => Mark là đã xóa (deleted = 1)
    for (const itemA of a) {
      if (!bIds.has(itemA.organizationId)) {
        result.push({
          id: itemA.id,
          organizationId: itemA.organizationId,
          deleted: itemA.deleted === 0 ? 0 : 1
        });
      }
    }

    return result;
  }

  public doSaveToAdd(){
    this.isSubmitted = true;
    if(this.formModal.valid && this.mode === 'add'){
        if(this.listDataChecked.length <=0){
          this.toastrCustom.warning("Trường bắt buộc nhập với loại đơn vị");
          return;
        }
      this.formModal.patchValue({
        description: this.formModal.get("note")?.value?.trim()
      });
      this.addData({
        ...this.formModal.value,
        //budgetGroups: this.listBuggetGroup.filter((item: Budget) => this.formModal.value.budgetGroups.includes(item.code)),
        organizationDetails: [...this.listDataChecked],
        type: 'saveToAdd'
      }); // Send data to the parent
      this.listDataChecked = [];
      this.listDataOriginDrop = [];
      this.checkedTb = [];
      this.formModal.reset(); // Reset form for new input
      this.isSubmitted = false;
      this.isSavecontinue = true;
    }
  };

  private getDefaultColumn() {
    const df: MBTableConfig =
      {
        headers: [
          {
            title: 'Mã đơn vị',
            field: 'code',
            width: 50,
            tdClassList: ['text-center'],
            thClassList: ['text-center'],

          },
          {
            title: 'Tên đơn vị',
            field: 'name',
            width: 50,
            tdClassList: ['text-center'],
            thClassList: ['text-center'],
            listOfFilter: this.listDataOrigin.map(res => {
             return {
               name: res.name,
               code: res.code
             }
            }),
            filterFn: (list: string[], item: any) => list.some(name => item.name.indexOf(name) !== -1)
          },
        ],
        total: 0,
        needScroll: true,
        loading: false,
        size: 'small',
        pageIndex: 1,
        pageSize: this.pagination.pageSize,
        showFrontPagination: false,
        widthIndex: '15px',
        widthCheckboxTH: '10px',
        showCheckbox: true,

      };

    return df;
  }
  private getDefaultColumnDrop() {
    const df: MBTableConfig =
      {
        headers: [
          {
            title: 'Mã đơn vị',
            field: 'code',
            width: 50,
            tdClassList: ['text-center'],
            thClassList: ['text-center'],

          },
          {
            title: 'Tên đơn vị',
            field: 'name',
            width: 50,
            tdClassList: ['text-center'],
            thClassList: ['text-center'],
          },
        ],
        total: 0,
        needScroll: true,
        loading: false,
        size: 'small',
        pageIndex: 1,
        pageSize: this.pagination.pageSize,
        showFrontPagination: false,
        widthIndex: '15px',
        widthCheckboxTH: '10px',
        showCheckbox: false,

      };

    return df;
  }

}

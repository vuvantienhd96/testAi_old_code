import {Component, Injector, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormGroup} from "@angular/forms";
import {BaseComponent} from "@pams-fe/shared/common/base-component";
import {Pagination, TableConfig} from "@pams-fe/shared/data-access/models";
import {Constant} from "@pams-fe/budget/data-access/models/budget-plan";
import {FunctionCode, SessionKey, userConfig} from "@pams-fe/shared/common/constants";
import {LeadUnitManagementService} from "../data-access/services/lead-unit-management.service";
import {Budget, ContentItem, paramUpdatePush, SearchPayload} from "../data-access/models/lead-unit-management.model";
import {NzSafeAny} from "ng-zorro-antd/core/types";
import {
  MbPopupConfirmComponent,
  TypeIconModal
} from "../../../../../../shared/ui/mb-popup-confirm/src/lib/mb-popup-confirm/mb-popup-confirm.component";
import {NzModalRef} from "ng-zorro-antd/modal";
import * as saveAs from "file-saver";
import {environment} from "@pams-fe/shared/environment";
import {NzUploadFile} from "ng-zorro-antd/upload";
import {ListKtnbRequisitionDoc, User} from "@pams-fe/payment/data-access/models/backup-type";
import {arrayBufferToBase64} from "@pams-fe/shared/common/utils";
import {convertFile} from "@pams-fe/payment/feature/broker-commission";
import {ReqVatOutDetail} from "../../../../../../payment/feature/secured-asset-invoice/secured-asset-invoice-list/src/lib/models/interface";
import {switchMap, takeUntil, tap} from "rxjs";
import {LeadUnitManagementUpdateComponent} from "../lead-unit-management-update/lead-unit-management-update.component";

@Component({
  selector: 'pams-fe-lead-unit-management',
  templateUrl: './lead-unit-management.component.html',
  styleUrls: ['./lead-unit-management.component.scss']
})
export class LeadUnitManagementComponent extends BaseComponent implements OnInit {

  formSearch!: FormGroup;
  listBuggetGroup : Budget[] = [];
  listDataTransaction: ContentItem[] = [];
  listStatus: any = [{
    label: 'Còn hiệu lực',
    value: 1,
    bgColor: '#DAFCE2',
    color: '#1D6E6E'
  },
    {
      label: 'Hết hiệu lực',
      value: 0,
      bgColor: '#FEDDD4',
      color: '#700840'
    }];
  constant = Constant;
  limit = userConfig.pageSize;
  tableConfigTransaction: TableConfig = new TableConfig();
  paramSearchTransaction: SearchPayload = {
    //budgetGroupCode: '',
    status: 1,
    search: '',
    size: this.limit,
    page: 0
  };

  private readonly textCenter = 'text-center';
  private readonly textRight = 'text-right';
  private readonly textLeft = 'text-left';
  pagination = new Pagination();
  @ViewChild("actionTmpl", { static: true }) actionStatus!: TemplateRef<NzSafeAny>;
  @ViewChild("linkUnit", { static: true }) linkUnit!: TemplateRef<NzSafeAny>;
  @ViewChild("organizationCodeTml", { static: true }) organizationCodeTml!: TemplateRef<NzSafeAny>;
  @ViewChild("workflow", { static: true }) workflow!: TemplateRef<NzSafeAny>;
  @ViewChild("budgetGroupsTml", { static: true }) budgetGroupsTml!: TemplateRef<NzSafeAny>;
  private bineArray = '';

  public isImportTabInfo = false;
  public baseUrl = environment.pamsCommon;
  public urlDownloadImportInfo =
    'v1.0/risk-focal-units/template';
  public urlImportInfo = 'v1.0/risk-focal-units/import';
  private listDataInvoiceList: paramUpdatePush  | undefined= undefined;
  public isShowLogPopup = false;

  constructor(
    injector: Injector,
    private readonly leadUnitManagementService: LeadUnitManagementService
  ) {
    super(injector);
    this.objFunction = this.sessionService.getSessionData(
      `FUNCTION_${FunctionCode.RISK_MANAGEMENT}`
    );
    this.formSearch = this.fb.group({
      search: [''],
      //budgetGroupCode: [null],
      status: [null]
    });
  }


  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem(SessionKey.CURRENCY_USER) || '');
    this.initTable();
    this.leadUnitManagementService.budgetCommon().subscribe(res => {
      this.listBuggetGroup = res;
    }, err => {
      this.toastrCustom.error("Đã có lỗi xảy ra vui lòng liên hệ admin!")
    })
    this.basicSearch();
  }

  private user?: User;

  public addFileDocument(files: NzUploadFile[]) {
    files.map((value, index: number) => {
      const file: ListKtnbRequisitionDoc = {
        reqDocId: new Date().getTime(),
        context: value.type,
        documentName: value.name,
        creatorId: this.user?.username,
        // creatorId: 'PAMS',
        docType: `A`,
        attribute5: '0',
        creationDate: new Date(),
        secureDoc: 'N',
        isEditDocument: false,
        lineNum: index + 1,
        fileContent: {
          fileName: value.name,
          contentType: value.type,
          base64FileContent: arrayBufferToBase64(value),
        },
        file: value,
        keyMap: this.uuid,
      };
      (file.groupDocumentName = file.documentName),
        // file.isXML = this.isCheckFileXML(file);
        this.spinnerService.requestStart();
      convertFile(value).subscribe((base64) => {
        if (file.fileContent) {
          file.fileContent.base64FileContent = base64;
        }
        // this.listDocumentAttachOrigin.push(file);
        // this.listDocumentAttach = [...this.listDocumentAttach, file];
        this.spinnerService.requestEnd();
      });
    });
  };

  public importDataInfo(data: any) {
    this.bineArray = '';
    if(!data?.data?.errorFile){
      const param = {
        key: data?.key,
        // name: data?.unitName,
        title: 'Xác nhận ',
        description: 'Bạn đang thay đổi cấu hình danh sách đơn vị đầu mối, Hệ thống sẽ tự động chuyển các cấu hình cũ về trạng thái hết hiệu lực. bạn có chắc chắn muốn thay đổi không',
        btnLeft: 'Thoát',
        btnRight: 'Xác nhận'
      }
      this.modalRef = this.modal.create({
        nzContent: MbPopupConfirmComponent,
        nzComponentParams: {
          param: param,
          src: TypeIconModal.warningYellow
        },
        nzWrapClassName: "mb-popup-confirm",
        nzWidth: '450px',
        nzCentered: true,
        nzFooter: null,
      });
      this.modalRef.afterClose.subscribe((e) => {
        if (e) {
          this.confirmSource(data);
        }
      });
    }else if(data.data.errorFile){
      this.isShowLogPopup = true;
      this.bineArray = data.data.errorFile;
    }
  };

  searchTransaction(page: number) {
    this.paramSearchTransaction.page = page - 1;
    this.basicSearch();
  }

  public basicSearch(type?: string){

    this.paramSearchTransaction = {
      ...this.paramSearchTransaction,
      ...this.formSearch.getRawValue()
    }
    if(type === 'action'){
      this.paramSearchTransaction = {
        ...this.paramSearchTransaction,
        page: 0 // reset page
      }
    };
    this.leadUnitManagementService.searchBasic(this.paramSearchTransaction).subscribe(res => {
      this.listDataTransaction = res.content;
      this.tableConfigTransaction.total = res.totalElements;
      this.tableConfigTransaction.pageIndex = this.paramSearchTransaction.page + 1;
    }, err=>{
      this.toastrCustom.error("Đã có lỗi xảy ra vui lòng liên hệ admin!")
    })
  }

  public handleChangeTypeStatus(event: number){

  }


  public ConvertJson(string: any){
    return JSON.parse(string);
  }

  modalRef: NzModalRef | undefined;

  // warning
  override ngOnDestroy() {
    super.ngOnDestroy();
    this.modalRef?.destroy();
  }

  public doCloseImportInfo(isClose: boolean) {
    this.isImportTabInfo = false;
  }

  private uuid = '';
  public doUUID(uuid: string) {
    this.uuid = uuid;
  };

  public deleteAction(data: ContentItem) {
    const param = {
      id: data?.id,
      name: data?.unitName,
      title: 'Xóa liên kết đơn vị',
      description: 'Bạn chắc chắn muốn xóa liên kết đơn vị dầu mối',
      btnLeft: 'Thoát'
    }
    this.modalRef = this.modal.create({
      nzContent: MbPopupConfirmComponent,
      nzComponentParams: {
        param: param,
      },
      nzWrapClassName: "mb-popup-confirm",
      nzWidth: '450px',
      nzCentered: true,
      nzFooter: null
    });
    this.modalRef.afterClose.subscribe((e) => {
      if (e) {
        this.deleteAfterConfirm(data);
      }
    });
  }

  exportExel() {

    let params = {
      search:this.formSearch.getRawValue().search ? this.formSearch.getRawValue().search : "",
      status: this.formSearch.getRawValue().status ? this.formSearch.getRawValue().status : "",
    }
    this.leadUnitManagementService.export(params).subscribe({
      next: (res) => {
        const arr = res.headers.get("Content-Disposition")?.split(';');
        const fileName: string = arr[arr.length - 1].replace('filename=', '').replace(/["\s]/g, '');
        saveAs(res.body, fileName);
      },
      error: async (err: Blob) => {
        const str = await err.text();
        const obj = JSON.parse(str);
        this.toastrCustom.error(obj?.message || '');
      }
    })
  };

  exportExelError(){
// Remove data URI prefix if exists
    const base64Data = this.bineArray.replace(/^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/, '');

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const fileName = 'ImportDonViDauMoiLoi.xlsx';
    saveAs(blob, fileName);
  }

  deleteAfterConfirm(data: ContentItem) {
    this.leadUnitManagementService.deleteById(data.id).subscribe({
      next: (result) => {
        this.toastrCustom.success(this.translate.instant('Xóa bản ghi thành công.'));
        this.basicSearch();

      },
      error: (err) => {
        let title = "Không thể xóa danh mục";
        let content = err?.message || err?.error;
        this.toastrCustom.error(this.translate.instant(content));
       // this.showPopupWarningFail(title, content);
      }
    });
  }

  private confirmSource(data: any){
    this.leadUnitManagementService.confirmSource(data).subscribe({
      next: (result) => {
        this.toastrCustom.success(this.translate.instant('Thực hiện verify file và import dữ liệu vào hệ thống thành công.'));
        this.basicSearch();

      },
      error: (err) => {
        this.toastrCustom.error(this.translate.instant('Thực hiện verify file và import dữ liệu vào hệ thống không thành công.'));
      }
    });
  }

  private titleString = '';

  public add(dataPath?: Partial<ContentItem>, viewEye?: string) {
    this.titleString = viewEye === 'add' ? 'Thêm thông tin đơn vị đầu mối' : 'Chỉnh sửa đơn vị đầu mối';
    this.modalRef = this.modal.create({
      nzTitle: this.titleString,
      nzContent: LeadUnitManagementUpdateComponent,
      nzWrapClassName: "approval-start-period",
      nzWidth: '1450px',
      nzCentered: true,
      nzComponentParams: {
        // paramModalInit: this.paramModalInit,
        // currencyCode: this.form.get('currencyCode').value,
        // digitInfor: this.digitalinfo,
        dataPath,
        viewEye,
        addData: (data: paramUpdatePush) => {
          if(viewEye === 'edit'){
            this.listDataInvoiceList = data; // Append new data
          }else if(data?.type === 'saveToAdd'){
            this.listDataInvoiceList = data; // Append new data
            this.leadUnitManagementService.postSaveRiskFocalUnits({
             ...data
            }, 'add').pipe(switchMap(item => {
              return this.leadUnitManagementService.searchBasic(this.paramSearchTransaction)
            })).subscribe(res =>{
              this.listDataTransaction = res.content;
              this.tableConfigTransaction.total = res.totalElements;
              this.tableConfigTransaction.pageIndex = this.paramSearchTransaction.page + 1;
              this.toastrCustom.success("Cập nhập bản ghi thành công");
            }, err => {
              this.toastrCustom.error(err?.message && err.status === 400 ? err?.message :  "Đã có lỗi xảy ra vui lòng liên hệ admin!");
            })
          }else if((viewEye === 'add')){
            this.listDataInvoiceList = data; // Append new data

          }
        }
      },
    });
    this.modalRef.afterClose.pipe(takeUntil(this.destroy$)).subscribe((el) => {
      if(el?.type){
        this.leadUnitManagementService.postSaveRiskFocalUnits(el, el?.type).pipe(switchMap(res => {
          this.paramSearchTransaction = {
            ...this.paramSearchTransaction,
            ...this.formSearch.getRawValue()
          }
          return this.leadUnitManagementService.searchBasic(this.paramSearchTransaction)
        })).subscribe(res =>{
          this.listDataTransaction = res.content;
          this.tableConfigTransaction.total = res.totalElements;
          this.tableConfigTransaction.pageIndex = this.paramSearchTransaction.page + 1;
          this.toastrCustom.success(el?.type === 'add' ? "Tạo mới bản ghi thành công" : "Cập nhập bản ghi thành công")
        }, err => {
          this.toastrCustom.error(err?.message && err.status === 400 ? err?.message :  "Đã có lỗi xảy ra vui lòng liên hệ admin!");
        });
      }
    });
    // doSaveToAdd
  }

  public changePageNum(event: number){
    this.searchTransaction(event);
  };

  public changePageSize(sizeChange: number){
    this.paramSearchTransaction.size = sizeChange;
    this.searchTransaction(1);
    this.basicSearch();
  };

  private initTable(): void {
    this.tableConfigTransaction = {
      headers: [
        {
          title: 'STT',
          field: '',
          thClassList: [this.textCenter],
          tdClassList: [this.textCenter],
          rowspan: 2,
          width: 50
        },
        {
          title: 'QTRR',
          thClassList: [this.textCenter],
          colspan: 3,
          child: [
            {
              title: 'Mã đơn vị đầu mối',
              field: 'unitCode',
              thClassList: [this.textCenter],
              width: 100,
              tdTemplate: this.linkUnit,
            },
            {
              title: 'Tên đơn vị đầu mối',
              field: 'unitName',
              thClassList: [this.textCenter],
              width: 200,
            },
            // {
            //   title: 'Nhóm ngân sách',
            //   field: 'budgetGroups',
            //   thClassList: [this.textCenter],
            //   width: 250,
            //   tdTemplate: this.budgetGroupsTml,
            // },
            {
              title: 'Trạng thái',
              field: 'status',
              thClassList: [this.textCenter],
              width: 100,
              tdTemplate: this.actionStatus,
            }
          ]
        },
        {
          title: 'PAMS',
          thClassList: [this.textCenter],
          colspan: 2,
          child: [
            {
              title: 'Mã đơn vị',
              field: 'organizationCode',
              thClassList: [this.textCenter],
              tdTemplate: this.organizationCodeTml,
              width: 150,
            },
            {
              title: 'Tên đơn vị',
              field: 'organizationName',
              thClassList: [this.textCenter],
              width: 150,
            },
          ]
        },
        {
          title: 'Ghi chú',
          field: 'note',
          tdClassList: [this.textLeft],
          rowspan: 2,
          fixed: false,
          fixedDir: 'right',
          width: 150,
        },
        {
          title: ' ',
          field: '',
          tdTemplate: this.workflow,
          tdClassList: [this.textCenter],
          rowspan: 2,
          fixed: false,
          fixedDir: 'right',
          width: 100,
        }
      ],
      total: 0,
      needScroll: true,
      loading: false,
      size: 'small',
      pageSize: this.pagination.pageSize ?? userConfig.pageSize,
      pageIndex: 1
    }
  }
}

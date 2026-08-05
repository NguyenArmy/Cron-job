import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

type SchedulerForExport = {
  id: number;
  name: string;
  cron: string;
  timezone: string;
  isActive: boolean;
  description: string | null;
  lastRunTime: Date | null;
  nextRunTime: Date | null;
  createdBy: {
    name: string | null;
  };
  assignments: Array<{
    user: {
      name: string | null;
    };
  }>;
};


export type ImportSchedulerRow = {
  rowNumber: number;
  data: Record<string, unknown>;


}
export type ImportSchedulerError = {
  row: number;
  data: Record<string, unknown>;
  messages: string[];
};


@Injectable()
export class SchedulerExcelService {
  async exportSchedulers(schedulers: SchedulerForExport[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Scheduler System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Schedulers');

    //tạo tiêu đề cho các cột, key là tên thuộc tính dóng với column
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Tên lịch', key: 'name', width: 30 },
      { header: 'Cron', key: 'cron', width: 20 },
      { header: 'Timezone', key: 'timezone', width: 25 },
      { header: 'Trạng thái', key: 'isActive', width: 15 },
      { header: 'Mô tả', key: 'description', width: 35 },
      { header: 'Lần chạy gần nhất', key: 'lastRunTime', width: 24 },
      { header: 'Lần chạy tiếp theo', key: 'nextRunTime', width: 24 },
      { header: 'Người tạo', key: 'createdBy', width: 25 },
      { header: 'Người được giao', key: 'assignedUsers', width: 35 },
    ];

    //định dạng hàng tiêu đề, in đậm, màu chữ trắng, nền xanh
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };

    //lặp từng lịch một
    for (const scheduler of schedulers) {
      worksheet.addRow({
        id: scheduler.id,
        name: scheduler.name,
        cron: scheduler.cron,
        timezone: scheduler.timezone,
        isActive: scheduler.isActive ? 'Đang chạy' : 'Đã tạm dừng',
        description: scheduler.description ?? '',
        lastRunTime: scheduler.lastRunTime ?? '',
        nextRunTime: scheduler.nextRunTime ?? '',
        createdBy: scheduler.createdBy.name ?? '',
        assignedUsers: scheduler.assignments
          .map((assignment) => assignment.user.name ?? '')
          .filter(Boolean)
          .join(', '),
      });
    }
    //cố định hàng tiêu đề, cuộn xuống nó vẫn đứng yên
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    //thêm bộ lọc từ cột a đến j, người dùng có thể lọc lịch active haowcj tìm theo tên ngay trong excel
    worksheet.autoFilter = 'A1:J1';

    // trả về dữ liệu là buffer để người dùng tải về trên browser, không lưu file trên server
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
  async createImportTemplate(isAdmin: boolean): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Schedulers');
    worksheet.columns = [
      { header: 'name', key: 'name', width: 30 },
      { header: 'cron', key: 'cron', width: 20 },
      { header: 'timezone', key: 'timezone', width: 25 },
      { header: 'isActive', key: 'isActive', width: 15 },
      { header: 'description', key: 'description', width: 35 },
    ];
    if (isAdmin) {
      worksheet.columns = [
        ...worksheet.columns,
        {
          header: 'assignedUserIds',
          key: 'assignedUserIds',
          width: 25,
        },
      ];
    }
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    worksheet.addRow(
      isAdmin
        ? {
          name: 'Gửi báo cáo mỗi sáng',
          cron: '0 8 * * *',
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: 'true',
          description: 'Ví dụ scheduler',
          assignedUserIds: '1,2',
        }
        : {
          name: 'Nhắc việc cá nhân',
          cron: '0 8 * * *',
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: 'true',
          description: 'Ví dụ scheduler',
        },
    );
    for (let row = 2; row <= 1000; row++) {
      worksheet.getCell(`D${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"true,false"'],
      };
    }
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const guideSheet = workbook.addWorksheet('Hướng dẫn');

    guideSheet.columns = [
      { header: 'Cột', key: 'column', width: 25 },
      { header: 'Ý nghĩa', key: 'description', width: 70 },
    ];

    guideSheet.addRows([
      ['name', 'Bắt buộc. Tên scheduler.'],
      ['cron', 'Bắt buộc. Ví dụ: 0 8 * * * nghĩa là chạy lúc 08:00 mỗi ngày.'],
      ['timezone', 'Không bắt buộc. Ví dụ: Asia/Ho_Chi_Minh.'],
      ['isActive', 'Không bắt buộc. Chọn true hoặc false.'],
      ['description', 'Không bắt buộc. Mô tả scheduler.'],
      [
        'assignedUserIds',
        isAdmin
          ? 'Chỉ ADMIN dùng. ID user, ngăn cách bằng dấu phẩy. Ví dụ: 1,2,5.'
          : 'User thường không có cột này. Scheduler tự được giao cho chính bạn.',
      ],
    ]);

    const guideHeader = guideSheet.getRow(1);
    guideHeader.font = { bold: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // async readImportFile(fileBuffer: Buffer): Promise<ImportSchedulerRow[]> {
  //   const workbook = new ExcelJS.Workbook();

  //   try {
  //     await workbook.xlsx.load(new Uint8Array(fileBuffer).buffer);
  //   } catch {
  //     throw new BadRequestException('File Excel không hợp lệ hoặc bị hỏng');
  //   }

  //   const worksheet = workbook.getWorksheet('Schedulers');

  //   if (!worksheet) {
  //     throw new BadRequestException('File Excel phải có sheet tên Schedulers');
  //   }

  //   const rows: ImportSchedulerRow[] = [];

  //   worksheet.eachRow((row, rowNumber) => {
  //     if (rowNumber === 1) return; // Bỏ dòng tiêu đề

  //     const name = String(row.getCell(1).value ?? '').trim();
  //     const cron = String(row.getCell(2).value ?? '').trim();

  //     // Bỏ qua dòng trống
  //     if (!name && !cron) return;

  //     const assignedUserIds = String(row.getCell(6).value ?? '')
  //       .split(',')
  //       .map((id) => Number(id.trim()))
  //       .filter(Boolean);

  //     rows.push({
  //       rowNumber,
  //       data: {
  //         name,
  //         cron,
  //         timezone: String(row.getCell(3).value ?? '').trim() || undefined,
  //         isActive: String(row.getCell(4).value ?? '').toLowerCase() === 'true',
  //         description: String(row.getCell(5).value ?? '').trim() || undefined,
  //         assignedUserIds,
  //       },
  //     });
  //   });

  //   return rows;
  // }
  async createImportErrorFile(
    errors: ImportSchedulerError[],
    totalRows: number,
    importedCount: number,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Import errors');

    worksheet.columns = [
      { header: 'row', key: 'row', width: 10 },
      { header: 'name', key: 'name', width: 30 },
      { header: 'cron', key: 'cron', width: 20 },
      { header: 'timezone', key: 'timezone', width: 25 },
      { header: 'isActive', key: 'isActive', width: 15 },
      { header: 'description', key: 'description', width: 35 },
      { header: 'assignedUserIds', key: 'assignedUserIds', width: 25 },
      { header: 'errors', key: 'errors', width: 60 },
    ];

    for (const error of errors) {
      worksheet.addRow({
        row: error.row,
        ...error.data,
        errors: error.messages.join(' | '),
      });
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC2626' },
    };

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = 'A1:H1';

    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.addRows([
      ['totalRows', totalRows],
      ['importedCount', importedCount],
      ['failedCount', errors.length],
    ]);

    summarySheet.getRow(1).font = { bold: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async readImportFile(
    fileBuffer: Buffer,
  ): Promise<ImportSchedulerRow[]> {
    const workbook = new ExcelJS.Workbook();

    try {
      await workbook.xlsx.load(new Uint8Array(fileBuffer).buffer);
    } catch {
      throw new BadRequestException('File Excel không hợp lệ hoặc bị hỏng');
    }

    const worksheet = workbook.getWorksheet('Schedulers');

    if (!worksheet) {
      throw new BadRequestException(
        'File Excel phải có sheet tên Schedulers',
      );
    }

    const rows: ImportSchedulerRow[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const name = String(row.getCell(1).value ?? '').trim();
      const cron = String(row.getCell(2).value ?? '').trim();
      const timezone = String(row.getCell(3).value ?? '').trim();
      const isActive = String(row.getCell(4).value ?? '').trim();
      const description = String(row.getCell(5).value ?? '').trim();
      const assignedUserIds = String(row.getCell(6).value ?? '').trim();

      // Chỉ bỏ qua dòng hoàn toàn rỗng.
      if (
        !name &&
        !cron &&
        !timezone &&
        !isActive &&
        !description &&
        !assignedUserIds
      ) {
        return;
      }

      rows.push({
        rowNumber,
        data: {
          name,
          cron,
          timezone: timezone || undefined,
          isActive: isActive || undefined,
          description: description || undefined,
          assignedUserIds: assignedUserIds || undefined,
        },
      });
    });

    return rows;
  }
}

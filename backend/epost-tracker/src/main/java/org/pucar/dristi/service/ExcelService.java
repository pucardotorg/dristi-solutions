package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.model.EPostResponse;
import org.pucar.dristi.model.EPostTracker;
import org.pucar.dristi.model.EPostTrackerSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@Slf4j
public class ExcelService {

    private final EPostService ePostService;

    @Autowired
    public ExcelService(EPostService ePostService) {
        this.ePostService = ePostService;
    }

    public byte[] generateExcel(EPostTrackerSearchRequest request) {
        log.info("Generating Excel for request: {}", request);

        // Fetch data
        EPostResponse ePostResponse = ePostService.getAllEPost(request, 1000, 0);
        List<EPostTracker> ePostTrackers = ePostResponse.getEPostTrackers();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Monthly E-Post Report");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "Speed Post ID",
                    "Process ID",
                    "Processing Hub",
                    "Booking Date",
                    "Total Amount"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // Fill rows with data
            int rowNum = 1;
            for (EPostTracker tracker : ePostTrackers) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(
                        tracker.getSpeedPostId() != null ? tracker.getSpeedPostId() : ""
                );
                row.createCell(1).setCellValue(
                        tracker.getProcessNumber() != null ? tracker.getProcessNumber() : ""
                );
                row.createCell(2).setCellValue(
                        tracker.getPostalHub() != null ? tracker.getPostalHub() : ""
                );

                // Convert bookingDate (Long timestamp) to readable date
                if (tracker.getBookingDate() != null) {
                    Cell dateCell = row.createCell(3);
                    CreationHelper createHelper = workbook.getCreationHelper();
                    CellStyle dateStyle = workbook.createCellStyle();
                    dateStyle.setDataFormat(
                            createHelper.createDataFormat().getFormat("dd-MM-yyyy")
                    );
                    dateCell.setCellStyle(dateStyle);
                    dateCell.setCellValue(new java.util.Date(tracker.getBookingDate()));
                } else {
                    row.createCell(3).setCellValue("");
                }

                row.createCell(4).setCellValue(
                        tracker.getTotalAmount() != null ? tracker.getTotalAmount() : ""
                );
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            log.error("Error while generating Excel", e);
            throw new CustomException("Error while generating Excel", e.getMessage());
        }
    }

}


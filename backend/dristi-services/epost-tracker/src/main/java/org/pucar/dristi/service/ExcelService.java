package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.model.EPostResponse;
import org.pucar.dristi.model.EPostTracker;
import org.pucar.dristi.model.EPostTrackerSearchRequest;
import org.pucar.dristi.model.ExcelSheetType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@Slf4j
public class ExcelService {

    private final EPostService ePostService;

    private final EPostConfiguration ePostConfiguration;

    @Autowired
    public ExcelService(EPostService ePostService, EPostConfiguration ePostConfiguration) {
        this.ePostService = ePostService;
        this.ePostConfiguration = ePostConfiguration;
    }

    public byte[] generateExcel(EPostTrackerSearchRequest request) {
        log.info("Generating Excel for request: {}", request);
        try {

            if (ExcelSheetType.MONTHLY_REPORT_EMAIL.equals(request.getEPostTrackerSearchCriteria().getExcelSheetType()) || ExcelSheetType.REPORTS_TAB.equals(request.getEPostTrackerSearchCriteria().getExcelSheetType())) {

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
            else if (ExcelSheetType.PENDING_BOOKING_TAB.equals(request.getEPostTrackerSearchCriteria().getExcelSheetType())) {
                EPostResponse ePostResponse = ePostService.getAllEPost(request, 1000, 0);
                List<EPostTracker> ePostTrackers = ePostResponse.getEPostTrackers();

                try (Workbook workbook = new XSSFWorkbook()) {
                    Sheet sheet = workbook.createSheet("Pending E-Post");

                    // Create header row
                    Row headerRow = sheet.createRow(0);
                    String[] headers = {
                            "SERIAL NUMBER",
                            "BARCODE NO",
                            "PHYSICAL WEIGHT",
                            "REG",
                            "OTP",
                            "RECEIVER CITY",
                            "RECEIVER PINCODE",
                            "RECEIVER NAME",
                            "RECEIVER ADD LINE 1",
                            "RECEIVER ADD LINE 2",
                            "RECEIVER ADD LINE 3",
                            "ACK",
                            "SENDER MOBILE NO",
                            "RECEIVER MOBILE NO",
                            "PREPAYMENT CODE",
                            "VALUE OF PREPAYMENT",
                            "CODR/COD",
                            "VALUE FOR CODR/COD",
                            "INSURANCE TYPE",
                            "VALUE OF INSURANCE",
                            "SHAPE OF ARTICLE",
                            "LENGTH",
                            "BREADTH/DIAMETER",
                            "HEIGHT",
                            "PRIORITY FLAG",
                            "DELIVERY INSTRUCTION",
                            "DELIVERY SLOT",
                            "INSTRUCTION RTS",
                            "SENDER NAME",
                            "SENDER COMPANY NAME",
                            "SENDER CITY",
                            "SENDER STATE/UT",
                            "SENDER PINCODE",
                            "SENDER EMAILID",
                            "SENDER ALT CONTACT",
                            "SENDER KYC",
                            "SENDER TAX",
                            "RECEIVER COMPANY NAME",
                            "RECEIVER STATE/UT",
                            "RECEIVER EMAILID",
                            "RECEIVER ALT CONTACT",
                            "RECEIVER KYC",
                            "RECEIVER TAX REF",
                            "ALT ADDRESS FLAG",
                            "BULK REFERENCE",
                            "SENDER ADD LINE 1",
                            "SENDER ADD LINE 2",
                            "SENDER ADD LINE 3"
                    };

                    for (int i = 0; i < headers.length; i++) {
                        Cell cell = headerRow.createCell(i);
                        cell.setCellValue(headers[i]);
                    }

                    // Fill rows with data
                    int rowNum = 1;
                    for (EPostTracker tracker : ePostTrackers) {
                        Row row = sheet.createRow(rowNum++);

                        row.createCell(0).setCellValue(rowNum - 1); // Serial number
                        row.createCell(1).setCellValue(""); // Barcode no
                        row.createCell(2).setCellValue(ePostConfiguration.getEpostPhysicalWeight()); // Physical weight
                        row.createCell(3).setCellValue(ePostConfiguration.getEpostReg()); // REG
                        row.createCell(4).setCellValue(ePostConfiguration.getEpostOtp()); // OTP
                        row.createCell(5).setCellValue(tracker.getAddressObj().getCity()); // Receiver city
                        row.createCell(6).setCellValue(tracker.getAddressObj().getPinCode()); // Receiver pincode
                        row.createCell(7).setCellValue(tracker.getRespondentName()); // Receiver name
                        row.createCell(8).setCellValue(tracker.getAddressObj().getLocality()); // Receiver add line 1
                        row.createCell(9).setCellValue(tracker.getAddressObj().getDistrict()); // Receiver add line 2
                        row.createCell(10).setCellValue(""); // Receiver add line 3
                        row.createCell(11).setCellValue(ePostConfiguration.getEpostAck()); // ACK
                        row.createCell(12).setCellValue(ePostConfiguration.getEpostSenderMobileNo()); // Sender mobile no
                        row.createCell(13).setCellValue(tracker.getPhone()); // Receiver mobile no
                        row.createCell(14).setCellValue(""); // Prepayment code
                        row.createCell(15).setCellValue(""); // Value of prepayment
                        row.createCell(16).setCellValue(""); // CODR/COD
                        row.createCell(17).setCellValue(""); // Value for CODR/COD
                        row.createCell(18).setCellValue(""); // Insurance type
                        row.createCell(19).setCellValue(""); // Value of insurance
                        row.createCell(20).setCellValue(""); // Shape of article
                        row.createCell(21).setCellValue(""); // Length
                        row.createCell(22).setCellValue(""); // Breadth/Diameter
                        row.createCell(23).setCellValue(""); // Height
                        row.createCell(24).setCellValue(""); // Priority flag
                        row.createCell(25).setCellValue(""); // Delivery instruction
                        row.createCell(26).setCellValue(""); // Delivery slot
                        row.createCell(27).setCellValue(""); // Instruction RTS
                        row.createCell(28).setCellValue(ePostConfiguration.getEpostSenderName()); // Sender name
                        row.createCell(29).setCellValue(""); // Sender company name
                        row.createCell(30).setCellValue(ePostConfiguration.getEpostSenderCity()); // Sender city
                        row.createCell(31).setCellValue(ePostConfiguration.getEpostSenderState()); // Sender state/UT
                        row.createCell(32).setCellValue(ePostConfiguration.getEpostSenderPinCode()); // Sender pincode
                        row.createCell(33).setCellValue(""); // Sender emailid
                        row.createCell(34).setCellValue(""); // Sender alt contact
                        row.createCell(35).setCellValue(""); // Sender KYC
                        row.createCell(36).setCellValue(""); // Sender tax
                        row.createCell(37).setCellValue(""); // Receiver company name
                        row.createCell(38).setCellValue(tracker.getAddressObj().getState()); // Receiver state/UT
                        row.createCell(39).setCellValue(""); // Receiver emailid
                        row.createCell(40).setCellValue(""); // Receiver alt contact
                        row.createCell(41).setCellValue(""); // Receiver KYC
                        row.createCell(42).setCellValue(""); // Receiver tax ref
                        row.createCell(43).setCellValue(ePostConfiguration.getEpostAltAddressFlag()); // Alt address flag
                        row.createCell(44).setCellValue(""); // Bulk reference
                        row.createCell(45).setCellValue(ePostConfiguration.getEpostSenderAddressLineOne()); // Sender add line 1
                        row.createCell(46).setCellValue(ePostConfiguration.getEpostSenderAddressLineTwo()); // Sender add line 2
                        row.createCell(47).setCellValue(""); // Sender add line 3
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
            else {
                log.error("Unsupported ExcelSheetType: {}", request.getEPostTrackerSearchCriteria().getExcelSheetType());
            }
        } catch (CustomException e) {
            log.error("Error while generating Excel", e);
            return null;
        }
        return null;
    }

}


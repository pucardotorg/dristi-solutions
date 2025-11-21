package org.egov.opencv.service;

import net.sourceforge.tess4j.ITessAPI;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Word;
import org.egov.opencv.model.FileReadableResponse;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.List;

@Service
public class ImageValidationService {

    static {
        System.loadLibrary(Core.NATIVE_LIBRARY_NAME);
    }

    private final ITesseract tesseract;

    public ImageValidationService(ITesseract tesseract) {
        this.tesseract = tesseract;
        this.tesseract.setDatapath("src/main/resources/tessdata");
        this.tesseract.setLanguage("eng");
    }

    public FileReadableResponse validateImage(MultipartFile file, FileReadableResponse fileReadableResponse) {
        try {

            // Convert MultipartFile to Mat
            Mat img = Imgcodecs.imdecode(new MatOfByte(file.getBytes()), Imgcodecs.IMREAD_COLOR);

            if (img.empty()) {
                fileReadableResponse.setIsValid(Boolean.FALSE);
                fileReadableResponse.setMessage("Image is not readable");
                return fileReadableResponse;
            }

            // Convert to grayscale
            Mat gray = new Mat();
            Imgproc.cvtColor(img, gray, Imgproc.COLOR_BGR2GRAY);

            // Compute Laplacian variance
            Mat laplacian = new Mat();
            Imgproc.Laplacian(gray, laplacian, CvType.CV_64F);
            MatOfDouble mu = new MatOfDouble();
            MatOfDouble sigma = new MatOfDouble();
            Core.meanStdDev(laplacian, mu, sigma);

            double variance = Math.pow(sigma.get(0, 0)[0], 2);
            System.out.println("Laplacian variance: " + variance);

            // Threshold for blur detection
            if (variance < 100) { // adjust threshold based on testing
                fileReadableResponse.setIsValid(Boolean.FALSE);
                fileReadableResponse.setMessage("Image is too blurry");
                return fileReadableResponse;
            }

            // Save temp file for OCR
            File tempFile = File.createTempFile("upload_", ".png");
            Imgcodecs.imwrite(tempFile.getAbsolutePath(), img);
            BufferedImage bufferedImage = ImageIO.read(tempFile);

            // OCR with confidence
            List<Word> words = tesseract.getWords(bufferedImage, ITessAPI.TessPageIteratorLevel.RIL_WORD);
            double totalConfidence = 0;
            for (Word w : words) {
                totalConfidence += w.getConfidence();
            }
            double avgConfidence = words.isEmpty() ? 0 : totalConfidence / words.size();

            System.out.println("OCR Confidence: " + avgConfidence);

            if (avgConfidence < 70) { // confidence threshold (adjustable)
                fileReadableResponse.setIsValid(Boolean.FALSE);
                fileReadableResponse.setMessage("OCR confidence too low: " + avgConfidence + "%. Please upload a clearer image.");
                return fileReadableResponse;
            }

            fileReadableResponse.setIsValid(Boolean.TRUE);
            fileReadableResponse.setMessage("Image is valid. OCR confidence: " + avgConfidence + "%");


        } catch (Exception e) {
            fileReadableResponse.setIsValid(Boolean.FALSE);
            fileReadableResponse.setMessage("Error reading image: " + e.getMessage());
            return fileReadableResponse;
        }

        fileReadableResponse.setIsValid(Boolean.TRUE);
        fileReadableResponse.setMessage("Image is readable");
        return fileReadableResponse;
    }
}
